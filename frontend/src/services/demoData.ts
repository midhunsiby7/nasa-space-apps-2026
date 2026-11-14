import { Astronaut } from '../types/astronaut';
import { Measurement } from '../types/measurement';
import { BaselineResponse } from '../types/baseline';
import { TrendObservation, MetricFreshnessItem } from '../types/trend';
import { AssessmentResponse } from '../types/assessment';
import { AlertResponse } from '../types/alert';

export const DEMO_ASTRONAUTS: Astronaut[] = [
  {
    id: 'astro-001',
    name: 'Dr. Sarah Connor',
    crew_role: 'Commander / Medical Officer',
    mission_name: 'Artemis VII',
    mission_day: 42,
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'astro-002',
    name: 'Alex Chen',
    crew_role: 'Flight Engineer',
    mission_name: 'Artemis VII',
    mission_day: 42,
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'astro-003',
    name: 'Dr. Marcus Vance',
    crew_role: 'Payload Specialist / Biologist',
    mission_name: 'Mars Transit-1',
    mission_day: 184,
    created_at: '2026-05-14T12:00:00Z',
  },
  {
    id: 'astro-004',
    name: 'Elena Rostova',
    crew_role: 'Pilot / Systems Specialist',
    mission_name: 'Mars Transit-1',
    mission_day: 184,
    created_at: '2026-05-14T12:00:00Z',
  },
  {
    id: 'astro-005',
    name: 'Kenji Sato',
    crew_role: 'Science Officer / Habitat Tech',
    mission_name: 'ISS Expedition 74',
    mission_day: 96,
    created_at: '2026-08-10T14:30:00Z',
  },
];

// Helper to generate time series telemetry samples around recent timestamps
function generateTelemetrySeries(
  astronautId: string,
  baseTimeIso: string
): Measurement[] {
  const baseTime = new Date(baseTimeIso).getTime();
  const measurements: Measurement[] = [];
  const count = 16; // 16 discrete time points at 30-min intervals

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(baseTime - (count - 1 - i) * 30 * 60 * 1000).toISOString();
    const timeIndex = i;

    // 1. Heart Rate (bpm)
    const hrVal = Math.round(68 + Math.sin(timeIndex * 0.4) * 8 + (timeIndex === 11 ? 16 : 0));
    measurements.push({
      id: `meas-${astronautId}-hr-${i}`,
      astronaut_id: astronautId,
      measurement_type: 'heart_rate',
      value: hrVal,
      unit: 'bpm',
      measured_at: timestamp,
      source: 'BioHarness v3 Telemetry Stream',
      context: timeIndex === 11 ? 'Moderate aerobic countermeasure workout' : 'Habitat intra-vehicular baseline',
      data_quality: timeIndex === 6 ? 'interpolated' : 'nominal',
      is_synthetic: true,
    });

    // 2. Blood Oxygen (SpO2 %)
    const spo2Val = +(97.5 + Math.cos(timeIndex * 0.3) * 0.9 - (timeIndex === 11 ? 0.6 : 0)).toFixed(1);
    measurements.push({
      id: `meas-${astronautId}-spo2-${i}`,
      astronaut_id: astronautId,
      measurement_type: 'blood_oxygen',
      value: spo2Val,
      unit: '%',
      measured_at: timestamp,
      source: 'Pulse Oximeter Optical Band',
      context: 'Atmospheric partial pressure: 101.3 kPa (Nominal)',
      data_quality: 'nominal',
      is_synthetic: true,
    });

    // 3. Core Temperature (celsius)
    const tempVal = +(36.9 + Math.sin(timeIndex * 0.25) * 0.35 + (timeIndex === 11 ? 0.5 : 0)).toFixed(2);
    measurements.push({
      id: `meas-${astronautId}-temp-${i}`,
      astronaut_id: astronautId,
      measurement_type: 'core_temperature',
      value: tempVal,
      unit: 'celsius',
      measured_at: timestamp,
      source: 'Ingestible Thermal Sensor Capsule',
      context: timeIndex === 11 ? 'Post-exercise active thermoregulation' : 'Standard circadian baseline',
      data_quality: timeIndex === 3 ? 'noisy' : 'nominal',
      is_synthetic: true,
    });

    // 4. Radiation Dose (mSv cumulative / habitat flux)
    const radVal = +(0.038 + (timeIndex * 0.002) + (astronautId.includes('003') ? 0.04 : 0)).toFixed(4);
    measurements.push({
      id: `meas-${astronautId}-rad-${i}`,
      astronaut_id: astronautId,
      measurement_type: 'radiation_dose',
      value: radVal,
      unit: 'mSv',
      measured_at: timestamp,
      source: 'Active Silicon Dosimeter Array (B-Habitat)',
      context: 'Deep-space GCR flux background monitoring',
      data_quality: 'nominal',
      is_synthetic: true,
    });
  }

  return measurements;
}

