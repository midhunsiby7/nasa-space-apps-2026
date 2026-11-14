import { MeasurementType, DataQuality } from '../types/measurement';

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
  // Authoritative seeded backend metrics
  heart_rate: {
    type: 'heart_rate',
    label: 'Heart Rate',
    shortLabel: 'HR',
    unit: 'bpm',
    color: '#f43f5e', // rose
    description: 'Autonomous cardiovascular rate captured via telemetry array',
    nominalRange: '60 – 100 bpm (rest baseline)',
  },
  spo2: {
    type: 'spo2',
    label: 'Blood Oxygen (SpO2)',
    shortLabel: 'SpO2',
    unit: '%',
    color: '#38bdf8', // cyan
    description: 'Peripheral arterial capillary oxygen saturation via pulse oximetry',
    nominalRange: '95.0% – 100.0%',
  },
  body_temperature: {
    type: 'body_temperature',
    label: 'Body Temperature',
    shortLabel: 'Core Temp',
    unit: '°C',
    color: '#f59e0b', // amber
    description: 'Internal core thermoregulatory reading via ingestible capsule sensor',
    nominalRange: '36.5 – 37.5 °C',
  },
  respiratory_rate: {
    type: 'respiratory_rate',
    label: 'Respiratory Rate',
    shortLabel: 'Resp',
    unit: 'breaths/min',
    color: '#10b981', // emerald
    description: 'Pulmonary ventilation frequency (breathing cycles per minute)',
    nominalRange: '12 – 20 breaths/min',
  },
  blood_pressure_systolic: {
    type: 'blood_pressure_systolic',
    label: 'Systolic Blood Pressure',
    shortLabel: 'BP Sys',
    unit: 'mmHg',
    color: '#a855f7', // violet
    description: 'Peak arterial pressure during ventricular contraction phase',
    nominalRange: '90 – 120 mmHg',
  },
  blood_pressure_diastolic: {
    type: 'blood_pressure_diastolic',
    label: 'Diastolic Blood Pressure',
    shortLabel: 'BP Dia',
    unit: 'mmHg',
    color: '#8b5cf6', // purple
    description: 'Minimum arterial pressure during ventricular relaxation phase',
    nominalRange: '60 – 80 mmHg',
  },
  sleep_duration: {
    type: 'sleep_duration',
    label: 'Sleep Duration',
    shortLabel: 'Sleep',
    unit: 'hours',
    color: '#6366f1', // indigo
    description: 'Consolidated circadian rest period staging',
    nominalRange: '7.0 – 9.0 hours',
  },

  // Fallback compatibility entries for alternative / analog datasets
  blood_oxygen: {
    type: 'blood_oxygen',
    label: 'Blood Oxygen (SpO2)',
    shortLabel: 'SpO2',
    unit: '%',
    color: '#38bdf8',
    description: 'Peripheral arterial oxygen saturation via pulse oximetry',
    nominalRange: '95.0% – 100.0%',
  },
  core_temperature: {
    type: 'core_temperature',
    label: 'Core Body Temperature',
    shortLabel: 'Core Temp',
    unit: '°C',
    color: '#f59e0b',
    description: 'Internal thermoregulatory reading via ingestible thermal telemetry',
    nominalRange: '36.5 – 37.5 °C',
  },
  radiation_dose: {
    type: 'radiation_dose',
    label: 'Radiation Exposure',
    shortLabel: 'Rad Dose',
    unit: 'mSv',
    color: '#ec4899', // pink
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
