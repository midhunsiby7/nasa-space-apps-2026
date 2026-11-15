import { AlertResponse } from '../../types/alert';
import { Measurement } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { getMetricMeta } from '../../utils/formatters';

export type AnomalySeverity = 'critical' | 'caution';

export interface HealthAnomaly {
  id: string;
  source: 'alert' | 'baseline';
  metric: string;
  metricLabel: string;
  severity: AnomalySeverity;
  title: string;
  explanation: string;
  recommendation: string;
}

const DEVIATION_CAUTION_Z = 3;
const DEVIATION_CRITICAL_Z = 6;

const BP_ADVICE = 'Rest seated, re-measure after 10 minutes, and report a sustained deviation to the Flight Surgeon.';
const TEMP_ADVICE =
  'Check thermal environment and hydration; contact the Flight Surgeon if the deviation persists beyond one hour.';

const RECOMMENDATIONS: Record<string, string> = {
  heart_rate:
    'Hold high-intensity exercise, repeat a 5-minute resting measurement, and notify the Flight Surgeon if the reading persists.',
  blood_pressure_systolic: BP_ADVICE,
  blood_pressure_diastolic: BP_ADVICE,
  spo2: 'Check sensor fit, verify cabin O2/CO2 status, and escalate immediately to the Flight Surgeon if SpO2 stays low.',
  core_temperature: TEMP_ADVICE,
  body_temperature: TEMP_ADVICE,
  respiratory_rate: 'Pause exertion, practise paced breathing, and report persistent change to the Flight Surgeon.',
};
const DEFAULT_RECOMMENDATION =
  'Re-measure after rest, log symptoms, and discuss the trend with the Flight Surgeon before the next countermeasure session.';

const recommendationFor = (metric: string, critical: boolean) => {
  const base = RECOMMENDATIONS[metric] || DEFAULT_RECOMMENDATION;
  return critical ? `Immediate action: ${base} Suspend exercise until medical clearance is given.` : base;
};

/**
 * Derive daily check-up anomalies from active alerts and from latest readings
 * that fall outside the personal baseline envelope.
 */
export function deriveHealthAnomalies(
  alerts: AlertResponse[] = [],
  measurements: Measurement[] = [],
  baselines: BaselineResponse[] = []
): HealthAnomaly[] {
  const result: HealthAnomaly[] = [];
  const alertedMetrics = new Set<string>();

  for (const a of alerts) {
    if (a.status !== 'active' && a.status !== 'acknowledged') continue;
    const critical = a.severity === 'critical' || a.severity === 'high';
    alertedMetrics.add(a.measurement_type);
    result.push({
      id: `alert-${a.id}`,
      source: 'alert',
      metric: a.measurement_type,
      metricLabel: getMetricMeta(a.measurement_type).label,
      severity: critical ? 'critical' : 'caution',
      title: a.title,
      explanation: a.explanation,
      recommendation: recommendationFor(a.measurement_type, critical),
    });
  }

  for (const base of baselines) {
    const env = base.envelope;
    if (!env || alertedMetrics.has(base.measurement_type)) continue;
    const latest = measurements
      .filter((m) => m.measurement_type === base.measurement_type)
      .sort((x, y) => y.measured_at.localeCompare(x.measured_at))[0];
    if (!latest) continue;
    const scale = env.robust_scale_iqr || env.iqr / 1.349 || env.std_dev;
    if (!scale || scale <= 0) continue;
    const z = Math.abs(latest.value - env.median) / scale;
    if (z < DEVIATION_CAUTION_Z) continue;
    const critical = z >= DEVIATION_CRITICAL_Z;
    const meta = getMetricMeta(base.measurement_type);
    result.push({
      id: `baseline-${base.measurement_type}`,
      source: 'baseline',
      metric: base.measurement_type,
      metricLabel: meta.label,
      severity: critical ? 'critical' : 'caution',
      title: `${meta.label} outside personal baseline`,
      explanation: `Latest ${latest.value.toFixed(1)} ${meta.unit} vs personal median ${env.median.toFixed(1)} ${meta.unit} (${z.toFixed(1)} robust deviations).`,
      recommendation: recommendationFor(base.measurement_type, critical),
    });
  }

  return result.sort((a, b) => Number(b.severity === 'critical') - Number(a.severity === 'critical'));
}