export const DEMO_MEASUREMENTS: Record<string, Measurement[]> = {
  'astro-001': generateTelemetrySeries('astro-001', '2026-11-14T08:00:00Z'),
  'astro-002': generateTelemetrySeries('astro-002', '2026-11-14T08:00:00Z'),
  'astro-003': generateTelemetrySeries('astro-003', '2026-11-14T08:00:00Z'),
  'astro-004': generateTelemetrySeries('astro-004', '2026-11-14T08:00:00Z'),
  'astro-005': generateTelemetrySeries('astro-005', '2026-11-14T08:00:00Z'),
};

function createStandardBaselines(astroId: string, hrMedian: number, spo2Median: number, tempMedian: number, maturity: 'established' | 'provisional'): BaselineResponse[] {
  return [
    {
      id: `base-${astroId}-hr-inflight`,
      astronaut_id: astroId,
      measurement_type: 'heart_rate',
      context: 'resting_cabin',
      exercise_modality: null,
      measurement_site: 'Chest',
      measurement_method: 'ECG BioHarness',
      sensor_model: 'BioHarness-v3',
      unit: 'bpm',
      baseline_type: 'inflight',
      maturity,
      version: 1,
      is_active: true,
      is_finalized: false,
      supersedes_baseline_id: null,
      maturity_evaluated_at: '2026-11-14T06:00:00Z',
      maturity_criteria_snapshot: 'Sample count evaluated against operational standard',
      envelope: {
        median: hrMedian,
        q25: hrMedian - 4,
        q75: hrMedian + 4,
        iqr: 8.0,
        robust_scale_iqr: 5.93,
        mean: hrMedian + 0.4,
        std_dev: 6.2,
        min_value: hrMedian - 12,
        max_value: hrMedian + 14,
        sample_count: 48,
        window_start: '2026-11-01T00:00:00Z',
        window_end: '2026-11-14T08:00:00Z',
        disclaimer: 'Statistical reference values only. NOT medical diagnostic thresholds or clinical flight rules.',
      },
      quality_summary: { nominal: 45, degraded: 3, total_evaluated: 48 },
      created_at: '2026-11-14T06:00:00Z',
      is_synthetic: true,
    },
    {
      id: `base-${astroId}-spo2-inflight`,
      astronaut_id: astroId,
      measurement_type: 'blood_oxygen',
      context: 'resting_cabin',
      exercise_modality: null,
      measurement_site: 'Finger Optical Band',
      measurement_method: 'Photoplethysmography',
      sensor_model: 'PulseOx-Pro',
      unit: '%',
      baseline_type: 'inflight',
      maturity,
      version: 1,
      is_active: true,
      is_finalized: false,
      supersedes_baseline_id: null,
      maturity_evaluated_at: '2026-11-14T06:00:00Z',
      maturity_criteria_snapshot: 'Sample count evaluated against operational standard',
      envelope: {
        median: spo2Median,
        q25: spo2Median - 0.8,
        q75: spo2Median + 0.8,
        iqr: 1.6,
        robust_scale_iqr: 1.18,
        mean: spo2Median - 0.1,
        std_dev: 1.1,
        min_value: spo2Median - 2.5,
        max_value: 99.5,
        sample_count: 40,
        window_start: '2026-11-01T00:00:00Z',
        window_end: '2026-11-14T08:00:00Z',
        disclaimer: 'Statistical reference values only. NOT medical diagnostic thresholds or clinical flight rules.',
      },
      quality_summary: { nominal: 40, degraded: 0, total_evaluated: 40 },
      created_at: '2026-11-14T06:00:00Z',
      is_synthetic: true,
    },
    {
      id: `base-${astroId}-temp-inflight`,
      astronaut_id: astroId,
      measurement_type: 'core_temperature',
      context: 'resting_cabin',
      exercise_modality: null,
      measurement_site: 'Core GI',
      measurement_method: 'Telemetry Pill',
      sensor_model: 'CoreTemp-Capsule',
      unit: 'celsius',
      baseline_type: 'inflight',
      maturity,
      version: 1,
      is_active: true,
      is_finalized: false,
      supersedes_baseline_id: null,
      maturity_evaluated_at: '2026-11-14T06:00:00Z',
      maturity_criteria_snapshot: 'Sample count evaluated against operational standard',
      envelope: {
        median: tempMedian,
        q25: tempMedian - 0.2,
        q75: tempMedian + 0.2,
        iqr: 0.40,
        robust_scale_iqr: 0.296,
        mean: tempMedian + 0.02,
        std_dev: 0.31,
        min_value: tempMedian - 0.5,
        max_value: tempMedian + 0.6,
        sample_count: 36,
        window_start: '2026-11-01T00:00:00Z',
        window_end: '2026-11-14T08:00:00Z',
        disclaimer: 'Statistical reference values only. NOT medical diagnostic thresholds or clinical flight rules.',
      },
      quality_summary: { nominal: 34, degraded: 2, total_evaluated: 36 },
      created_at: '2026-11-14T06:00:00Z',
      is_synthetic: true,
    },
  ];
}

