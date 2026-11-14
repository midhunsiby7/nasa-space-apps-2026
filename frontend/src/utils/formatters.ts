import { MeasurementType, DataQuality } from '../types/measurement';
import { BaselineResponse, BaselineComparisonEvaluation } from '../types/baseline';

export interface MetricMeta {
  type: MeasurementType;
  label: string;
  shortLabel: string;
  unit: string;
  color: string;
  description: string;
  nominalRange: string;
}

export const METRIC_METADATA: Record<string, MetricMeta> = {
  heart_rate: {
    type: 'heart_rate',
    label: 'Heart Rate',
    shortLabel: 'HR',
    unit: 'bpm',
    color: '#f43f5e',
    description: 'Autonomous cardiovascular rate captured via telemetry array',
    nominalRange: '60 – 100 bpm (rest baseline)',
  },
  spo2: {
    type: 'spo2',
    label: 'Oxygen Saturation (SpO2)',
    shortLabel: 'SpO2',
    unit: '%',
    color: '#38bdf8',
    description: 'Peripheral capillary oxygen saturation via pulse oximetry',
    nominalRange: '95.0% – 100.0%',
  },
  blood_oxygen: {
    type: 'blood_oxygen',
    label: 'Blood Oxygen (SpO2)',
    shortLabel: 'SpO2',
    unit: '%',
    color: '#38bdf8',
    description: 'Peripheral arterial capillary oxygen saturation via pulse oximetry',
    nominalRange: '95.0% – 100.0%',
  },
  respiratory_rate: {
    type: 'respiratory_rate',
    label: 'Respiratory Rate',
    shortLabel: 'RESP',
    unit: 'breaths/min',
    color: '#10b981',
    description: 'Thoracic ventilation cadence and expansion cycles',
    nominalRange: '12 – 20 breaths/min',
  },
  body_temperature: {
    type: 'body_temperature',
    label: 'Body Temperature',
    shortLabel: 'Body Temp',
    unit: '°C',
    color: '#f59e0b',
    description: 'Skin / peripheral thermometry telemetry',
    nominalRange: '36.0 – 37.2 °C',
  },
  core_temperature: {
    type: 'core_temperature',
    label: 'Core Body Temperature',
    shortLabel: 'Core Temp',
    unit: '°C',
    color: '#f59e0b',
    description: 'Deep visceral thermoregulatory reading via ingestible core telemetry',
    nominalRange: '36.5 – 37.5 °C',
  },
  blood_pressure_systolic: {
    type: 'blood_pressure_systolic',
    label: 'Systolic Blood Pressure',
    shortLabel: 'SBP',
    unit: 'mmHg',
    color: '#fb7185',
    description: 'Peak aortic vascular ejection pressure during ventricular contraction',
    nominalRange: '90 – 120 mmHg',
  },
  blood_pressure_diastolic: {
    type: 'blood_pressure_diastolic',
    label: 'Diastolic Blood Pressure',
    shortLabel: 'DBP',
    unit: 'mmHg',
    color: '#fda4af',
    description: 'Resting arterial vascular pressure during ventricular relaxation',
    nominalRange: '60 – 80 mmHg',
  },
  mean_arterial_pressure: {
    type: 'mean_arterial_pressure',
    label: 'Mean Arterial Pressure (MAP)',
    shortLabel: 'MAP',
    unit: 'mmHg',
    color: '#c084fc',
    description: 'Derived average arterial hemodynamic pressure throughout one cardiac cycle',
    nominalRange: '70 – 105 mmHg',
  },
  sleep_duration: {
    type: 'sleep_duration',
    label: 'Sleep Duration',
    shortLabel: 'Sleep',
    unit: 'hours',
    color: '#818cf8',
    description: 'Circadian rest period duration from sleep stage telemetry',
    nominalRange: '7.0 – 8.5 hours',
  },
  radiation_dose: {
    type: 'radiation_dose',
    label: 'Radiation Exposure',
    shortLabel: 'Rad Dose',
    unit: 'mSv',
    color: '#ec4899',
    description: 'Dosimetric ionizing cosmic radiation cumulative exposure',
    nominalRange: 'Varies with habitat shielding & solar weather',
  },
};

export function getMetricMeta(type: string, rawUnit?: string): MetricMeta {
  const meta = METRIC_METADATA[type];
  if (meta) {
    if (rawUnit && meta.unit !== '°C' && rawUnit !== meta.unit) {
      return { ...meta, unit: rawUnit };
    }
    return meta;
  }

  // Graceful fallback for unmapped metric types
  const formattedName = type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    type,
    label: formattedName,
    shortLabel: type.substring(0, 4).toUpperCase(),
    unit: rawUnit || '',
    color: '#94a3b8',
    description: `Telemetry reading for ${formattedName}`,
    nominalRange: 'Reference baseline not defined',
  };
}

