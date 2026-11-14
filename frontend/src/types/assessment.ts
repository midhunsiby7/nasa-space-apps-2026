/**
 * Explainable Health Assessment Types matching docs/api/API_CONTRACT.md
 */

export type AssessmentClassification =
  | 'routine'
  | 'needs_attention'
  | 'medical_review_recommended'
  | 'emergency';

export interface AssessmentFinding {
  measurement_type: string;
  status: string;
  summary: string;
  current_value?: number | null;
  baseline_median?: number | null;
  robust_z?: number | null;
  trend: string;
  baseline_version?: number | null;
}

export interface GuidanceItem {
  category: string;
  action: string;
  rationale: string;
  is_medical_prescription: boolean;
}

export interface AssessmentResponse {
  id: string;
  astronaut_id: string;
  assessment_date: string;
  overall_classification: AssessmentClassification;
  summary_explanation: string;
  findings: AssessmentFinding[];
  guidance: GuidanceItem[];
  baseline_versions_used: Record<string, string>;
  data_quality_status: string;
  is_synthetic: boolean;
  created_at: string;
}

export interface AssessmentListResponse {
  astronaut_id: string;
  data: AssessmentResponse[];
  total: number;
}

export interface AssessmentGenerationRequest {
  context?: string;
  lookback_hours?: number;
  generate_alerts?: boolean;
  emergency_protocol_config?: Record<string, Record<string, number>> | null;
  reported_symptoms?: string[] | null;
}
