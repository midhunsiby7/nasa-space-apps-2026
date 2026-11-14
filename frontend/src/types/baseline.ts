/**
 * Personal Baseline and Operational Envelope Types matching backend/app/schemas/baseline.py
 */

export interface PersonalOperationalEnvelope {
  median: number;
  q25: number;
  q75: number;
  iqr: number;
  robust_scale_iqr: number;
  mean: number;
  std_dev: number;
  min_value: number;
  max_value: number;
  sample_count: number;
  window_start: string | null;
  window_end: string | null;
  disclaimer: string;
}

export interface BaselineQualitySummary {
  nominal: number;
  degraded: number;
  total_evaluated: number;
}

export interface BaselineResponse {
  id: string;
  astronaut_id: string;
  measurement_type: string;
  context: string;
  exercise_modality: string | null;
  measurement_site: string | null;
  measurement_method: string | null;
  sensor_model: string | null;
  unit: string;
  envelope: PersonalOperationalEnvelope;
  quality_summary: BaselineQualitySummary;
  algorithm_version: string;
  is_synthetic: boolean;
  calculated_at: string;
}

export interface BaselineListResponse {
  astronaut_id: string;
  data: BaselineResponse[];
  total: number;
}

export interface BaselineCalculationRequest {
  measurement_type: string;
  context?: string;
  exercise_modality?: string | null;
  measurement_site?: string | null;
  measurement_method?: string | null;
  include_degraded?: boolean;
  start_time?: string | null;
  end_time?: string | null;
}

/**
 * Client-side Comparability Evaluation between Current Observation and Baseline
 */
export interface BaselineComparisonEvaluation {
  isComparable: boolean;
  reason: string;
  currentValue: number;
  baselineMedian: number;
  absoluteDelta: number;
  percentDelta: number | null;
  isWithinIqr: boolean;
  q25: number;
  q75: number;
}
