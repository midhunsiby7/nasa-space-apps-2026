/**
 * COSMOLOOKUP — Central Unified API Client
 * Integrates Phase 3B/4 (Measurement Catalog, Baselines, Context/Modality Filters)
 * and Phase 2C/D/E, Phase 5/6/7 (Trends, Freshness, Assessments, Alerts Lifecycle, Offline Write Protection).
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
  TrendObservation,
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

  private setConnectionState(newState: ConnectionState): void {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.connectionListeners.forEach((l) => l(newState));
    }
  }

  /**
   * Helper to perform standardized GET requests with a strict separation between
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
      let errorDetails: unknown;
      let errorCode: string | undefined;
      try {
        const body = await response.json();
        errorDetails = body;
        errorCode = body.detail?.code || body.code;
      } catch {
        errorDetails = await response.text();
      }

      throw new ApiError(
        response.status,
        `Backend API request to ${url} returned HTTP ${response.status}`,
        errorCode,
        errorDetails
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
    } catch (networkErr: any) {
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
      let errorDetails: unknown;
      let errorCode: string | undefined;
      try {
        const body = await response.json();
        errorDetails = body;
        errorCode = body.detail?.code || body.code;
      } catch {
        errorDetails = await response.text();
      }

      throw new ApiError(
        response.status,
        `Backend API POST to ${url} returned HTTP ${response.status}`,
        errorCode,
        errorDetails
      );
    }

    return (await response.json()) as T;
  }

  /* =========================================================================
   * 0. SYSTEM HEALTH CHECK
   * ========================================================================= */

  public async checkHealth(): Promise<HealthCheckResponse> {
    const healthUrl = BASE_URL.replace(/\/api\/v1\/?$/, '') + '/health';
    try {
      const res = await fetch(healthUrl, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        this.setConnectionState('connected');
        return (await res.json()) as HealthCheckResponse;
      }
    } catch {
      // ignore
    }
    this.setConnectionState('offline_demo');
    return {
      status: 'offline_demo',
      app: 'cosmolookup-frontend',
      version: '1.0.0',
      environment: 'demo',
    };
  }

  /* =========================================================================
   * 1. ASTRONAUT ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/astronauts
   */
  public async getAstronauts(params?: ListAstronautsParams): Promise<AstronautListResponse> {
    const query = new URLSearchParams();
    if (params?.mission_name) query.set('mission_name', params.mission_name);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const qs = query.toString();
    const url = `${BASE_URL}/astronauts${qs ? `?${qs}` : ''}`;

    return this.getJson<AstronautListResponse>(url, () => {
      let filtered = [...DEMO_ASTRONAUTS];
      if (params?.mission_name) {
        filtered = filtered.filter((a) => a.mission_name === params.mission_name);
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
  public async getAstronautById(id: string): Promise<Astronaut> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(id)}`;

    return this.getJson<Astronaut>(url, () => {
      const astronaut = DEMO_ASTRONAUTS.find((a) => a.id === id);
      if (!astronaut) {
        throw new ApiError(404, `Astronaut with id '${id}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: id,
        });
      }
      return astronaut;
    });
  }

  /* =========================================================================
   * 2. MEASUREMENTS & TELEMETRY ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/measurements/catalog
   */
  public async getMeasurementCatalog(): Promise<MeasurementCatalogResponse> {
    const url = `${BASE_URL}/measurements/catalog`;
    return this.getJson<MeasurementCatalogResponse>(url, () => DEMO_CATALOG);
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}/measurements
   */
  public async getMeasurements(
    astronautId: string,
    params?: GetMeasurementsParams
  ): Promise<MeasurementListResponse> {
    const query = new URLSearchParams();
    if (params?.measurement_type) query.set('measurement_type', params.measurement_type);
    if (params?.start_time) query.set('start_time', params.start_time);
    if (params?.end_time) query.set('end_time', params.end_time);
    if (params?.context) query.set('context', params.context);
    if (params?.exercise_modality) query.set('exercise_modality', params.exercise_modality);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const qs = query.toString();
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/measurements${qs ? `?${qs}` : ''}`;

    return this.getJson<MeasurementListResponse>(url, () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      let measurements = DEMO_MEASUREMENTS[astronautId] || [];
      if (params?.measurement_type) {
        measurements = measurements.filter((m) => m.measurement_type === params.measurement_type);
      }
      if (params?.context) {
        measurements = measurements.filter((m) => m.context === params.context);
      }
      if (params?.exercise_modality) {
        measurements = measurements.filter((m) => m.exercise_modality === params.exercise_modality);
      }

      const limit = params?.limit || 100;
      const offset = params?.offset || 0;
      return {
        astronaut_id: astronautId,
        data: measurements.slice(offset, offset + limit),
        total: measurements.length,
        limit,
        offset,
      };
    });
  }

  /* =========================================================================
   * 3. PERSONAL OPERATIONAL BASELINES ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/astronauts/{astronaut_id}/baselines
   */
  public async getActiveBaselines(astronautId: string): Promise<BaselineListResponse> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/baselines`;

    return this.getJson<BaselineListResponse>(url, () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      const baselines = DEMO_BASELINES[astronautId] || [];
      return {
        astronaut_id: astronautId,
        data: baselines,
        total: baselines.length,
      };
    });
  }

  /**
   * POST /api/v1/astronauts/{astronaut_id}/baselines/calculate
   */
  public async calculateBaseline(
    astronautId: string,
    request: BaselineCalculationRequest
  ): Promise<BaselineResponse> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/baselines/calculate`;

    return this.postJson<BaselineResponse, BaselineCalculationRequest>(url, request, () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      // EVA is explicitly ineligible for baseline creation (400)
      if (request.context === 'eva_operational') {
        throw new ApiError(
          400,
          `Operational context 'eva_operational' is not eligible for personal baseline calculation. Context must be resting or controlled routine activity.`,
          'INELIGIBLE_BASELINE_CONTEXT',
          { context: request.context }
        );
      }

      // Check if synthetic data exists for this metric & context
      const measurements = (DEMO_MEASUREMENTS[astronautId] || []).filter(
        (m) =>
          m.measurement_type === request.measurement_type &&
          (!request.context || m.context === request.context)
      );

      if (measurements.length < 5) {
        throw new ApiError(
          422,
          `Insufficient observations to calculate baseline for '${request.measurement_type}' in context '${request.context || 'all'}'. Minimum 5 required, found ${measurements.length}.`,
          'INSUFFICIENT_MEASUREMENTS',
          { observation_count: measurements.length, minimum_required: 5 }
        );
      }

      const values = measurements.map((m) => m.value).sort((a, b) => a - b);
      const median = values[Math.floor(values.length / 2)];
      const q25 = values[Math.floor(values.length * 0.25)];
      const q75 = values[Math.floor(values.length * 0.75)];
      const iqr = q75 - q25;

      const newBaseline: BaselineResponse = {
        id: `base-${astronautId}-${request.measurement_type}-${Date.now()}`,
        astronaut_id: astronautId,
        measurement_type: request.measurement_type,
        context: request.context || 'resting_cabin',
        exercise_modality: request.exercise_modality || null,
        unit: measurements[0].unit,
        baseline_type: 'inflight',
        maturity: values.length >= 30 ? 'established' : 'provisional',
        version: 1,
        is_active: true,
        is_finalized: false,
        envelope: {
          median,
          q25,
          q75,
          iqr,
          robust_scale_iqr: iqr / 1.349,
          mean: values.reduce((s, v) => s + v, 0) / values.length,
          std_dev: 2.5,
          min_value: values[0],
          max_value: values[values.length - 1],
          sample_count: values.length,
          disclaimer: 'Personal Operational Envelope calculated via non-parametric order statistics.',
        },
        quality_summary: {
          nominal: values.length,
          degraded: 0,
          total_evaluated: values.length,
        },
        created_at: new Date().toISOString(),
        is_synthetic: true,
      };

      if (!DEMO_BASELINES[astronautId]) {
        DEMO_BASELINES[astronautId] = [];
      }
      DEMO_BASELINES[astronautId].push(newBaseline);
      return newBaseline;
    });
  }

  // Baseline compatibility aliases
  public async getBaselines(astronautId: string): Promise<BaselineListResponse> {
    return this.getActiveBaselines(astronautId);
  }

  public async getAstronautBaselines(astronautId: string): Promise<BaselineListResponse> {
    return this.getActiveBaselines(astronautId);
  }

  public async calculateAstronautBaseline(
    astronautId: string,
    request: BaselineCalculationRequest
  ): Promise<BaselineResponse> {
    return this.calculateBaseline(astronautId, request);
  }

  public async getAstronautBaselineByType(
    astronautId: string,
    measurementType: string,
    context?: string,
    modality?: string
  ): Promise<BaselineResponse | null> {
    const res = await this.getActiveBaselines(astronautId);
    const found = res.data.find(
      (b) =>
        b.measurement_type === measurementType &&
        (!context || b.context === context) &&
        (!modality || b.exercise_modality === modality)
    );
    return found || null;
  }

  /* =========================================================================
   * 4. TREND INTELLIGENCE & FRESHNESS ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/astronauts/{astronaut_id}/trends
   */
  public async getTrends(astronautId: string): Promise<AstronautTrendsResponse> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/trends`;

    return this.getJson<AstronautTrendsResponse>(url, () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      const list: TrendObservation[] = DEMO_TRENDS[astronautId] || [];
      return {
        astronaut_id: astronautId,
        evaluated_at: new Date().toISOString(),
        data: list,
        total: list.length,
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
      const stale_count = items.filter((i) => i.status === 'stale').length;
      return {
        astronaut_id: astronautId,
        evaluated_at: new Date().toISOString(),
        items,
        stale_count,
        total_metrics: items.length,
      };
    });
  }

  /* =========================================================================
   * 5. EXPLAINABLE HEALTH ASSESSMENTS ENDPOINTS
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
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/assessments?limit=${limit}`;

    return this.getJson<AssessmentListResponse>(url, () => {
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
   * POST /api/v1/astronauts/{astronaut_id}/assessments
   */
  public async generateAssessment(
    astronautId: string,
    payload?: AssessmentGenerationRequest
  ): Promise<AssessmentResponse> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/assessments`;

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

  public async evaluateAssessment(
    astronautId: string,
    symptoms?: string[]
  ): Promise<AssessmentResponse> {
    return this.generateAssessment(
      astronautId,
      symptoms && symptoms.length > 0 ? { reported_symptoms: symptoms } : undefined
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
    params?: { status?: string; severity?: string; limit?: number }
  ): Promise<AlertListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/alerts${qs ? `?${qs}` : ''}`;

    return this.getJson<AlertListResponse>(url, () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      let filtered = (DEMO_ALERTS || []).filter((a) => a.astronaut_id === astronautId);
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
