import { Astronaut } from '../types/astronaut';
import { Measurement } from '../types/measurement';

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
    const hrSynthetic = astronautId !== 'astro-001' || timeIndex > 8;
    measurements.push({
      id: `meas-${astronautId}-hr-${i}`,
      astronaut_id: astronautId,
      measurement_type: 'heart_rate',
      value: hrVal,
      unit: 'bpm',
      measured_at: timestamp,
      source: hrSynthetic ? 'Synthetic Biometrics Simulator v1.4' : 'BioHarness v3 Telemetry Stream',
      context: timeIndex === 11 ? 'Moderate aerobic countermeasure workout' : 'Habitat intra-vehicular baseline',
      data_quality: timeIndex === 6 ? 'interpolated' : 'nominal',
      is_synthetic: hrSynthetic,
    });

    // 2. Blood Oxygen (SpO2 %)
    const spo2Val = +(97.5 + Math.cos(timeIndex * 0.3) * 0.9 - (timeIndex === 11 ? 0.6 : 0)).toFixed(1);
    const spo2Synthetic = astronautId === 'astro-003' || astronautId === 'astro-004';
    measurements.push({
      id: `meas-${astronautId}-spo2-${i}`,
      astronaut_id: astronautId,
      measurement_type: 'blood_oxygen',
      value: spo2Val,
      unit: '%',
      measured_at: timestamp,
      source: spo2Synthetic ? 'Empirical Analog Transfer Model' : 'Pulse Oximeter Optical Band',
      context: 'Atmospheric partial pressure: 101.3 kPa (Nominal)',
      data_quality: 'nominal',
      is_synthetic: spo2Synthetic,
    });

    // 3. Core Temperature (celsius)
    const tempVal = +(36.9 + Math.sin(timeIndex * 0.25) * 0.35 + (timeIndex === 11 ? 0.5 : 0)).toFixed(2);
    const tempSynthetic = false; // Empirical ingestible capsule sensor data
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
      is_synthetic: tempSynthetic,
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
      is_synthetic: false,
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
