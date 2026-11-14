import { MeasurementType } from '../../types/measurement';

export type AnatomicalRegionId =
  | 'cardiovascular'
  | 'musculoskeletal'
  | 'ocular'
  | 'neurological'
  | 'thermoregulation'
  | 'respiratory';

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
  isContinuousTelemetryAvailable: boolean;
  notes?: string;
  clinicalProtocolNotice?: string;
}

/**
 * Authoritative Anatomical Region Registry for COSMOLOOKUP
 * 
 * Strict Scientific & Ethical Rules:
 * 1. Highlighting a body region is a spatial navigation mechanism, NOT an organ diagnosis.
 * 2. Measurements are only mapped where a scientifically sound biomedical proxy exists.
 * 3. Unavailable continuous telemetry (e.g. ocular SANS, musculoskeletal bone density) is
 *    clearly flagged as unavailable rather than simulated as nominal.
 * 4. Non-anatomical factors (radiation, sleep architecture, environment) are handled
 *    through dedicated non-anatomical channels.
 */
export const ANATOMICAL_REGIONS: Record<AnatomicalRegionId, AnatomicalRegionDefinition> = {
  cardiovascular: {
    id: 'cardiovascular',
    label: 'Cardiovascular System',
    system: 'Circulatory & Hemodynamics',
    description: 'Mediastinal cardiac pump, aortic root, and systemic arterial hemodynamic circulation.',
    scientificRationale:
      'Ventricular contraction rate and systemic arterial pressure track primary cardiac operational cadence during microgravity cephalad fluid shifts and exercise countermeasures.',
    telemetryKeys: ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic'],
    meshIds: ['mesh_heart', 'mesh_aorta', 'mesh_torso_cardio'],
    color: '#f43f5e', // rose
    cameraTarget: [0, 0.45, 0],
    cameraPosition: [0, 0.5, 2.5],
    isContinuousTelemetryAvailable: true,
    notes: 'Acquired via thoracic BioHarness band and ambulatory blood pressure cuffs.',
    clinicalProtocolNotice: 'Continuous heart rate monitoring tracks cardiovascular deconditioning and autonomic regulation.',
  },

  musculoskeletal: {
    id: 'musculoskeletal',
    label: 'Musculoskeletal Framework',
    system: 'Axial Skeleton, Bone Mineral & Muscle Mass',
    description: 'Vertebral column (cervical to lumbar), thoracic ribcage, pelvic girdle, and extremities.',
    scientificRationale:
      'Continuous physiological telemetry sensors are NOT deployed in-flight for bone mineral density, vertebral elongation, or muscle atrophy. Ground DXA scans and ARED exercise countermeasure resistive logs provide periodic empirical evaluation.',
    telemetryKeys: [],
    meshIds: ['mesh_spine', 'mesh_pelvis', 'mesh_ribs', 'mesh_clavicles', 'mesh_femur_l', 'mesh_femur_r'],
    color: '#a855f7', // purple
    cameraTarget: [0, 0.1, 0],
    cameraPosition: [0, 0.2, 3.2],
    isContinuousTelemetryAvailable: false,
    notes: 'No continuous telemetry stream available. Monitored via periodic exercise countermeasure logs and post-flight imaging.',
    clinicalProtocolNotice: 'Absence of continuous streaming telemetry does not imply nominal bone or muscle status. NASA flight rules allocate 2.5 hours total daily exercise time, comprising ~60–90 min dedicated ARED resistive loading plus ~30–45 min aerobic conditioning (T2 treadmill or CEVIS bike) with setup and hygiene.',
  },

  ocular: {
    id: 'ocular',
    label: 'Ocular & Visual System (SANS)',
    system: 'Ophthalmic & Optic Nerve Pathway',
    description: 'Bilateral orbits, optic nerve sheath, globe morphology, and retinal microvasculature.',
    scientificRationale:
      'Spaceflight-Associated Neuro-ocular Syndrome (SANS) manifests as optic disc edema, globe flattening, and choroidal folds driven by cephalad venous fluid redistribution. No continuous streaming sensor monitors optic nerve morphology.',
    telemetryKeys: [],
    meshIds: ['mesh_eye_left', 'mesh_eye_right', 'mesh_optic_tract'],
    color: '#38bdf8', // sky/cyan
    cameraTarget: [0, 1.45, 0],
    cameraPosition: [0, 1.48, 1.8],
    isContinuousTelemetryAvailable: false,
    notes: 'Evaluated via scheduled in-flight optical coherence tomography (OCT) and funduscopy. No continuous telemetry sensor deployed.',
    clinicalProtocolNotice: 'No continuous streaming telemetry is assigned to ocular anatomy. In-flight SANS surveillance follows scheduled periodic diagnostic imaging protocols (e.g., illustrative 30-to-60 day cadence per Spaceflight Standard Measures; exact schedule determined by mission flight rules).',
  },

  neurological: {
    id: 'neurological',
    label: 'Neurological & Sensorimotor System',
    system: 'Central Nervous System & Vestibular Balance',
    description: 'Neurocranium, cerebral compartments, vestibular inner ear apparatus, and sensorimotor balance.',
    scientificRationale:
      'Evaluates neurovestibular space motion adaptation and sensorimotor balance. Sleep duration and sleep staging are non-anatomical operational metrics tracked in the Non-Anatomical Habitat Drawer, NOT mapped to cranial brain tissue. Peripheral pulse oximetry reflects systemic capillary saturation, NOT intracranial parenchymal tissue oxygenation.',
    telemetryKeys: [],
    meshIds: ['mesh_cranium', 'mesh_brain', 'mesh_vestibular'],
    color: '#06b6d4', // cyan
    cameraTarget: [0, 1.35, 0],
    cameraPosition: [0, 1.4, 2.2],
    isContinuousTelemetryAvailable: false,
    notes: 'Scientific Guardrail: Sleep architecture is tracked via non-anatomical telemetry channels. SpO2 is peripheral oxygen saturation and mapped under Pulmonary/Respiratory gas exchange. Peripheral SpO2 reflects systemic capillary saturation, NOT intracranial parenchymal tissue oxygenation.',
    clinicalProtocolNotice: 'Sensorimotor coordination and motion sickness are tracked through scheduled operational protocols and subjective crew reports.',
  },

  thermoregulation: {
    id: 'thermoregulation',
    label: 'Core Thermoregulation',
    system: 'Visceral & Deep Core Metabolic Regulation',
    description: 'Internal visceral core thermal homeostasis and circadian temperature rhythm.',
    scientificRationale:
      'Monitors core body temperature and circadian rhythm shifts. Elevation in resting core temperature (spaceflight thermoregulation impairment) is tracked during active mission days.',
    telemetryKeys: ['core_temperature', 'body_temperature'],
    meshIds: ['mesh_abdomen', 'mesh_viscera', 'mesh_sensor_pill'],
    color: '#f59e0b', // amber
    cameraTarget: [0, -0.05, 0],
    cameraPosition: [0, -0.05, 2.6],
    isContinuousTelemetryAvailable: true,
    notes: 'Acquired telemetrically from an ingestible radio-frequency thermal sensor capsule in the GI tract or dermal sensors.',
    clinicalProtocolNotice: 'Post-exercise recovery kinetics reflect thermoregulatory countermeasure efficacy.',
  },

  respiratory: {
    id: 'respiratory',
    label: 'Pulmonary / Respiratory System',
    system: 'Pulmonary Ventilation & Gas Exchange',
    description: 'Bilateral lung lobes, bronchial arborization, and alveolar gas exchange.',
    scientificRationale:
      'Respiratory rate measures thoracic expansion cadence. Arterial oxygen saturation (SpO2) measures peripheral oxygen saturation by pulse oximetry.',
    telemetryKeys: ['respiratory_rate', 'spo2'],
    meshIds: ['mesh_lung_l', 'mesh_lung_r', 'mesh_trachea'],
    color: '#10b981', // emerald
    cameraTarget: [0, 0.5, 0],
    cameraPosition: [0, 0.55, 2.6],
    isContinuousTelemetryAvailable: true,
    notes: 'Respiratory impedance sensors coupled with peripheral pulse oximetry (SpO2). SpO2 measures peripheral oxygen saturation by pulse oximetry.',
    clinicalProtocolNotice: 'Monitors microgravity pulmonary ventilation-perfusion matching and atmospheric scrub efficiency.',
  },
};

export const ANATOMICAL_REGION_LIST = Object.values(ANATOMICAL_REGIONS);
