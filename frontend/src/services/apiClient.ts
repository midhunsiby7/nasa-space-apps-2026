import { Astronaut, AstronautListResponse } from '../types/astronaut';
import { MeasurementListResponse } from '../types/measurement';
import { ListAstronautsParams, GetMeasurementsParams, ConnectionState } from '../types/api';
import {
  BaselineListResponse,
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
  DEMO_ASTRONAUTS,
  DEMO_MEASUREMENTS,
  DEMO_BASELINES,
  DEMO_TRENDS,
  DEMO_FRESHNESS,
  DEMO_ASSESSMENTS,
  DEMO_ALERTS,
} from './demoData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ApiClient {
  private connectionState: ConnectionState = 'connected';
  private connectionListeners: ((state: ConnectionState) => void)[] = [];

  // Local mutable copy of demo alerts so user can test Acknowledge and Resolve interactively
  private mutableDemoAlerts: AlertResponse[] = [...DEMO_ALERTS];

  public getConnectionState(): ConnectionState {
    return this.connectionState;
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
    if (this.connectionState === 'offline_demo') {
      return fallbackFn();
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
    } catch (networkErr) {
      console.warn(`Backend API unreachable at ${url}, activating offline demo:`, networkErr);
      this.setConnectionState('offline_demo');
      return fallbackFn();
    }

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

    return await response.json();
  }

  /**
   * Helper to perform standardized POST requests.
   * On an active connection, HTTP errors are thrown directly to avoid unsafe silent fallbacks.
   */
  private async postJson<T, P>(url: string, payload: P, fallbackFn: () => T): Promise<T> {
    if (this.connectionState === 'offline_demo') {
      return fallbackFn();
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (networkErr) {
      console.warn(`Backend network unreachable during POST to ${url}, using offline demo:`, networkErr);
      this.setConnectionState('offline_demo');
      return fallbackFn();
    }

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

    return await response.json();
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
      if (params?.start_time) {
        const start = new Date(params.start_time).getTime();
        records = records.filter((m) => new Date(m.measured_at).getTime() >= start);
      }
      if (params?.end_time) {
        const end = new Date(params.end_time).getTime();
        records = records.filter((m) => new Date(m.measured_at).getTime() <= end);
      }

      records.sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
      const offset = params?.offset || 0;
      const limit = params?.limit || 100;
      return {
        astronaut_id: astronautId,
        data: records.slice(offset, offset + limit),
        total: records.length,
        limit,
        offset,
      };
    });
  }

  /* =========================================================================
   * 3. BASELINE INTELLIGENCE ENDPOINTS
   * ========================================================================= */

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
        total: records.length,
      };
    });
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}/baselines/{measurement_type}/history
   */
  public async getBaselineHistory(
    astronautId: string,
    measurementType: string,
    params?: { baseline_type?: string; context?: string }
  ): Promise<BaselineListResponse> {
    const url = new URL(
      `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/baselines/${encodeURIComponent(measurementType)}/history`
    );
    if (params?.baseline_type) url.searchParams.set('baseline_type', params.baseline_type);
    if (params?.context) url.searchParams.set('context', params.context);

    return this.getJson<BaselineListResponse>(url.toString(), () => {
      const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
      if (!astroExists) {
        throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
          astronaut_id: astronautId,
        });
      }

      let records = (DEMO_BASELINES[astronautId] || []).filter((b) => b.measurement_type === measurementType);
      if (params?.baseline_type) {
        records = records.filter((b) => b.baseline_type === params.baseline_type);
      }
      return {
        astronaut_id: astronautId,
        data: records,
        total: records.length,
      };
    });
  }

  /* =========================================================================
   * 4. TREND INTELLIGENCE & TELEMETRY FRESHNESS ENDPOINTS
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
   * 5. EXPLAINABLE HEALTH ASSESSMENT ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/astronauts/{astronaut_id}/assessments/latest
   * Returns null if astronaut exists but has no assessment yet (HTTP 404 ASSESSMENT_NOT_FOUND).
   */
  public async getLatestAssessment(astronautId: string): Promise<AssessmentResponse | null> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/assessments/latest`;

    try {
      return await this.getJson<AssessmentResponse>(url, () => {
        const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
        if (!astroExists) {
          throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
            astronaut_id: astronautId,
          });
        }

        const list = DEMO_ASSESSMENTS[astronautId] || [];
        if (list.length > 0) return list[0];
        return null as unknown as AssessmentResponse;
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404 && err.code === 'ASSESSMENT_NOT_FOUND') {
        return null;
      }
      throw err;
    }
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

      const list = DEMO_ASSESSMENTS[astronautId] || [];
      return {
        astronaut_id: astronautId,
        data: list.slice(0, limit),
        total: list.length,
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
    const body = payload || {
      context: 'resting_cabin',
      lookback_hours: 72,
      generate_alerts: true,
    };

    return this.postJson<AssessmentResponse, AssessmentGenerationRequest>(
      url,
      body,
      () => {
        const astroExists = DEMO_ASTRONAUTS.some((a) => a.id === astronautId);
        if (!astroExists) {
          throw new ApiError(404, `Astronaut with id '${astronautId}' not found.`, 'ASTRONAUT_NOT_FOUND', {
            astronaut_id: astronautId,
          });
        }

        const list = DEMO_ASSESSMENTS[astronautId] || [];
        if (list.length > 0) return list[0];
        throw new ApiError(404, `No assessment template available for astronaut '${astronautId}'.`);
      }
    );
  }

  /* =========================================================================
   * 6. HEALTH ALERTS & LIFECYCLE MANAGEMENT ENDPOINTS
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
   */
  public async acknowledgeAlert(alertId: string, note?: string): Promise<AlertResponse> {
    const url = `${BASE_URL}/alerts/${encodeURIComponent(alertId)}/acknowledge`;

    return this.postJson<AlertResponse, { note?: string }>(url, { note }, () => {
      const idx = this.mutableDemoAlerts.findIndex((a) => a.id === alertId);
      if (idx >= 0) {
        this.mutableDemoAlerts[idx] = {
          ...this.mutableDemoAlerts[idx],
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
        };
        return this.mutableDemoAlerts[idx];
      }
      throw new ApiError(404, `Alert with id '${alertId}' not found.`, 'ALERT_NOT_FOUND', { alert_id: alertId });
    });
  }

  /**
   * POST /api/v1/alerts/{alert_id}/resolve
   */
  public async resolveAlert(alertId: string, note?: string): Promise<AlertResponse> {
    const url = `${BASE_URL}/alerts/${encodeURIComponent(alertId)}/resolve`;

    return this.postJson<AlertResponse, { note?: string }>(url, { note }, () => {
      const idx = this.mutableDemoAlerts.findIndex((a) => a.id === alertId);
      if (idx >= 0) {
        this.mutableDemoAlerts[idx] = {
          ...this.mutableDemoAlerts[idx],
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        };
        return this.mutableDemoAlerts[idx];
      }
      throw new ApiError(404, `Alert with id '${alertId}' not found.`, 'ALERT_NOT_FOUND', { alert_id: alertId });
    });
  }
}

export const apiClient = new ApiClient();
