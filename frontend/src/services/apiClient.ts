/**
 * COSMOLOOKUP — Central Unified API Client
 * Reconciles Phase 3B/4 (PR #10: Measurement Catalog, Baselines, Context/Modality Filters)
 * and Phase 2C/D/E (PR #11: Trends, Freshness, Assessments, Alerts Lifecycle).
 */

import { Astronaut, AstronautListResponse } from '../types/astronaut';
import { MeasurementListResponse } from '../types/measurement';
import { MeasurementCatalogResponse } from '../types/catalog';
import {
  BaselineResponse,
  BaselineListResponse,
  BaselineCalculationRequest,
} from '../types/baseline';
import {
  AstronautTrendsResponse,
  TelemetryFreshnessResponse,
} from '../types/trend';
import {
  AssessmentResponse,
  AssessmentListResponse,
  AssessmentGenerationRequest,
} from '../types/assessment';
import {
  AlertResponse,
  AlertListResponse,
} from '../types/alert';
import {
  ListAstronautsParams,
  GetMeasurementsParams,
  ConnectionState,
  ApiError,
  HealthCheckResponse,
} from '../types/api';
import {
  DEMO_ASTRONAUTS,
  DEMO_MEASUREMENTS,
  DEMO_CATALOG,
  DEMO_BASELINES,
  DEMO_TRENDS,
  DEMO_FRESHNESS,
  DEMO_ASSESSMENTS,
  DEMO_ALERTS,
} from './demoData';

export { ApiError };

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 5000;

class ApiClient {
  private connectionState: ConnectionState = 'connected';
  private connectionListeners: ((state: ConnectionState) => void)[] = [];
  private demoModeEnabled: boolean = false;

  // Local mutable copy of demo alerts so user can test Acknowledge and Resolve interactively
  private mutableDemoAlerts: AlertResponse[] = [...DEMO_ALERTS];

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public isDemoMode(): boolean {
    return this.demoModeEnabled || this.connectionState === 'offline_demo';
  }

  public setDemoMode(enabled: boolean): void {
    this.demoModeEnabled = enabled;
    if (enabled) {
      this.setConnectionState('offline_demo');
    } else {
      this.checkHealth();
    }
  }

  public subscribeConnectionState(listener: (state: ConnectionState) => void): () => void {
    this.connectionListeners.push(listener);
    listener(this.connectionState);
    return () => {
      this.connectionListeners = this.connectionListeners.filter((l) => l !== listener);
    };
  }

