import { AlertResponse } from '../../types/alert';
import { AssessmentResponse } from '../../types/assessment';
import { Measurement } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { AnatomyComponentId, ANATOMY_COMPONENT_LIST } from './anatomyModel';

export type ComponentWarningLevel = 'nominal' | 'caution' | 'critical';

export interface ComponentWarningState {
  level: ComponentWarningLevel;
  message?: string;
  alertId?: string;
  sourceAlert?: AlertResponse;
  activeAlertCount: number;
  /** Telemetry metrics currently outside the personal baseline envelope */
  deviatingMetrics?: string[];
}

const DEVIATION_CAUTION_Z = 3;
const DEVIATION_CRITICAL_Z = 6;

/**
 * Pure function deriving warning states across anatomical components from active alerts and assessments.
 */
export function deriveAnatomyWarnings(
  alerts: AlertResponse[] = [],
  assessment: AssessmentResponse | null = null,
  measurements: Measurement[] = [],
  baselines: BaselineResponse[] = []
): Record<AnatomyComponentId, ComponentWarningState> {
  const result = {} as Record<AnatomyComponentId, ComponentWarningState>;

  // Initialize all to nominal
  for (const comp of ANATOMY_COMPONENT_LIST) {
    result[comp.id] = {
      level: 'nominal',
      activeAlertCount: 0,
    };
  }

  // Filter to active or acknowledged alerts
  const relevantAlerts = alerts.filter(
    (a) => a.status === 'active' || a.status === 'acknowledged'
  );

  for (const alert of relevantAlerts) {
    const targetComponents: AnatomyComponentId[] = [];

    // Map by measurement_type
    if (alert.measurement_type === 'heart_rate') {
      targetComponents.push('heart');
    } else if (
      alert.measurement_type === 'blood_pressure_systolic' ||
      alert.measurement_type === 'blood_pressure_diastolic'
    ) {
      targetComponents.push('heart', 'arteries');
    } else if (alert.measurement_type === 'spo2' || alert.measurement_type === 'respiratory_rate') {
      targetComponents.push('lungs');
    } else if (alert.measurement_type === 'core_temperature') {
      targetComponents.push('intestines');
    } else if (alert.measurement_type === 'body_temperature') {
      targetComponents.push('body_shell');
    }

    // Map by category if not already matched
    const cat = alert.category?.toLowerCase() || '';
    if (cat.includes('cardio') || cat.includes('hemodynamic')) {
      if (!targetComponents.includes('heart')) targetComponents.push('heart');
    } else if (cat.includes('respirat') || cat.includes('pulmonary')) {
      if (!targetComponents.includes('lungs')) targetComponents.push('lungs');
    } else if (cat.includes('skelet') || cat.includes('bone')) {
      if (!targetComponents.includes('skeleton')) targetComponents.push('skeleton');
    } else if (cat.includes('muscl')) {
      if (!targetComponents.includes('muscles')) targetComponents.push('muscles');
    } else if (cat.includes('neuro') || cat.includes('sans')) {
      if (!targetComponents.includes('brain_spine')) targetComponents.push('brain_spine');
    } else if (cat.includes('thermo')) {
      if (!targetComponents.includes('intestines')) targetComponents.push('intestines');
    }

    const isCritical = alert.severity === 'critical' || alert.severity === 'high';
    const alertLevel: ComponentWarningLevel = isCritical ? 'critical' : 'caution';

    for (const compId of targetComponents) {
      const current = result[compId];
      current.activeAlertCount += 1;

      // Escalate level: critical > caution > nominal
      if (alertLevel === 'critical' || current.level !== 'critical') {
        current.level = alertLevel;
        current.message = alert.title || alert.explanation;
        current.alertId = alert.id;
        current.sourceAlert = alert;
      }
    }
  }

  // Incorporate assessment findings if any mention specific systems
  if (assessment && Array.isArray(assessment.findings)) {
    for (const finding of assessment.findings) {
      const text = `${finding.measurement_type} ${finding.summary}`.toLowerCase();
      let target: AnatomyComponentId | null = null;
      if (text.includes('heart') || text.includes('cardiac') || text.includes('bp')) target = 'heart';
      else if (text.includes('respirat') || text.includes('spo2') || text.includes('oxygen')) target = 'lungs';
      else if (text.includes('bone') || text.includes('calcium')) target = 'skeleton';
      else if (text.includes('muscle')) target = 'muscles';
      else if (text.includes('neuro') || text.includes('sans')) target = 'brain_spine';
      else if (text.includes('core_temperature') || text.includes('temp')) target = 'intestines';

      if (target) {
        const statusLower = (finding.status || '').toLowerCase();
        const isCrit = ['critical', 'severe', 'emergency', 'medical_review'].some((k) => statusLower.includes(k));
        const isCaution = ['warning', 'elevated', 'attention', 'deviat'].some((k) => statusLower.includes(k));
        if (isCrit && result[target].level !== 'critical') {
          result[target].level = 'critical';
          result[target].message = finding.summary;
          result[target].activeAlertCount += 1;
        } else if (isCaution && result[target].level === 'nominal') {
          result[target].level = 'caution';
          result[target].message = finding.summary;
          result[target].activeAlertCount += 1;
        }
      }
    }
  }

  // Out-of-baseline telemetry: latest reading vs personal baseline envelope
  for (const base of baselines) {
    const env = base.envelope;
    if (!env) continue;
    const latest = measurements
      .filter((m) => m.measurement_type === base.measurement_type)
      .sort((a, b) => b.measured_at.localeCompare(a.measured_at))[0];
    if (!latest) continue;
    const scale = env.robust_scale_iqr || env.iqr / 1.349 || env.std_dev;
    if (!scale || scale <= 0) continue;
    const z = Math.abs(latest.value - env.median) / scale;
    if (z < DEVIATION_CAUTION_Z) continue;
    const level: ComponentWarningLevel = z >= DEVIATION_CRITICAL_Z ? 'critical' : 'caution';
    for (const comp of ANATOMY_COMPONENT_LIST) {
      if (!comp.telemetryKeys.includes(base.measurement_type)) continue;
      const cur = result[comp.id];
      cur.deviatingMetrics = [...(cur.deviatingMetrics ?? []), base.measurement_type];
      if (level === 'critical' || cur.level === 'nominal') {
        if (cur.level !== 'critical') {
          cur.level = level;
          cur.message = cur.message ?? `${base.measurement_type.replace(/_/g, ' ')} is ${z.toFixed(1)}x outside personal baseline`;
        }
      }
    }
  }

  return result;
}
