/**
 * Personal Operational Baseline Types matching docs/api/API_CONTRACT.md and docs/architecture/PHASE_2_BASELINE_DESIGN.md
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
  window_start?: string | null;
  window_end?: string | null;
  disclaimer: string;
}

export interface BaselineQualitySummary {
  nominal: number;
  degraded: number;
  total_evaluated: number;
}

export type BaselineType = 'preflight' | 'inflight';
export type BaselineMaturity = 'insufficient' | 'provisional' | 'established';

export interface BaselineResponse {
  id: string;
  astronaut_id: string;
  measurement_type: string;
  context: string;
  exercise_modality?: string | null;
  measurement_site?: string | null;
  measurement_method?: string | null;
  sensor_model?: string | null;
  unit: string;
  baseline_type: BaselineType;
  maturity: BaselineMaturity;
  version: number;
  is_active: boolean;
  is_finalized: boolean;
  supersedes_baseline_id?: string | null;
  maturity_evaluated_at?: string | null;
  maturity_criteria_snapshot?: string | null;
  envelope: PersonalOperationalEnvelope;
  quality_summary: BaselineQualitySummary;
  created_at: string;
  is_synthetic: boolean;
}

export interface BaselineListResponse {
  astronaut_id: string;
  data: BaselineResponse[];
  total: number;
}
