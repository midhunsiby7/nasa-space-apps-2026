import { Astronaut, AstronautListResponse } from '../types/astronaut';
import { MeasurementListResponse } from '../types/measurement';
import {
  ListAstronautsParams,
  GetMeasurementsParams,
  ConnectionState,
  ApiError,
  ApiErrorResponse,
  HealthCheckResponse,
} from '../types/api';
import { DEMO_ASTRONAUTS, DEMO_MEASUREMENTS } from './demoData';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 5000;

class ApiClient {
  private connectionState: ConnectionState = 'connecting';
  private connectionListeners: ((state: ConnectionState) => void)[] = [];
  private demoModeEnabled: boolean = false;

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public isDemoMode(): boolean {
    return this.demoModeEnabled;
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
   * Internal fetch wrapper supporting timeouts and JSON error parsing
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });

      clearTimeout(timeoutId);

      // Handle HTTP error responses
      if (!response.ok) {
        let errorData: ApiErrorResponse | null = null;
        try {
          errorData = await response.json();
        } catch {
          // Response body was not JSON
        }

        const code = errorData?.error?.code || `HTTP_${response.status}`;
        const message =
          errorData?.error?.message || `Request failed with HTTP status ${response.status} (${response.statusText})`;
        const details = errorData?.error?.details;

        throw new ApiError(message, code, response.status, details);
      }

      // Successful HTTP response
      this.setConnectionState('connected');
      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);

      // Distinguish between explicit HTTP ApiErrors and Network/Timeout errors
      if (err instanceof ApiError) {
        // Server was reached and actively returned 4xx or 5xx
        throw err;
      }

      // Network unreachable, connection refused, or timeout
      const isTimeout = err.name === 'AbortError';
      const netMsg = isTimeout
        ? `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s while reaching backend service.`
        : 'Backend service is unreachable. Verify that Uvicorn is running on http://127.0.0.1:8000.';

      this.setConnectionState(this.demoModeEnabled ? 'offline_demo' : 'offline');

      throw new ApiError(netMsg, isTimeout ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR', 0, {
        originalError: err.message,
      });
    }
  }

  /**
   * Check Backend System Health
   * GET /api/v1/health or /health
   */
  public async checkHealth(): Promise<HealthCheckResponse | null> {
    try {
      this.setConnectionState('connecting');
      const data = await this.request<HealthCheckResponse>('/health');
      this.setConnectionState('connected');
      return data;
    } catch (err: any) {
      if (err.statusCode === 0) {
        this.setConnectionState(this.demoModeEnabled ? 'offline_demo' : 'offline');
      } else {
        this.setConnectionState('error');
      }
      return null;
    }
  }

  /**
   * GET /api/v1/astronauts
   */
  public async getAstronauts(params?: ListAstronautsParams): Promise<AstronautListResponse> {
    // If user explicitly enabled offline demonstration mode, return demo dataset immediately
    if (this.demoModeEnabled) {
      return this.getDemoAstronauts(params);
    }

    const query = new URLSearchParams();
    if (params?.mission_name) query.set('mission_name', params.mission_name);
    if (params?.limit !== undefined) query.set('limit', params.limit.toString());
    if (params?.offset !== undefined) query.set('offset', params.offset.toString());

    const qs = query.toString();
    const endpoint = `/astronauts${qs ? `?${qs}` : ''}`;

    try {
      return await this.request<AstronautListResponse>(endpoint);
    } catch (err: any) {
      // If network is offline and demo mode is permitted as fallback
      if (err.statusCode === 0 && this.demoModeEnabled) {
        return this.getDemoAstronauts(params);
      }
      throw err;
    }
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}
   */
  public async getAstronautById(astronautId: string): Promise<Astronaut> {
    if (this.demoModeEnabled) {
      const found = DEMO_ASTRONAUTS.find((a) => a.id === astronautId);
      if (found) return found;
      throw new ApiError(
        `Astronaut with id '${astronautId}' was not found in demo records.`,
        'ASTRONAUT_NOT_FOUND',
        404
      );
    }

    const endpoint = `/astronauts/${encodeURIComponent(astronautId)}`;
    try {
      return await this.request<Astronaut>(endpoint);
    } catch (err: any) {
      if (err.statusCode === 0 && this.demoModeEnabled) {
        const found = DEMO_ASTRONAUTS.find((a) => a.id === astronautId);
        if (found) return found;
      }
      throw err;
    }
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}/measurements
   */
  public async getMeasurements(
    astronautId: string,
    params?: GetMeasurementsParams
  ): Promise<MeasurementListResponse> {
    if (this.demoModeEnabled) {
      return this.getDemoMeasurements(astronautId, params);
    }

    const query = new URLSearchParams();
    if (params?.measurement_type) query.set('measurement_type', params.measurement_type);
    if (params?.start_time) query.set('start_time', params.start_time);
    if (params?.end_time) query.set('end_time', params.end_time);
    if (params?.limit !== undefined) query.set('limit', params.limit.toString());
    if (params?.offset !== undefined) query.set('offset', params.offset.toString());

    const qs = query.toString();
    const endpoint = `/astronauts/${encodeURIComponent(astronautId)}/measurements${qs ? `?${qs}` : ''}`;

    try {
      return await this.request<MeasurementListResponse>(endpoint);
    } catch (err: any) {
      if (err.statusCode === 0 && this.demoModeEnabled) {
        return this.getDemoMeasurements(astronautId, params);
      }
      throw err;
    }
  }

  /* Synthetic Demo Handlers strictly matching API schemas */
  private getDemoAstronauts(params?: ListAstronautsParams): AstronautListResponse {
    let filtered = [...DEMO_ASTRONAUTS];

    if (params?.mission_name) {
      const q = params.mission_name.toLowerCase();
      filtered = filtered.filter((a) => a.mission_name.toLowerCase().includes(q));
    }

    const offset = params?.offset || 0;
    const limit = params?.limit || 50;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      data: paginated,
      total: filtered.length,
      limit,
      offset,
    };
  }

  private getDemoMeasurements(
    astronautId: string,
    params?: GetMeasurementsParams
  ): MeasurementListResponse {
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
    const paginated = records.slice(offset, offset + limit);

    return {
      astronaut_id: astronautId,
      data: paginated,
      total: records.length,
      limit,
      offset,
    };
  }
}

export const apiClient = new ApiClient();
