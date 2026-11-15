import { MeasurementType } from '../../types/measurement';

export type AnatomyMeshName =
  | 'Brain_and_Spinal_Cord'
  | 'Skull_RibCage_Spine_Skeleton'
  | 'Lungs_and_Bronchial_Tree'
  | 'Heart_Myocardium'
  | 'Liver_Hepatic_Lobes'
  | 'Stomach_Gastric_Curvature'
  | 'Kidneys_Bilateral_Renal'
  | 'Intestines_Small_and_Large_Colon'
  | 'Urinary_Bladder_and_Ureters'
  | 'Major_Arteries_Red'
  | 'Major_Veins_Blue'
  | 'Muscular_Structures'
  | 'Human_Body_Structure_Outer_Shell';

export type AnatomyComponentId =
  | 'brain_spine'
  | 'skeleton'
  | 'lungs'
  | 'heart'
  | 'liver'
  | 'stomach'
  | 'kidneys'
  | 'intestines'
  | 'bladder'
  | 'arteries'
  | 'veins'
  | 'muscles'
  | 'body_shell';

export type AnatomyLayer = 'nerves' | 'bones' | 'muscles' | 'organs' | 'vessels' | 'shell';

export type AnatomyViewMode = 'full' | 'nerves' | 'bones' | 'muscles';

export interface AnatomyComponentMetadata {
  id: AnatomyComponentId;
  meshName: AnatomyMeshName;
  label: string;
  system: string;
  layer: AnatomyLayer;
  telemetryKeys: MeasurementType[];
  isContinuousTelemetryAvailable: boolean;
  description: string;
  scientificRationale: string;
  clinicalProtocolNotice: string;
  defaultColor: string;
  targetPosition: [number, number, number];
  cameraPosition: [number, number, number];
  pickPriority: number; // Lower number = higher picking priority when raycasting through translucent shells
}

