/**
 * Strict Measurement Entity matching docs/api/API_CONTRACT.md and docs/architecture/DATABASE_SCHEMA.md
 */
export type DataQuality = 'nominal' | 'degraded' | 'noisy' | 'interpolated' | 'calibrating';

export type MeasurementType =
  | 'heart_rate'
  | 'spo2'
  | 'body_temperature'
  | 'core_temperature'
  | 'respiratory_rate'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'mean_arterial_pressure'
  | 'sleep_duration'
  | 'radiation_dose'
  | 'blood_oxygen'
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
  exercise_modality?: string | null;
  measurement_site?: string | null;
  measurement_method?: string | null;
  sensor_model?: string | null;
  mission_day?: number | null;
}

export interface MeasurementListResponse {
  astronaut_id: string;
  data: Measurement[];
  total: number;
  limit: number;
  offset: number;
}
