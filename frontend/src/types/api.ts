export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  public code: string;
  public details?: unknown;
  public statusCode: number;

  constructor(message: string, code: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface ListAstronautsParams {
  mission_name?: string;
  limit?: number;
  offset?: number;
}

export interface GetMeasurementsParams {
  measurement_type?: string;
  context?: string;
  exercise_modality?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}

export interface HealthCheckResponse {
  status: string;
  app: string;
  version: string;
  environment: string;
}

export type ConnectionState = 'connected' | 'connecting' | 'offline' | 'error' | 'offline_demo';
