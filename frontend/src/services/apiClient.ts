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
   * Helper to perform standardized GET requests with fallback
   */
  private async getJson<T>(url: string, fallbackFn: () => T): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      const data: T = await response.json();
      this.setConnectionState('connected');
      return data;
    } catch (err) {
      console.warn(`Backend API unreachable at ${url}, using demonstration fallback:`, err);
      this.setConnectionState('offline_demo');
      return fallbackFn();
    }
  }

  /**
   * Helper to perform standardized POST requests with fallback
   */
  private async postJson<T, P>(url: string, payload: P, fallbackFn: () => T): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      const data: T = await response.json();
      this.setConnectionState('connected');
      return data;
    } catch (err) {
      console.warn(`Backend API error during POST to ${url}, using demonstration fallback:`, err);
      this.setConnectionState('offline_demo');
      return fallbackFn();
    }
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
      return DEMO_ASTRONAUTS[0];
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
      let records = DEMO_MEASUREMENTS[astronautId] || DEMO_MEASUREMENTS['astro-001'] || [];

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
      let records = DEMO_BASELINES[astronautId] || DEMO_BASELINES['astro-001'] || [];
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
      let records = DEMO_BASELINES[astronautId] || DEMO_BASELINES['astro-001'] || [];
      records = records.filter((b) => b.measurement_type === measurementType);
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
      const records = DEMO_TRENDS[astronautId] || DEMO_TRENDS['astro-001'] || [];
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
      const items = DEMO_FRESHNESS[astronautId] || DEMO_FRESHNESS['astro-001'] || [];
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
   */
  public async getLatestAssessment(astronautId: string): Promise<AssessmentResponse> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/assessments/latest`;

    return this.getJson<AssessmentResponse>(url, () => {
      const list = DEMO_ASSESSMENTS[astronautId] || DEMO_ASSESSMENTS['astro-001'] || [];
      if (list.length > 0) return list[0];
      return DEMO_ASSESSMENTS['astro-001'][0];
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
      const list = DEMO_ASSESSMENTS[astronautId] || DEMO_ASSESSMENTS['astro-001'] || [];
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
        const list = DEMO_ASSESSMENTS[astronautId] || DEMO_ASSESSMENTS['astro-001'];
        return list[0];
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
      throw new Error(`Alert '${alertId}' not found in demo records.`);
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
      throw new Error(`Alert '${alertId}' not found in demo records.`);
    });
  }
}

export const apiClient = new ApiClient();