export function formatTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return isoString;
  }
}

export function formatTimeShort(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().substring(11, 16) + 'Z';
  } catch {
    return isoString;
  }
}

export function formatDataQuality(quality: DataQuality): {
  label: string;
  badgeClass: string;
} {
  switch (quality) {
    case 'nominal':
      return {
        label: 'NOMINAL',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      };
    case 'interpolated':
      return {
        label: 'INTERPOLATED',
        badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      };
    case 'degraded':
      return {
        label: 'DEGRADED',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      };
    case 'noisy':
      return {
        label: 'NOISY SENSOR',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      };
    case 'calibrating':
      return {
        label: 'CALIBRATING',
        badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      };
    default:
      return {
        label: String(quality).toUpperCase(),
        badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      };
  }
}

export function formatProvenance(isSynthetic: boolean): {
  label: string;
  shortLabel: string;
  badgeClass: string;
  description: string;
} {
  if (isSynthetic) {
    return {
      label: 'SYNTHETIC SIMULATION',
      shortLabel: 'SYNTHETIC',
      badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      description: 'Algorithmic physiological simulation for mission evaluation & testing.',
    };
  }
  return {
    label: 'EMPIRICAL RESEARCH',
    shortLabel: 'EMPIRICAL',
    badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    description: 'Empirical data derived from actual spaceflight or analog physiological research.',
  };
}

/**
 * Format Operational Context string into human-readable label and UI styling
 */
export function formatOperationalContext(context: string | null | undefined): {
  label: string;
  badgeClass: string;
  isBaselineEligible: boolean;
} {
  if (!context) {
    return {
      label: 'Unspecified Context',
      badgeClass: 'bg-space-800 text-space-400 border-space-700',
      isBaselineEligible: false,
    };
  }

  switch (context) {
    case 'resting_cabin':
      return {
        label: 'Resting Cabin',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        isBaselineEligible: true,
      };
    case 'sleep_cycle':
      return {
        label: 'Sleep Cycle',
        badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        isBaselineEligible: true,
      };
    case 'exercise_active':
      return {
        label: 'Active Exercise',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        isBaselineEligible: true,
      };
    case 'exercise_recovery':
      return {
        label: 'Exercise Recovery',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        isBaselineEligible: true,
      };
    case 'eva_operational':
      return {
        label: 'EVA Operational',
        badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        isBaselineEligible: false,
      };
    case 'unknown':
      return {
        label: 'Unknown Context',
        badgeClass: 'bg-space-800 text-space-400 border-space-700',
        isBaselineEligible: false,
      };
    default:
      return {
        label: context.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        badgeClass: 'bg-space-800 text-space-300 border-space-700',
        isBaselineEligible: false,
      };
  }
}

/**
 * Format Exercise Modality string into human-readable label and badge
 */
