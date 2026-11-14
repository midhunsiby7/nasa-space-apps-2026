import { MeasurementType } from '../../types/measurement';

export type AnatomicalRegionId =
  | 'cranial'
  | 'cardiovascular'
  | 'respiratory'
  | 'thermoregulation'
  | 'musculoskeletal'
  | 'lower_limbs';

export interface AnatomicalRegionDefinition {
  id: AnatomicalRegionId;
  label: string;
  system: string;
  description: string;
  scientificRationale: string;
  telemetryKeys: MeasurementType[];
  meshIds: string[];
  color: string;
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  hasPeripheralProxy?: boolean;
  notes?: string;
}

/**
 * Authoritative Anatomical Region Registry
 * Maps 3D body segments to strictly justified physiological telemetry channels.
 * Prevents unwarranted medical claims or speculative anatomical associations.
 */
export const ANATOMICAL_REGIONS: Record<AnatomicalRegionId, AnatomicalRegionDefinition> = {
  cardiovascular: {
    id: 'cardiovascular',
    label: 'Cardiovascular System',
    system: 'Circulatory & Hemodynamics',
    description: 'Mediastinal cardiac pump, aortic root, and systemic arterial pressure dynamics.',
    scientificRationale:
      'Ventricular contraction rate and systemic arterial pressure represent primary cardiac operational markers under microgravity fluid-shift readaptation.',
    telemetryKeys: ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic'],
    meshIds: ['mesh_heart', 'mesh_aorta', 'mesh_torso_cardio'],
    color: '#f43f5e', // rose
    cameraTarget: [0, 0.45, 0],
    cameraPosition: [0, 0.5, 2.6],
    notes: 'Heart rate and blood pressure measurements are acquired via chest band and ambulatory cuff sensors.',
  },
  respiratory: {
    id: 'respiratory',
    label: 'Pulmonary / Respiratory System',
    system: 'Pulmonary & Gas Exchange',
    description: 'Bilateral lung lobes, bronchial airway arborization, and peripheral oxygen saturation.',
    scientificRationale:
      'Respiratory frequency tracks pulmonary ventilation cadence. SpO2 reflects peripheral arterial oxygen saturation as a proxy for systemic oxygen delivery.',
    telemetryKeys: ['respiratory_rate', 'spo2'],
    meshIds: ['mesh_lungs_left', 'mesh_lungs_right', 'mesh_trachea'],
    color: '#10b981', // emerald
    cameraTarget: [0, 0.5, 0],
    cameraPosition: [0, 0.55, 2.7],
    hasPeripheralProxy: true,
    notes: 'SpO2 is measured via peripheral pulse oximetry, reflecting systemic capillary blood oxygenation.',
  },
  thermoregulation: {
    id: 'thermoregulation',
    label: 'Core Thermoregulation',
    system: 'Metabolic & Core Thermal Regulation',
    description: 'Deep visceral thermal balance and internal gastrointestinal thermometry.',
    scientificRationale:
      'Continuous body temperature monitoring tracks circadian thermoregulation and thermal strain during exercise countermeasures.',
    telemetryKeys: ['body_temperature'],
    meshIds: ['mesh_abdomen', 'mesh_core_viscera', 'mesh_sensor_capsule'],
    color: '#f59e0b', // amber
    cameraTarget: [0, -0.05, 0],
    cameraPosition: [0, -0.05, 2.8],
    notes: 'Telemetric reading originates from an ingestible thermal core pill sensor capsule in the GI tract.',
  },
  cranial: {
    id: 'cranial',
    label: 'Head / Cranial Neuro-System',
    system: 'Cranial & Ocular Vasculature',
    description: 'Neurocranium, cephalad intracranial fluid compartment, and circadian sleep rest staging.',
    scientificRationale:
      'Tracks consolidated circadian sleep cycle duration. Systemic SpO2 is referenced as a general oxygenation metric; peripheral sensors do not measure intracranial parenchymal oxygenation directly.',
    telemetryKeys: ['sleep_duration', 'spo2'],
    meshIds: ['mesh_cranium', 'mesh_face', 'mesh_cervical'],
    color: '#38bdf8', // cyan
    cameraTarget: [0, 1.35, 0],
    cameraPosition: [0, 1.4, 2.2],
    hasPeripheralProxy: true,
    notes: 'Scientific Notice: SpO2 indicates peripheral capillary saturation; it does not measure intracranial parenchymal cerebral tissue oxygenation.',
  },
  musculoskeletal: {
    id: 'musculoskeletal',
    label: 'Musculoskeletal & Axial Spine',
    system: 'Skeletal & Biomechanical Framework',
    description: 'Vertebral column, pelvic girdle, shoulder girdle, and postural countermeasures.',
    scientificRationale:
      'No continuous physiological sensor is actively streaming biomechanical loads, bone mineral density, or muscle volume in current flight telemetry.',
    telemetryKeys: [],
    meshIds: ['mesh_spine', 'mesh_pelvis', 'mesh_ribs', 'mesh_clavicles'],
    color: '#8b5cf6', // purple
    cameraTarget: [0, 0.2, 0],
    cameraPosition: [0, 0.3, 3.2],
    notes: 'No active telemetry channels are currently recording for musculoskeletal biomechanics.',
  },
  lower_limbs: {
    id: 'lower_limbs',
    label: 'Lower Extremities & Venous Reservoir',
    system: 'Peripheral Musculoskeletal & Venous Pool',
    description: 'Femoral/tibial skeleton, calf venous muscle pump, and orthostatic fluid-shift zone.',
    scientificRationale:
      'Microgravity eliminates hydrostatic venous pooling in lower extremities (causing cephalad fluid shifts). No localized telemetry sensors are streaming for lower limbs.',
    telemetryKeys: [],
    meshIds: ['mesh_thigh_left', 'mesh_thigh_right', 'mesh_leg_left', 'mesh_leg_right'],
    color: '#64748b', // slate
    cameraTarget: [0, -0.9, 0],
    cameraPosition: [0, -0.9, 3.0],
    notes: 'No localized telemetry sensors are currently streaming from lower extremities.',
  },
};

export const ANATOMICAL_REGION_LIST = Object.values(ANATOMICAL_REGIONS);
