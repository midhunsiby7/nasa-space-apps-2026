export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ListAstronautsParams {
  mission_name?: string;
  limit?: number;
  offset?: number;
}

export interface GetMeasurementsParams {
  measurement_type?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}

export type ConnectionState = 'connected' | 'offline_demo' | 'connecting' | 'error';