export const DEMO_BASELINES: Record<string, BaselineResponse[]> = {
  'astro-001': createStandardBaselines('astro-001', 68.0, 98.0, 36.95, 'established'),
  'astro-002': createStandardBaselines('astro-002', 72.0, 98.2, 36.90, 'established'),
  'astro-003': createStandardBaselines('astro-003', 66.0, 97.8, 37.05, 'provisional'),
  'astro-004': createStandardBaselines('astro-004', 70.0, 98.4, 36.88, 'established'),
  'astro-005': createStandardBaselines('astro-005', 74.0, 98.1, 36.92, 'provisional'),
};

function createStandardTrends(astroId: string, hrCur: number, hrMed: number, spo2Cur: number, tempCur: number): TrendObservation[] {
  return [
    {
      measurement_type: 'heart_rate',
      canonical_identifier: 'heart_rate',
      context: 'resting_cabin',
      exercise_modality: null,
      unit: 'bpm',
      current_value: hrCur,
      current_measured_at: '2026-11-14T08:00:00Z',
      baseline_id: `base-${astroId}-hr-inflight`,
      baseline_version: 1,
      baseline_type: 'inflight',
      baseline_maturity: 'established',
      baseline_median: hrMed,
      baseline_iqr: 8.0,
      robust_scale_iqr: 5.93,
      robust_z: +((hrCur - hrMed) / 5.93).toFixed(2),
      sample_count: 32,
      sens_slope: 0.12,
      trend_direction: 'stable',
      consecutive_deviations: 0,
      is_sustained: false,
      freshness_status: 'fresh',
      hours_since_last_observation: 0.2,
      expected_interval_hours: 6.0,
      data_quality_status: 'nominal',
      explanation: "Stable physiological trajectory within expected operational variation (|Z| <= 1.5, Sen's slope ~ 0.12 bpm/24h).",
    },
    {
      measurement_type: 'blood_oxygen',
      canonical_identifier: 'blood_oxygen',
      context: 'resting_cabin',
      exercise_modality: null,
      unit: '%',
      current_value: spo2Cur,
      current_measured_at: '2026-11-14T08:00:00Z',
      baseline_id: `base-${astroId}-spo2-inflight`,
      baseline_version: 1,
      baseline_type: 'inflight',
      baseline_maturity: 'established',
      baseline_median: 98.0,
      baseline_iqr: 1.6,
      robust_scale_iqr: 1.18,
      robust_z: +((spo2Cur - 98.0) / 1.18).toFixed(2),
      sample_count: 32,
      sens_slope: 0.02,
      trend_direction: 'stable',
      consecutive_deviations: 0,
      is_sustained: false,
      freshness_status: 'fresh',
      hours_since_last_observation: 0.2,
      expected_interval_hours: 6.0,
      data_quality_status: 'nominal',
      explanation: 'Optimal microgravity pulmonary oxygenation consistent with intra-individual baseline.',
    },
    {
      measurement_type: 'core_temperature',
      canonical_identifier: 'core_temperature',
      context: 'resting_cabin',
      exercise_modality: null,
      unit: 'celsius',
      current_value: tempCur,
      current_measured_at: '2026-11-14T08:00:00Z',
      baseline_id: `base-${astroId}-temp-inflight`,
      baseline_version: 1,
      baseline_type: 'inflight',
      baseline_maturity: 'established',
      baseline_median: 36.95,
      baseline_iqr: 0.40,
      robust_scale_iqr: 0.296,
      robust_z: +((tempCur - 36.95) / 0.296).toFixed(2),
      sample_count: 32,
      sens_slope: 0.04,
      trend_direction: 'stable',
      consecutive_deviations: 0,
      is_sustained: false,
      freshness_status: 'fresh',
      hours_since_last_observation: 0.2,
      expected_interval_hours: 8.0,
      data_quality_status: 'nominal',
      explanation: 'Core circadian thermoregulation operating within personal median boundary.',
    },
  ];
}