  private setConnectionState(newState: ConnectionState) {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.connectionListeners.forEach((listener) => listener(newState));
    }
  }

  /**
   * Helper to perform standardized GET requests with clear distinction between
   * network failure (offline demo activation) and legitimate HTTP error responses.
   */
  private async getJson<T>(url: string, fallbackFn: () => T): Promise<T> {
    if (this.isDemoMode()) {
      return fallbackFn();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    } catch (networkErr: any) {
      clearTimeout(timeoutId);
      console.warn(`Backend API unreachable at ${url}, activating offline demo:`, networkErr);
      this.setConnectionState('offline_demo');
      return fallbackFn();
    }
    clearTimeout(timeoutId);

    // Backend server is alive and reachable
    this.setConnectionState('connected');

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        // non-JSON payload
      }
      const errObj = errorData.error || errorData;
      throw new ApiError(
        response.status,
        errObj.message || `API error ${response.status}: ${response.statusText}`,
        errObj.code,
        errObj.details
      );
    }

    return (await response.json()) as T;
  }

  /**
   * Helper to perform standardized POST requests.
   * Write actions never silently succeed when the backend is unreachable.
   */
  private async postJson<T, P>(url: string, payload: P, fallbackFn?: () => T): Promise<T> {
    if (this.connectionState === 'offline_demo' || this.isDemoMode()) {
      if (fallbackFn) {
        return fallbackFn();
      }
      throw new ApiError(
        503,
        'Cannot perform write action while running in offline demo mode. Active backend connection required.',
        'OFFLINE_WRITE_UNAVAILABLE'
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (networkErr) {
      clearTimeout(timeoutId);
      console.warn(`Backend network unreachable during POST to ${url}:`, networkErr);
      this.setConnectionState('offline_demo');
      throw new ApiError(
        503,
        'Network request failed. Backend API is currently unreachable. Action was not saved.',
        'NETWORK_UNAVAILABLE'
      );
    }
    clearTimeout(timeoutId);

    // Server is reachable
    this.setConnectionState('connected');

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        // non-JSON
      }
      const errObj = errorData.error || errorData;
      throw new ApiError(
        response.status,
        errObj.message || `API error ${response.status}: ${response.statusText}`,
        errObj.code,
        errObj.details
      );
    }

    return (await response.json()) as T;
  }

  /* =========================================================================
   * 0. SYSTEM HEALTH & CATALOG ENDPOINTS
   * ========================================================================= */

  public async checkHealth(): Promise<HealthCheckResponse | null> {
    const rootUrl = BASE_URL.replace(/\/api\/v1$/, '');
    const healthUrl = `${rootUrl}/health`;

    try {
      const res = await fetch(healthUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Health check returned HTTP ${res.status}`);
      const data = (await res.json()) as HealthCheckResponse;
      this.setConnectionState('connected');
      return data;
    } catch {
      if (this.demoModeEnabled) {
        this.setConnectionState('offline_demo');
      } else {
        this.setConnectionState('offline');
      }
      return null;
    }
  }

  /**
   * GET /api/v1/measurements/catalog
   */
  public async getMeasurementCatalog(): Promise<MeasurementCatalogResponse> {
    const url = `${BASE_URL}/measurements/catalog`;
    return this.getJson<MeasurementCatalogResponse>(url, () => DEMO_CATALOG);
  }

  /* =========================================================================
   * 1. ASTRONAUT ROSTER ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/astronauts
   */
  public async getAstronauts(params?: ListAstronautsParams): Promise<AstronautListResponse> {
    const url = new URL(`${BASE_URL}/astronauts`);
    if (params?.mission_name) url.searchParams.set('mission_name', params.mission_name);
    if (params?.limit !== undefined) url.searchParams.set('limit', params.limit.toString());
    if (params?.offset !== undefined) url.searchParams.set('offset', params.offset.toString());

    return this.getJson<AstronautListResponse>(url.toString(), () => {
      let filtered = [...DEMO_ASTRONAUTS];
      if (params?.mission_name) {
        const query = params.mission_name.toLowerCase();
        filtered = filtered.filter((a) => a.mission_name.toLowerCase().includes(query));
      }
      const offset = params?.offset || 0;
      const limit = params?.limit || 50;
      return {
        data: filtered.slice(offset, offset + limit),
        total: filtered.length,
        limit,
        offset,
      };
    });
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}
   */
  public async getAstronautById(astronautId: string): Promise<Astronaut> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}`;
    return this.getJson<Astronaut>(url, () => {
      const found = DEMO_ASTRONAUTS.find((a) => a.id === astronautId);
      if (found) return found;
      throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
        astronaut_id: astronautId,
      });
    });
  }

  /* =========================================================================
   * 2. MEASUREMENT TELEMETRY ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/astronauts/{astronaut_id}/measurements
   */
  public async getMeasurements(
    astronautId: string,
    params?: GetMeasurementsParams
  ): Promise<MeasurementListResponse> {
    const url = new URL(`${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/measurements`);
    if (params?.measurement_type) url.searchParams.set('measurement_type', params.measurement_type);
    if (params?.context) url.searchParams.set('context', params.context);
    if (params?.exercise_modality) url.searchParams.set('exercise_modality', params.exercise_modality);
    if (params?.start_time) url.searchParams.set('start_time', params.start_time);
    if (params?.end_time) url.searchParams.set('end_time', params.end_time);
    if (params?.limit !== undefined) url.searchParams.set('limit', params.limit.toString());
    if (params?.offset !== undefined) url.searchParams.set('offset', params.offset.toString());

    return this.getJson<MeasurementListResponse>(url.toString(), () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      let records = DEMO_MEASUREMENTS[astronautId] || [];

      if (params?.measurement_type) {
        records = records.filter((m) => m.measurement_type === params.measurement_type);
      }
      if (params?.context) {
        records = records.filter((m) => m.context === params.context);
      }
      if (params?.exercise_modality) {
        records = records.filter((m) => m.exercise_modality === params.exercise_modality);
      }
      if (params?.start_time) {
        records = records.filter((m) => new Date(m.measured_at) >= new Date(params.start_time!));
      }
      if (params?.end_time) {
        records = records.filter((m) => new Date(m.measured_at) <= new Date(params.end_time!));
      }

      const offset = params?.offset || 0;
      const limit = params?.limit || 100;
      const paginated = records.slice(offset, offset + limit);

      return {
        astronaut_id: astronautId,
        data: paginated,
        total: records.length,
        limit,
        offset,
      };
    });
  }

  /* =========================================================================
   * 3. BASELINE & OPERATIONAL ENVELOPE ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/astronauts/{astronaut_id}/baselines
   */
  public async getAstronautBaselines(
    astronautId: string,
    context?: string
  ): Promise<BaselineListResponse> {
    const url = new URL(`${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/baselines`);
    if (context) url.searchParams.set('context', context);

    return this.getJson<BaselineListResponse>(url.toString(), () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      let list = DEMO_BASELINES[astronautId] || [];
      if (context) {
        list = list.filter((b) => b.context === context);
      }

      return {
        astronaut_id: astronautId,
        data: list,
        baselines: list,
        total: list.length,
      };
    });
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}/baselines/active
   */
  public async getActiveBaselines(
    astronautId: string,
    params?: { baseline_type?: string; context?: string }
  ): Promise<BaselineListResponse> {
    const url = new URL(`${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/baselines/active`);
    if (params?.baseline_type) url.searchParams.set('baseline_type', params.baseline_type);
    if (params?.context) url.searchParams.set('context', params.context);

    return this.getJson<BaselineListResponse>(url.toString(), () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      let records = DEMO_BASELINES[astronautId] || [];
      records = records.filter((b) => b.is_active);

      if (params?.baseline_type) {
        records = records.filter((b) => b.baseline_type === params.baseline_type);
      }
      if (params?.context) {
        records = records.filter((b) => b.context === params.context);
      }

      return {
        astronaut_id: astronautId,
        data: records,
        baselines: records,
        total: records.length,
      };
    });
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}/baselines/history
   */
  public async getBaselineHistory(
    astronautId: string,
    measurementType: string,
    params?: { baseline_type?: string; context?: string }
  ): Promise<BaselineListResponse> {
    const url = new URL(
      `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/baselines/history`
    );
    url.searchParams.set('measurement_type', measurementType);
    if (params?.baseline_type) url.searchParams.set('baseline_type', params.baseline_type);
    if (params?.context) url.searchParams.set('context', params.context);

    return this.getJson<BaselineListResponse>(url.toString(), () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      let records = (DEMO_BASELINES[astronautId] || []).filter(
        (b) => b.measurement_type === measurementType
      );
      if (params?.baseline_type) {
        records = records.filter((b) => b.baseline_type === params.baseline_type);
      }
      if (params?.context) {
        records = records.filter((b) => b.context === params.context);
      }

      return {
        astronaut_id: astronautId,
        data: records,
        baselines: records,
        total: records.length,
      };
    });
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}/baselines/{measurement_type}
   */
  public async getAstronautBaselineByType(
    astronautId: string,
    measurementType: string,
    context?: string,
    exerciseModality?: string
  ): Promise<BaselineResponse> {
    const url = new URL(
      `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/baselines/${encodeURIComponent(measurementType)}`
    );
    if (context) url.searchParams.set('context', context);
    if (exerciseModality) url.searchParams.set('exercise_modality', exerciseModality);

    return this.getJson<BaselineResponse>(url.toString(), () => {
      const list = DEMO_BASELINES[astronautId] || [];
      const found =
        list.find((b) => {
          const matchType = b.measurement_type === measurementType;
          const matchCtx = context ? b.context === context : true;
          const matchMod = exerciseModality ? b.exercise_modality === exerciseModality : true;
          return matchType && matchCtx && matchMod;
        }) || list.find((b) => b.measurement_type === measurementType);

      if (found) return found;
      throw new ApiError(
        404,
        `Baseline for metric '${measurementType}' not found for astronaut '${astronautId}'.`,
        'BASELINE_NOT_FOUND',
        {
          astronaut_id: astronautId,
          measurement_type: measurementType,
        }
      );
    });
  }

  /**
   * POST /api/v1/astronauts/{astronaut_id}/baselines/calculate
   */
  public async calculateAstronautBaseline(
    astronautId: string,
    payload: BaselineCalculationRequest
  ): Promise<BaselineResponse> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/baselines/calculate`;

    return this.postJson<BaselineResponse, BaselineCalculationRequest>(url, payload, () => {
      const list = DEMO_BASELINES[astronautId] || [];
      const existing = list.find((b) => b.measurement_type === payload.measurement_type);

      if (existing) {
        return {
          ...existing,
          context: payload.context || existing.context,
          exercise_modality: payload.exercise_modality ?? null,
          calculated_at: new Date().toISOString(),
        };
      }

      const created: BaselineResponse = {
        id: `base-${astronautId}-${payload.measurement_type}-calc`,
        astronaut_id: astronautId,
        measurement_type: payload.measurement_type,
        context: payload.context || 'resting_cabin',
        exercise_modality: payload.exercise_modality ?? null,
        measurement_site: null,
        measurement_method: null,
        sensor_model: null,
        unit: 'standard',
        baseline_type: 'inflight',
        maturity: 'provisional',
        version: 1,
        is_active: true,
        is_finalized: false,
        supersedes_baseline_id: null,
        maturity_evaluated_at: new Date().toISOString(),
        maturity_criteria_snapshot: 'Recalculated in demonstration mode',
        envelope: {
          median: 70.0,
          q25: 65.0,
          q75: 75.0,
          iqr: 10.0,
          robust_scale_iqr: 7.41,
          mean: 70.0,
          std_dev: 5.0,
          min_value: 60.0,
          max_value: 80.0,
          sample_count: 30,
          window_start: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
          window_end: new Date().toISOString(),
          disclaimer: 'Statistical reference values only. NOT medical diagnostic thresholds or clinical flight rules.',
        },
        quality_summary: { nominal: 30, degraded: 0, total_evaluated: 30 },
        algorithm_version: 'v2b-iqr',
        is_synthetic: true,
        calculated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      return created;
    });
  }

  /* =========================================================================
   * 4. HEALTH TREND & FRESHNESS ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/astronauts/{astronaut_id}/trends
   */
  public async getTrends(
    astronautId: string,
    params?: { context?: string; lookback_hours?: number }
  ): Promise<AstronautTrendsResponse> {
    const url = new URL(`${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/trends`);
    if (params?.context) url.searchParams.set('context', params.context);
    if (params?.lookback_hours !== undefined) {
      url.searchParams.set('lookback_hours', params.lookback_hours.toString());
    }

    return this.getJson<AstronautTrendsResponse>(url.toString(), () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      const records = DEMO_TRENDS[astronautId] || [];
      return {
        astronaut_id: astronautId,
        evaluated_at: new Date().toISOString(),
        data: records,
        total: records.length,
      };
    });
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}/trends/freshness
   */
  public async getFreshness(astronautId: string): Promise<TelemetryFreshnessResponse> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/trends/freshness`;

    return this.getJson<TelemetryFreshnessResponse>(url, () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      const items = DEMO_FRESHNESS[astronautId] || [];
      const staleCount = items.filter((i) => i.status === 'stale').length;
      return {
        astronaut_id: astronautId,
        evaluated_at: new Date().toISOString(),
        items,
        stale_count: staleCount,
        total_metrics: items.length,
      };
    });
  }

  /* =========================================================================
   * 5. CLINICAL & OPERATIONAL ASSESSMENT ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/astronauts/{astronaut_id}/assessments/latest
   */
  public async getLatestAssessment(astronautId: string): Promise<AssessmentResponse | null> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/assessments/latest`;

    return this.getJson<AssessmentResponse | null>(url, () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      const assessments = DEMO_ASSESSMENTS[astronautId] || [];
      return assessments.length > 0 ? assessments[0] : null;
    });
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}/assessments
   */
  public async getAssessments(
    astronautId: string,
    limit: number = 20
  ): Promise<AssessmentListResponse> {
    const url = new URL(`${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/assessments`);
    url.searchParams.set('limit', limit.toString());

    return this.getJson<AssessmentListResponse>(url.toString(), () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      const assessments = DEMO_ASSESSMENTS[astronautId] || [];
      return {
        astronaut_id: astronautId,
        data: assessments.slice(0, limit),
        total: assessments.length,
      };
    });
  }

  /**
   * POST /api/v1/astronauts/{astronaut_id}/assessments/generate
   */
  public async generateAssessment(
    astronautId: string,
    payload?: AssessmentGenerationRequest
  ): Promise<AssessmentResponse> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/assessments/generate`;

    return this.postJson<AssessmentResponse, AssessmentGenerationRequest | undefined>(
      url,
      payload,
      () => {
        const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
        if (!astroExists) {
          throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
            astronaut_id: astronautId,
          });
        }

        const template = (DEMO_ASSESSMENTS[astronautId] || [])[0];
        if (!template) {
          throw new ApiError(404, `No assessment template available for astronaut '${astronautId}'.`);
        }

        const generated: AssessmentResponse = {
          ...template,
          id: `asm-${astronautId}-${Date.now()}`,
          assessment_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        if (!DEMO_ASSESSMENTS[astronautId]) {
          DEMO_ASSESSMENTS[astronautId] = [];
        }
        DEMO_ASSESSMENTS[astronautId].unshift(generated);
        return generated;
      }
    );
  }

  /* =========================================================================
   * 6. HEALTH ALERTS & ACTION ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/astronauts/{astronaut_id}/alerts
   */
  public async getAlerts(
    astronautId: string,
    params?: { status?: string; severity?: string }
  ): Promise<AlertListResponse> {
    const url = new URL(`${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/alerts`);
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.severity) url.searchParams.set('severity', params.severity);

    return this.getJson<AlertListResponse>(url.toString(), () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      let filtered = this.mutableDemoAlerts.filter((a) => a.astronaut_id === astronautId);
      if (params?.status) {
        filtered = filtered.filter((a) => a.status === params.status);
      }
      if (params?.severity) {
        filtered = filtered.filter((a) => a.severity === params.severity);
      }

      return {
        astronaut_id: astronautId,
        data: filtered,
        total: filtered.length,
      };
    });
  }

  /**
   * POST /api/v1/alerts/{alert_id}/acknowledge
   * Strictly requires backend connection. Write actions never silently fake success offline.
   */
  public async acknowledgeAlert(alertId: string, note?: string): Promise<AlertResponse> {
    const url = `${BASE_URL}/alerts/${encodeURIComponent(alertId)}/acknowledge`;
    return this.postJson<AlertResponse, { note?: string }>(url, { note });
  }

  /**
   * POST /api/v1/alerts/{alert_id}/resolve
   * Strictly requires backend connection. Write actions never silently fake success offline.
   */
  public async resolveAlert(alertId: string, note?: string): Promise<AlertResponse> {
    const url = `${BASE_URL}/alerts/${encodeURIComponent(alertId)}/resolve`;
    return this.postJson<AlertResponse, { note?: string }>(url, { note });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