export const ANATOMY_COMPONENTS: Record<AnatomyComponentId, AnatomyComponentMetadata> = {
  heart: {
    id: 'heart',
    meshName: 'Heart_Myocardium',
    label: 'Heart & Myocardium',
    system: 'Cardiovascular / Hemodynamic',
    layer: 'organs',
    telemetryKeys: ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic'],
    isContinuousTelemetryAvailable: true,
    description: 'Ventricular myocardium, atrial chambers, and central cardiac conduction system.',
    scientificRationale:
      'Microgravity induces cephalad fluid redistribution, reducing central venous pressure and triggering baroreceptor-mediated cardiac stroke volume adaptations.',
    clinicalProtocolNotice:
      'Continuous telemetry monitoring tracks resting bradycardia/tachycardia and cardiac rhythm stability during rest and countermeasure exercise.',
    defaultColor: '#f43f5e', // rose
    targetPosition: [0.03, 0.16, 0.05],
    cameraPosition: [0.1, 0.22, 1.2],
    pickPriority: 1,
  },
  lungs: {
    id: 'lungs',
    meshName: 'Lungs_and_Bronchial_Tree',
    label: 'Lungs & Bronchial Tree',
    system: 'Cardiopulmonary / Respiratory',
    layer: 'organs',
    telemetryKeys: ['respiratory_rate', 'spo2'],
    isContinuousTelemetryAvailable: true,
    description: 'Bilateral lung parenchyma, alveolar capillaries, and bronchial arborization.',
    scientificRationale:
      'Cephalad fluid shift increases pulmonary capillary blood volume and alters ventilation-perfusion matching. SpO2 tracks systemic capillary oxygenation.',
    clinicalProtocolNotice:
      'Transthoracic impedance sensor acquires respiration rate. Peripheral pulse oximetry provides peripheral arterial saturation (SpO2). Peripheral SpO2 reflects systemic capillary saturation, NOT intracranial parenchymal tissue oxygenation.',
    defaultColor: '#06b6d4', // cyan
    targetPosition: [0, 0.16, 0.04],
    cameraPosition: [0, 0.22, 1.3],
    pickPriority: 2,
  },
  brain_spine: {
    id: 'brain_spine',
    meshName: 'Brain_and_Spinal_Cord',
    label: 'Brain & Spinal Cord (CNS)',
    system: 'Central Nervous System',
    layer: 'nerves',
    telemetryKeys: [],
    isContinuousTelemetryAvailable: false,
    description: 'Cerebrum, cerebellum, brainstem, and full-length spinal cord through the sacral canal.',
    scientificRationale:
      'Central neuro-axis coordinates sensorimotor adaptation and space motion sickness. Note: Geometry models the central nervous system only; peripheral extremity nerves are not present in the mesh asset.',
    clinicalProtocolNotice:
      'Continuous invasive intracranial pressure sensors are NOT deployed in-flight. SANS and neurovestibular health are evaluated via scheduled clinical exams, neuro-cognitive testing batteries, and symptom assessments.',
    defaultColor: '#38bdf8', // sky
    targetPosition: [0, 0.58, 0.02],
    cameraPosition: [0, 0.65, 1.2],
    pickPriority: 1,
  },
  skeleton: {
    id: 'skeleton',
    meshName: 'Skull_RibCage_Spine_Skeleton',
    label: 'Axial & Appendicular Skeleton',
    system: 'Skeletal Framework',
    layer: 'bones',
    telemetryKeys: [],
    isContinuousTelemetryAvailable: false,
    description: 'Cranium, vertebral column, thoracic cage, pelvic girdle, and long bones of the upper and lower extremities.',
    scientificRationale:
      'Weightlessness removes axial gravitational loading, accelerating osteoclastic bone mineral resorption (~1% bone density loss per month without resistive exercise). Continuous streaming telemetry is unavailable for bone mineral density.',
    clinicalProtocolNotice:
      'No continuous streaming sensor monitors bone mineral density in flight. Protection relies on daily ARED high-load resistive countermeasure loading protocols.',
    defaultColor: '#e2e8f0', // slate
    targetPosition: [0, 0.0, 0],
    cameraPosition: [0, 0.1, 2.2],
    pickPriority: 4,
  },
  muscles: {
    id: 'muscles',
    meshName: 'Muscular_Structures',
    label: 'Muscular Framework',
    system: 'Musculoskeletal (Muscular)',
    layer: 'muscles',
    telemetryKeys: [],
    isContinuousTelemetryAvailable: false,
    description: 'Integrated postural and locomotor muscle groups across the trunk, cervical spine, and extremities.',
    scientificRationale:
      'Postural antigravity muscles (soleus, gastrocnemius, quadriceps, paraspinal extensors) experience rapid atrophy without mechanical countermeasure load. Continuous telemetry is unavailable.',
    clinicalProtocolNotice:
      'NASA flight rules mandate daily countermeasure exercise sessions (ARED resistive protocol plus T2 treadmill / CEVIS cycle ergometer conditioning) to maintain functional muscle mass.',
    defaultColor: '#f97316', // orange
    targetPosition: [0, -0.15, 0],
    cameraPosition: [0, -0.05, 2.2],
    pickPriority: 5,
  },
  arteries: {
    id: 'arteries',
    meshName: 'Major_Arteries_Red',
    label: 'Systemic Arterial Network',
    system: 'Circulatory (Arterial)',
    layer: 'vessels',
    telemetryKeys: ['blood_pressure_systolic', 'blood_pressure_diastolic'],
    isContinuousTelemetryAvailable: true,
    description: 'Ascending/descending aorta, carotid arteries, subclavian arches, and systemic arterial distribution.',
    scientificRationale:
      'Arterial stiffness and vascular remodeling occur during extended spaceflight missions due to altered transmural pressure gradients.',
    clinicalProtocolNotice:
      'Periodic ambulatory blood pressure monitoring and arterial pulse contour assessments evaluate systemic vascular resistance.',
    defaultColor: '#ef4444', // red
    targetPosition: [0, 0.12, 0.02],
    cameraPosition: [0, 0.18, 1.3],
    pickPriority: 3,
  },
  veins: {
    id: 'veins',
    meshName: 'Major_Veins_Blue',
    label: 'Systemic Venous Network',
    system: 'Circulatory (Venous)',
    layer: 'vessels',
    telemetryKeys: [],
    isContinuousTelemetryAvailable: false,
    description: 'Superior and inferior vena cava, internal jugular veins, femoral veins, and systemic venous return.',
    scientificRationale:
      'Internal jugular venous stasis and retrograde flow have been documented in microgravity, presenting an operational thrombosis risk.',
    clinicalProtocolNotice:
      'Evaluated through scheduled in-flight vascular ultrasound protocols rather than continuous streaming sensors.',
    defaultColor: '#3b82f6', // blue
    targetPosition: [0, 0.12, 0.02],
    cameraPosition: [0, 0.18, 1.3],
    pickPriority: 3,
  },
  liver: {
    id: 'liver',
    meshName: 'Liver_Hepatic_Lobes',
    label: 'Liver & Hepatic Lobes',
    system: 'Gastrointestinal / Metabolic',
    layer: 'organs',
    telemetryKeys: [],
    isContinuousTelemetryAvailable: false,
    description: 'Right and left hepatic lobes, portal venous perfusion, and metabolic processing parenchyma.',
    scientificRationale:
      'Hepatic drug metabolism, cytochrome P450 enzyme kinetics, and lipid handling are modulated by spaceflight environmental factors.',
    clinicalProtocolNotice:
      'Monitored through periodic blood biomarker draws and scheduled mission clinical panels.',
    defaultColor: '#b45309', // amber/brown
    targetPosition: [0.06, 0.04, 0.04],
    cameraPosition: [0.1, 0.08, 1.2],
    pickPriority: 2,
  },
  stomach: {
    id: 'stomach',
    meshName: 'Stomach_Gastric_Curvature',
    label: 'Stomach & Gastric Curvature',
    system: 'Gastrointestinal',
    layer: 'organs',
    telemetryKeys: [],
    isContinuousTelemetryAvailable: false,
    description: 'Gastric fundus, body, and antrum involved in initial microgravity bolus digestion.',
    scientificRationale:
      'Gastric emptying kinetics and visceral motility may be delayed during initial space adaptation motion sickness.',
    clinicalProtocolNotice:
      'Symptom-driven evaluation; prophylactic anti-nausea medications administered as indicated by flight surgeon protocols.',
    defaultColor: '#fbbf24', // amber
    targetPosition: [-0.05, 0.02, 0.04],
    cameraPosition: [-0.08, 0.06, 1.2],
    pickPriority: 2,
  },
  kidneys: {
    id: 'kidneys',
    meshName: 'Kidneys_Bilateral_Renal',
    label: 'Bilateral Kidneys',
    system: 'Renal / Fluid Regulation',
    layer: 'organs',
    telemetryKeys: [],
    isContinuousTelemetryAvailable: false,
    description: 'Renal cortex, medullary pyramids, and filtration structures maintaining electrolyte and fluid homeostasis.',
    scientificRationale:
      'Spaceflight induces hypercalciuria from skeletal demineralization, elevating nephrolithiasis (kidney stone) operational formation risk.',
    clinicalProtocolNotice:
      'Strict daily hydration minimums (~2.5 L/day) and periodic urine chemistry assessments mitigate renal stone risk.',
    defaultColor: '#d97706', // dark amber
    targetPosition: [0, -0.02, -0.02],
    cameraPosition: [0, 0.02, 1.2],
    pickPriority: 2,
  },
  intestines: {
    id: 'intestines',
    meshName: 'Intestines_Small_and_Large_Colon',
    label: 'Intestines & Colon',
    system: 'Gastrointestinal & Microbiome',
    layer: 'organs',
    telemetryKeys: ['core_temperature'],
    isContinuousTelemetryAvailable: true,
    description: 'Duodenum, jejunum, ileum, and large colon participating in nutrient absorption and thermal sensor pill transit.',
    scientificRationale:
      'Microgravity alters intestinal transit kinetics, nutrient absorption, and gut microbiome diversity. An ingestible telemetry capsule transmits continuous core body temperature.',
    clinicalProtocolNotice:
      'Ingestible wireless sensor pill provides continuous core body temperature telemetry during gastrointestinal transit.',
    defaultColor: '#ca8a04', // olive/amber
    targetPosition: [0, -0.1, 0.04],
    cameraPosition: [0, -0.05, 1.2],
    pickPriority: 2,
  },
  bladder: {
    id: 'bladder',
    meshName: 'Urinary_Bladder_and_Ureters',
    label: 'Urinary Bladder & Ureters',
    system: 'Renal & Excretory',
    layer: 'organs',
    telemetryKeys: [],
    isContinuousTelemetryAvailable: false,
    description: 'Pelvic urinary reservoir and bilateral ureters conveying excreted fluid.',
    scientificRationale:
      'Microgravity blunts normal hydrostatic pressure sensation in the pelvic reservoir, altering voluntary voiding intervals.',
    clinicalProtocolNotice:
      'Operational voiding schedule and fluid intake-output logging maintained by crew.',
    defaultColor: '#f59e0b', // amber
    targetPosition: [0, -0.22, 0.04],
    cameraPosition: [0, -0.18, 1.2],
    pickPriority: 2,
  },
  body_shell: {
    id: 'body_shell',
    meshName: 'Human_Body_Structure_Outer_Shell',
    label: 'Human Outer Boundary (Silhouette)',
    system: 'Integumentary & Spatial Boundary',
    layer: 'shell',
    telemetryKeys: ['body_temperature'],
    isContinuousTelemetryAvailable: true,
    description: 'Holographic reference boundary showing body orientation, external posture, and superficial skin interface.',
    scientificRationale:
      'External body shell provides spatial anatomical context. Continuous superficial skin temperature monitored via dermal patch sensors.',
    clinicalProtocolNotice:
      'Rendered as a non-occluding translucent holographic boundary (alpha ~0.18). Raycasting is disabled on this layer so operators can directly select internal organs.',
    defaultColor: '#38bdf8', // sky
    targetPosition: [0, 0, 0],
    cameraPosition: [0, 0.1, 2.4],
    pickPriority: 10,
  },
};

