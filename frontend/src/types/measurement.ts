/**
 * Strict Measurement Entity matching docs/api/API_CONTRACT.md and docs/architecture/DATABASE_SCHEMA.md
 */
export type DataQuality = 'nominal' | 'degraded' | 'noisy' | 'interpolated' | 'calibrating';

export type MeasurementType =
  | 'heart_rate'
  | 'spo2'
  | 'body_temperature'
  | 'respiratory_rate'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'sleep_duration'
  | 'blood_oxygen'
  | 'core_temperature'
  | 'radiation_dose'
  | string;

export interface Measurement {
  id: string;
  astronaut_id: string;
  measurement_type: MeasurementType;
  value: number;
  unit: string;
  measured_at: string;
  source: string;
  context: string | null;
  data_quality: DataQuality;
  is_synthetic: boolean;
}

export interface MeasurementListResponse {
  astronaut_id: string;
  data: Measurement[];
  total: number;
  limit: number;
  offset: number;
}