export const DEMO_TRENDS: Record<string, TrendObservation[]> = {
  'astro-001': createStandardTrends('astro-001', 70.0, 68.0, 98.1, 37.10),
  'astro-002': createStandardTrends('astro-002', 73.0, 72.0, 98.3, 36.92),
  'astro-003': [
    {
      measurement_type: 'heart_rate',
      canonical_identifier: 'heart_rate',
      context: 'resting_cabin',
      exercise_modality: null,
      unit: 'bpm',
      current_value: 78.0,
      current_measured_at: '2026-11-14T08:00:00Z',
      baseline_id: 'base-astro-003-hr-inflight',
      baseline_version: 1,
      baseline_type: 'inflight',
      baseline_maturity: 'provisional',
      baseline_median: 66.0,
      baseline_iqr: 8.0,
      robust_scale_iqr: 5.93,
      robust_z: 2.02,
      sample_count: 32,
      sens_slope: 1.85,
      trend_direction: 'increasing',
      consecutive_deviations: 2,
      is_sustained: false,
      freshness_status: 'fresh',
      hours_since_last_observation: 0.2,
      expected_interval_hours: 6.0,
      data_quality_status: 'nominal',
      explanation: "Resting heart rate exhibiting upward trajectory exceeding |Z| > 1.5 personal boundary.",
    },
    {
      measurement_type: 'blood_oxygen',
      canonical_identifier: 'blood_oxygen',
      context: 'resting_cabin',
      exercise_modality: null,
      unit: '%',
      current_value: null,
      current_measured_at: '2026-11-13T12:00:00Z',
      baseline_id: 'base-astro-003-spo2-inflight',
      baseline_version: 1,
      baseline_type: 'inflight',
      baseline_maturity: 'provisional',
      baseline_median: 97.8,
      baseline_iqr: 1.6,
      robust_scale_iqr: 1.18,
      robust_z: null,
      sample_count: 18,
      sens_slope: null,
      trend_direction: 'insufficient_data',
      consecutive_deviations: 0,
      is_sustained: false,
      freshness_status: 'stale',
      hours_since_last_observation: 20.0,
      expected_interval_hours: 6.0,
      data_quality_status: 'degraded',
      explanation: 'Telemetry stream is stale (20.0h elapsed; nominal interval <= 6.0h).',
    },
  ],
  'astro-004': createStandardTrends('astro-004', 69.0, 70.0, 98.5, 36.85),
  'astro-005': createStandardTrends('astro-005', 75.0, 74.0, 98.0, 36.95),
};

export const DEMO_FRESHNESS: Record<string, MetricFreshnessItem[]> = {
  'astro-001': [
    { measurement_type: 'heart_rate', last_measured_at: '2026-11-14T08:00:00Z', hours_since_last: 0.2, expected_interval_hours: 6.0, status: 'fresh', message: 'Current (0.2h ago)' },
    { measurement_type: 'blood_oxygen', last_measured_at: '2026-11-14T08:00:00Z', hours_since_last: 0.2, expected_interval_hours: 6.0, status: 'fresh', message: 'Current (0.2h ago)' },
    { measurement_type: 'core_temperature', last_measured_at: '2026-11-14T08:00:00Z', hours_since_last: 0.2, expected_interval_hours: 8.0, status: 'fresh', message: 'Current (0.2h ago)' },
  ],
  'astro-002': [
    { measurement_type: 'heart_rate', last_measured_at: '2026-11-14T08:00:00Z', hours_since_last: 0.2, expected_interval_hours: 6.0, status: 'fresh', message: 'Current (0.2h ago)' },
    { measurement_type: 'blood_oxygen', last_measured_at: '2026-11-14T08:00:00Z', hours_since_last: 0.2, expected_interval_hours: 6.0, status: 'fresh', message: 'Current (0.2h ago)' },
  ],
  'astro-003': [
    { measurement_type: 'heart_rate', last_measured_at: '2026-11-14T08:00:00Z', hours_since_last: 0.2, expected_interval_hours: 6.0, status: 'fresh', message: 'Current (0.2h ago)' },
    { measurement_type: 'blood_oxygen', last_measured_at: '2026-11-13T12:00:00Z', hours_since_last: 20.0, expected_interval_hours: 6.0, status: 'stale', message: 'Telemetry stale (20.0h elapsed)' },
  ],
  'astro-004': [
    { measurement_type: 'heart_rate', last_measured_at: '2026-11-14T08:00:00Z', hours_since_last: 0.2, expected_interval_hours: 6.0, status: 'fresh', message: 'Current (0.2h ago)' },
  ],
  'astro-005': [
    { measurement_type: 'heart_rate', last_measured_at: '2026-11-14T08:00:00Z', hours_since_last: 0.2, expected_interval_hours: 6.0, status: 'fresh', message: 'Current (0.2h ago)' },
  ],
};