export const ANATOMY_COMPONENT_LIST = Object.values(ANATOMY_COMPONENTS);

export const MESH_TO_COMPONENT_ID: Record<string, AnatomyComponentId> = {
  Brain_and_Spinal_Cord: 'brain_spine',
  Skull_RibCage_Spine_Skeleton: 'skeleton',
  Lungs_and_Bronchial_Tree: 'lungs',
  Heart_Myocardium: 'heart',
  Liver_Hepatic_Lobes: 'liver',
  Stomach_Gastric_Curvature: 'stomach',
  Kidneys_Bilateral_Renal: 'kidneys',
  Intestines_Small_and_Large_Colon: 'intestines',
  Urinary_Bladder_and_Ureters: 'bladder',
  Major_Arteries_Red: 'arteries',
  Major_Veins_Blue: 'veins',
  Muscular_Structures: 'muscles',
  Human_Body_Structure_Outer_Shell: 'body_shell',
};

/**
 * Maps view modes to mesh layer visibility rules.
 */
export function isMeshVisibleInMode(layer: AnatomyLayer, mode: AnatomyViewMode): boolean {
  if (mode === 'full') return true;
  if (layer === 'shell') return true; // Keep subtle silhouette in all modes for orientation
  if (mode === 'nerves') return layer === 'nerves';
  if (mode === 'bones') return layer === 'bones';
  if (mode === 'muscles') return layer === 'muscles';
  return false;
}
