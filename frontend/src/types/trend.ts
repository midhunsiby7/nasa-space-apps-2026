/**
 * Telemetry Trends & Freshness Types matching docs/api/API_CONTRACT.md
 */
import { BaselineMaturity, BaselineType } from './baseline';

export type TrendDirection =
  | 'stable'
  | 'increasing'
  | 'decreasing'
  | 'sustained_deviation'
  | 'insufficient_data';

export type FreshnessStatus = 'fresh' | 'stale' | 'unknown';

export interface TrendObservation {
  measurement_type: string;
  canonical_identifier: string;
  context: string;
  exercise_modality?: string | null;
  unit: string;

  // Current reading
  current_value?: number | null;
  current_measured_at?: string | null;

  // Baseline Comparison
  baseline_id?: string | null;
  baseline_version?: number | null;
  baseline_type?: BaselineType | string | null;
  baseline_maturity?: BaselineMaturity | string | null;
  baseline_median?: number | null;
  baseline_iqr?: number | null;
  robust_scale_iqr?: number | null;
  robust_z?: number | null;

  // Analytics
  sample_count: number;
  sens_slope?: number | null;
  trend_direction: TrendDirection;
  consecutive_deviations: number;
  is_sustained: boolean;

  // Freshness
  freshness_status: FreshnessStatus;
  hours_since_last_observation?: number | null;
  expected_interval_hours: number;

  // Quality & Explanation
  data_quality_status: string;
  explanation: string;
}

export interface AstronautTrendsResponse {
  astronaut_id: string;
  evaluated_at: string;
  data: TrendObservation[];
  total: number;
}

export interface MetricFreshnessItem {
  measurement_type: string;
  last_measured_at?: string | null;
  hours_since_last?: number | null;
  expected_interval_hours: number;
  status: FreshnessStatus;
  message: string;
}

export interface TelemetryFreshnessResponse {
  astronaut_id: string;
  evaluated_at: string;
  items: MetricFreshnessItem[];
  stale_count: number;
  total_metrics: number;
}
