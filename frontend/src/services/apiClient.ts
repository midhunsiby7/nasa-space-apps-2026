import { Astronaut, AstronautListResponse } from '../types/astronaut';
import { MeasurementListResponse } from '../types/measurement';
import { ListAstronautsParams, GetMeasurementsParams, ConnectionState } from '../types/api';
import { DEMO_ASTRONAUTS, DEMO_MEASUREMENTS } from './demoData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private connectionState: ConnectionState = 'connected';
  private connectionListeners: ((state: ConnectionState) => void)[] = [];

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
   * GET /api/v1/astronauts
   */
  public async getAstronauts(params?: ListAstronautsParams): Promise<AstronautListResponse> {
    const url = new URL(`${BASE_URL}/astronauts`);
    if (params?.mission_name) url.searchParams.set('mission_name', params.mission_name);
    if (params?.limit !== undefined) url.searchParams.set('limit', params.limit.toString());
    if (params?.offset !== undefined) url.searchParams.set('offset', params.offset.toString());

    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      const data: AstronautListResponse = await response.json();
      this.setConnectionState('connected');
      return data;
    } catch (err) {
      console.warn('Backend API unreachable or returned an error, activating deliberate demonstration mode:', err);
      this.setConnectionState('offline_demo');
      return this.getDemoAstronauts(params);
    }
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}
   */
  public async getAstronautById(astronautId: string): Promise<Astronaut> {
    const url = `${BASE_URL}/astronauts/${encodeURIComponent(astronautId)}`;

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      const data: Astronaut = await response.json();
      this.setConnectionState('connected');
      return data;
    } catch (err) {
      console.warn(`Astronaut ${astronautId} fetch fallback to demo:`, err);
      this.setConnectionState('offline_demo');
      const found = DEMO_ASTRONAUTS.find((a) => a.id === astronautId);
      if (found) return found;
      throw new Error(`Astronaut with ID '${astronautId}' not found.`);
    }
  }

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

    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      const data: MeasurementListResponse = await response.json();
      this.setConnectionState('connected');
      return data;
    } catch (err) {
      console.warn(`Measurements for ${astronautId} fallback to demo:`, err);
      this.setConnectionState('offline_demo');
      return this.getDemoMeasurements(astronautId, params);
    }
  }

  /* Synthetic Demo Fallback Handlers */
  private getDemoAstronauts(params?: ListAstronautsParams): AstronautListResponse {
    let filtered = [...DEMO_ASTRONAUTS];

    if (params?.mission_name) {
      const query = params.mission_name.toLowerCase();
      filtered = filtered.filter((a) =>
        a.mission_name.toLowerCase().includes(query)
      );
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

    // Sort chronologically ascending
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