export const DEMO_ASSESSMENTS: Record<string, AssessmentResponse[]> = {
  'astro-001': [
    {
      id: 'asm-001-latest',
      astronaut_id: 'astro-001',
      assessment_date: '2026-11-14T08:00:00Z',
      overall_classification: 'routine',
      summary_explanation:
        "Astronaut physiological telemetry is operating within nominal intra-individual baseline envelopes for context 'resting_cabin'. No sustained deviations or multi-parameter concordant shifts detected across the 72h lookback window.",
      findings: [
        {
          measurement_type: 'heart_rate',
          status: 'nominal',
          summary: 'heart_rate: Operating within nominal personal baseline envelope (|Z| = 0.34 <= 1.5).',
          current_value: 70.0,
          baseline_median: 68.0,
          robust_z: 0.34,
          trend: 'stable',
          baseline_version: 1,
        },
        {
          measurement_type: 'blood_oxygen',
          status: 'nominal',
          summary: 'blood_oxygen: Nominal arterial saturation aligned with microgravity baseline.',
          current_value: 98.1,
          baseline_median: 98.0,
          robust_z: 0.08,
          trend: 'stable',
          baseline_version: 1,
        },
      ],
      guidance: [
        {
          category: 'telemetry_schedule',
          action: 'Maintain scheduled routine telemetry collection intervals.',
          rationale: 'All monitored vitals are operating within established intra-individual baselines.',
          is_medical_prescription: false,
        },
      ],
      baseline_versions_used: {
        heart_rate: 'base-astro-001-hr-inflight (v1)',
        blood_oxygen: 'base-astro-001-spo2-inflight (v1)',
      },
      data_quality_status: 'nominal',
      is_synthetic: true,
      created_at: '2026-11-14T08:00:00Z',
    },
  ],
  'astro-002': [
    {
      id: 'asm-002-latest',
      astronaut_id: 'astro-002',
      assessment_date: '2026-11-14T08:00:00Z',
      overall_classification: 'routine',
      summary_explanation: "Nominal operational telemetry. Core vitals congruent with personal baseline parameters.",
      findings: [
        {
          measurement_type: 'heart_rate',
          status: 'nominal',
          summary: 'heart_rate: Within normal envelope.',
          current_value: 73.0,
          baseline_median: 72.0,
          robust_z: 0.17,
          trend: 'stable',
          baseline_version: 1,
        },
      ],
      guidance: [
        {
          category: 'telemetry_schedule',
          action: 'Maintain nominal schedule.',
          rationale: 'Baseline congruent.',
          is_medical_prescription: false,
        },
      ],
      baseline_versions_used: { heart_rate: 'base-astro-002-hr-inflight (v1)' },
      data_quality_status: 'nominal',
      is_synthetic: true,
      created_at: '2026-11-14T08:00:00Z',
    },
  ],
  'astro-003': [
    {
      id: 'asm-003-latest',
      astronaut_id: 'astro-003',
      assessment_date: '2026-11-14T08:00:00Z',
      overall_classification: 'needs_attention',
      summary_explanation:
        "Telemetry attention flag: blood_oxygen data is stale (20.0h elapsed vs 6.0h expected threshold). In addition, mild resting elevation observed in heart rate (|Z| = 2.02).",
      findings: [
        {
          measurement_type: 'blood_oxygen',
          status: 'stale',
          summary: 'blood_oxygen: Telemetry collection overdue by 14.0 hours.',
          current_value: null,
          baseline_median: 97.8,
          robust_z: null,
          trend: 'insufficient_data',
          baseline_version: 1,
        },
        {
          measurement_type: 'heart_rate',
          status: 'elevated',
          summary: 'heart_rate: Elevated above personal baseline envelope (|Z| = 2.02).',
          current_value: 78.0,
          baseline_median: 66.0,
          robust_z: 2.02,
          trend: 'increasing',
          baseline_version: 1,
        },
      ],
      guidance: [
        {
          category: 'telemetry_verification',
          action: 'Prompt crew member to verify pulse oximeter optical band battery and sync link.',
          rationale: 'Data staleness exceeding 3x expected interval degrades trend intelligence fidelity.',
          is_medical_prescription: false,
        },
      ],
      baseline_versions_used: {
        blood_oxygen: 'base-astro-003-spo2-inflight (v1)',
        heart_rate: 'base-astro-003-hr-inflight (v1)',
      },
      data_quality_status: 'degraded',
      is_synthetic: true,
      created_at: '2026-11-14T08:00:00Z',
    },
  ],
  'astro-004': [
    {
      id: 'asm-004-latest',
      astronaut_id: 'astro-004',
      assessment_date: '2026-11-14T08:00:00Z',
      overall_classification: 'routine',
      summary_explanation: "Nominal operational telemetry. All monitored channels operating within established envelope.",
      findings: [],
      guidance: [
        {
          category: 'telemetry_schedule',
          action: 'Maintain scheduled routine monitoring.',
          rationale: 'Parameters nominal.',
          is_medical_prescription: false,
        },
      ],
      baseline_versions_used: {},
      data_quality_status: 'nominal',
      is_synthetic: true,
      created_at: '2026-11-14T08:00:00Z',
    },
  ],
  'astro-005': [
    {
      id: 'asm-005-latest',
      astronaut_id: 'astro-005',
      assessment_date: '2026-11-14T08:00:00Z',
      overall_classification: 'routine',
      summary_explanation: "Nominal operational telemetry for ISS Expedition 74 crew member.",
      findings: [],
      guidance: [
        {
          category: 'telemetry_schedule',
          action: 'Maintain scheduled routine monitoring.',
          rationale: 'Parameters nominal.',
          is_medical_prescription: false,
        },
      ],
      baseline_versions_used: {},
      data_quality_status: 'nominal',
      is_synthetic: true,
      created_at: '2026-11-14T08:00:00Z',
    },
  ],
};