export function formatExerciseModality(modality: string | null | undefined): {
  label: string;
  shortLabel: string;
  badgeClass: string;
} {
  if (!modality) {
    return {
      label: 'None / General',
      shortLabel: 'N/A',
      badgeClass: 'bg-space-800 text-space-400 border-space-700',
    };
  }

  switch (modality) {
    case 'ared_resistive':
      return {
        label: 'ARED Resistive Countermeasure',
        shortLabel: 'ARED',
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      };
    case 'cevis_aerobic':
      return {
        label: 'CEVIS Aerobic Cycle Ergometer',
        shortLabel: 'CEVIS',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      };
    case 't2_treadmill':
      return {
        label: 'T2 Combined Operational Treadmill',
        shortLabel: 'T2',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
    default:
      return {
        label: modality.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        shortLabel: modality.substring(0, 4).toUpperCase(),
        badgeClass: 'bg-space-800 text-space-300 border-space-700',
      };
  }
}

/**
 * Format Metric Category into aerospace label and color
 */
export function formatMetricCategory(category: string): {
  label: string;
  badgeClass: string;
} {
  switch (category) {
    case 'cardiovascular':
      return {
        label: 'Cardiovascular',
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      };
    case 'respiratory':
      return {
        label: 'Respiratory',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
    case 'thermal':
      return {
        label: 'Thermal Regulation',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      };
    case 'sleep':
      return {
        label: 'Sleep & Circadian',
        badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      };
    case 'environmental':
      return {
        label: 'Environmental',
        badgeClass: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
      };
    default:
      return {
        label: category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        badgeClass: 'bg-space-800 text-space-300 border-space-700',
      };
  }
}

/**
 * Strict Scientific Comparability Evaluation between an observation and a baseline
 * Prevents invalid cross-context, cross-modality, or cross-metric comparisons.
 */
export function evaluateBaselineComparison(
  observedValue: number,
  observedContext: string | null | undefined,
  observedModality: string | null | undefined,
  observedMetricType: string,
  baseline: BaselineResponse | null | undefined
): BaselineComparisonEvaluation {
  if (!baseline) {
    return {
      isComparable: false,
      reason: 'No calculated personal baseline envelope is available for this metric.',
      currentValue: observedValue,
      baselineMedian: 0,
      absoluteDelta: 0,
      percentDelta: null,
      isWithinIqr: false,
      q25: 0,
      q75: 0,
    };
  }

  // Canonical type matching
  const normalizedObserved = observedMetricType === 'blood_oxygen' ? 'spo2' : observedMetricType;
  const normalizedBaseline = baseline.measurement_type === 'blood_oxygen' ? 'spo2' : baseline.measurement_type;

  // Temperature independence: Never interchange body_temperature and core_temperature
  if (
    (normalizedObserved === 'body_temperature' && normalizedBaseline === 'core_temperature') ||
    (normalizedObserved === 'core_temperature' && normalizedBaseline === 'body_temperature')
  ) {
    return {
      isComparable: false,
      reason: 'Physiological isolation: Superficial body temperature and visceral core temperature are distinct and non-interchangeable.',
      currentValue: observedValue,
      baselineMedian: baseline.envelope.median,
      absoluteDelta: 0,
      percentDelta: null,
      isWithinIqr: false,
      q25: baseline.envelope.q25,
      q75: baseline.envelope.q75,
    };
  }

  if (normalizedObserved !== normalizedBaseline) {
    return {
      isComparable: false,
      reason: `Metric mismatch: Cannot compare ${observedMetricType} with baseline for ${baseline.measurement_type}.`,
      currentValue: observedValue,
      baselineMedian: baseline.envelope.median,
      absoluteDelta: 0,
      percentDelta: null,
      isWithinIqr: false,
      q25: baseline.envelope.q25,
      q75: baseline.envelope.q75,
    };
  }

  // Context comparability: Reject comparing resting_cabin with EVA
  const obsCtx = observedContext || 'unknown';
  const baseCtx = baseline.context || 'resting_cabin';

  if (obsCtx === 'eva_operational' || baseCtx === 'eva_operational') {
    if (obsCtx !== baseCtx) {
      return {
        isComparable: false,
        reason: 'Operational isolation: Extravehicular Activity (EVA) physiology is non-comparable to shirt-sleeve habitat baselines.',
        currentValue: observedValue,
        baselineMedian: baseline.envelope.median,
        absoluteDelta: 0,
        percentDelta: null,
        isWithinIqr: false,
        q25: baseline.envelope.q25,
        q75: baseline.envelope.q75,
      };
    }
  }

  // Exercise modality isolation: Different modalities (e.g. ARED vs CEVIS) cannot be pooled
  const obsMod = observedModality || null;
  const baseMod = baseline.exercise_modality || null;
  if (obsMod && baseMod && obsMod !== baseMod) {
    return {
      isComparable: false,
      reason: `Modality isolation: Countermeasure loading for ${obsMod} cannot be compared directly with ${baseMod} baseline.`,
      currentValue: observedValue,
      baselineMedian: baseline.envelope.median,
      absoluteDelta: 0,
      percentDelta: null,
      isWithinIqr: false,
      q25: baseline.envelope.q25,
      q75: baseline.envelope.q75,
    };
  }

  // Calculations
  const median = baseline.envelope.median;
  const q25 = baseline.envelope.q25;
  const q75 = baseline.envelope.q75;
  const absoluteDelta = Number((observedValue - median).toFixed(2));
  const percentDelta = median !== 0 ? Number(((absoluteDelta / median) * 100).toFixed(1)) : null;
  const isWithinIqr = observedValue >= q25 && observedValue <= q75;

  return {
    isComparable: true,
    reason: `Context matched (${baseCtx}): Observation is comparable against intra-individual baseline envelope.`,
    currentValue: observedValue,
    baselineMedian: median,
    absoluteDelta,
    percentDelta,
    isWithinIqr,
    q25,
    q75,
  };
}
