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
  public status: number;

  constructor(
    statusOrMessage: number | string,
    messageOrCode?: string,
    codeOrStatus?: string | number,
    details?: unknown
  ) {
    if (typeof statusOrMessage === 'number') {
      super(messageOrCode || 'API Error');
      this.status = statusOrMessage;
      this.statusCode = statusOrMessage;
      this.code = typeof codeOrStatus === 'string' ? codeOrStatus : 'API_ERROR';
      this.details = details;
    } else {
      super(statusOrMessage);
      this.code = messageOrCode || 'API_ERROR';
      const codeNum = typeof codeOrStatus === 'number' ? codeOrStatus : 500;
      this.status = codeNum;
      this.statusCode = codeNum;
      this.details = details;
    }
    this.name = 'ApiError';
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