export const DEMO_ALERTS: AlertResponse[] = [
  {
    id: 'alt-001',
    astronaut_id: 'astro-003',
    assessment_id: 'asm-003-latest',
    measurement_type: 'blood_oxygen',
    category: 'data_staleness',
    severity: 'medium',
    title: 'Pulse Oximeter Telemetry Overdue',
    explanation: 'No arterial saturation telemetry received for 20.0 hours (expected interval <= 6.0 hours).',
    status: 'active',
    created_at: '2026-11-14T07:30:00Z',
    acknowledged_at: null,
    resolved_at: null,
    is_synthetic: true,
  },
  {
    id: 'alt-002',
    astronaut_id: 'astro-001',
    assessment_id: 'asm-001-prior',
    measurement_type: 'heart_rate',
    category: 'physiological_shift',
    severity: 'low',
    title: 'Transient Post-Exercise Elevation',
    explanation: 'Heart rate elevated to 84 bpm during post-EVA decompression review; returned to personal baseline.',
    status: 'resolved',
    created_at: '2026-11-12T14:00:00Z',
    acknowledged_at: '2026-11-12T14:15:00Z',
    resolved_at: '2026-11-12T16:00:00Z',
    is_synthetic: true,
  },
  {
    id: 'alt-003',
    astronaut_id: 'astro-002',
    assessment_id: 'asm-002-prior',
    measurement_type: 'core_temperature',
    category: 'physiological_shift',
    severity: 'medium',
    title: 'Core Temperature Mild Circadian Drift',
    explanation: 'Core temperature observed at 37.4°C across consecutive cycles; operator logged environmental HVAC review.',
    status: 'acknowledged',
    created_at: '2026-11-13T18:00:00Z',
    acknowledged_at: '2026-11-13T18:45:00Z',
    resolved_at: null,
    is_synthetic: true,
  },
];
