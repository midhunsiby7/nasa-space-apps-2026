/**
 * Health Alert Types matching docs/api/API_CONTRACT.md
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface AlertResponse {
  id: string;
  astronaut_id: string;
  assessment_id?: string | null;
  measurement_type: string;
  category: string;
  severity: AlertSeverity;
  title: string;
  explanation: string;
  status: AlertStatus;
  created_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  is_synthetic: boolean;
}

export interface AlertListResponse {
  astronaut_id: string;
  data: AlertResponse[];
  total: number;
}

export interface AlertActionRequest {
  note?: string;
}
