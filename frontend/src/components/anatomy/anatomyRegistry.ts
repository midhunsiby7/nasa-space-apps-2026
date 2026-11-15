import { MeasurementType } from '../../types/measurement';

export type AnatomicalSystemId =
  | 'cardiovascular'
  | 'respiratory'
  | 'nervous'
  | 'digestive'
  | 'urinary'
  | 'muscular'
  | 'skeletal'
  | 'integumentary';

export type AnatomicalStructureId =
  | 'heart'
  | 'arteries'
  | 'veins'
  | 'lungs'
  | 'brain_spinal_cord'
  | 'liver'
  | 'stomach'
  | 'intestines'
  | 'kidneys'
  | 'bladder'
  | 'muscles'
  | 'skeleton'
  | 'outer_shell'
  // Backward compatibility region aliases
  | 'cardiovascular'
  | 'musculoskeletal'
  | 'ocular'
  | 'neurological'
  | 'thermoregulation'
  | 'respiratory';

export type AnatomicalRegionId = AnatomicalStructureId;

export interface AnatomicalSystemDefinition {
  id: AnatomicalSystemId;
  label: string;
  description: string;
  color: string;
  iconName: string;
}

export interface AnatomicalStructureDefinition {
  id: AnatomicalStructureId;
  meshName: string;
  nodeName: string;
  label: string;
  systemId: AnatomicalSystemId;
  systemLabel: string;
  description: string;
  physiologicalFunction: string;
  scientificRationale: string;
  telemetryKeys: MeasurementType[];
  meshIds: string[];
  color: string;
  highlightColor: string;
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  isContinuousTelemetryAvailable: boolean;
  notes?: string;
  clinicalProtocolNotice?: string;
}

export type AnatomicalRegionDefinition = AnatomicalStructureDefinition;

export const ANATOMICAL_SYSTEMS: Record<AnatomicalSystemId, AnatomicalSystemDefinition> = {
  cardiovascular: {
    id: 'cardiovascular',
    label: 'Cardiovascular System',
    description: 'Cardiac myocardium, aortic arch, systemic arterial and venous hemodynamic circulation.',
    color: '#f43f5e',
    iconName: 'Heart',
  },
  respiratory: {
    id: 'respiratory',
    label: 'Respiratory System',
    description: 'Tracheobronchial tree, bilateral pulmonary lobes, and alveolar microcirculation.',
    color: '#10b981',
    iconName: 'Wind',
  },
  nervous: {
    id: 'nervous',
    label: 'Central Nervous System',
    description: 'Cerebral hemispheres, cerebellum, brainstem, and continuous spinal cord pathway.',
    color: '#06b6d4',
    iconName: 'Sparkles',
  },
  digestive: {
    id: 'digestive',
    label: 'Digestive & Hepatic System',
    description: 'Hepatic lobes, gastric curvature, small intestine convolutions, and large colon.',
    color: '#f59e0b',
    iconName: 'Activity',
  },
  urinary: {
    id: 'urinary',
    label: 'Urinary & Renal System',
    description: 'Bilateral kidneys, renal calyces, ureters, and urinary bladder reservoir.',
    color: '#eab308',
    iconName: 'ShieldAlert',
  },
  muscular: {
    id: 'muscular',
    label: 'Muscular System',
    description: 'Major somatic musculature: deltoids, pectorals, core abdominals, biceps, and quadriceps.',
    color: '#ec4899',
    iconName: 'Zap',
  },
  skeletal: {
    id: 'skeletal',
    label: 'Skeletal Framework',
    description: 'Cranium, cervical-thoracic-lumbar vertebral column, thoracic cage, pelvic girdle, and femurs.',
    color: '#a855f7',
    iconName: 'Layers',
  },
  integumentary: {
    id: 'integumentary',
    label: 'Human Body Outer Contour',
    description: 'Translucent anatomical body boundary providing spatial orientation.',
    color: '#38bdf8',
    iconName: 'Eye',
  },
};

/**
 * Authoritative 3D Anatomical Structures & Regions Registry for COSMOLOOKUP
 * 
 * Strict Scientific & Ethical Rules:
 * 1. Highlighting a body structure is a spatial navigation mechanism, NOT an organ pathology diagnosis.
 * 2. Measurements are only mapped where a scientifically sound biomedical proxy exists.
 * 3. Unavailable continuous telemetry is clearly flagged as unavailable rather than simulated as nominal.
 * 4. This anatomical model is an illustrative visualization and is not a patient-specific medical model.
 */
export const ANATOMICAL_STRUCTURES: Record<string, AnatomicalStructureDefinition> = {
  // Individual Anatomical Structures (GLB Meshes)
  heart: {
    id: 'heart',
    meshName: 'Mesh_Heart_Myocardium',
    nodeName: 'Heart_Myocardium',
    label: 'Heart Myocardium',
    systemId: 'cardiovascular',
    systemLabel: 'Cardiovascular System',
    description: 'Four-chambered muscular organ comprising atria and ventricles responsible for systemic blood perfusion.',
    physiologicalFunction: 'Generates pulsatile stroke volume and cardiac output to circulate oxygenated blood throughout the microgravity-adapted body.',
    scientificRationale: 'Ventricular contraction rate and systemic arterial pressure track primary cardiac cadence during cephalad fluid redistribution and countermeasure workouts.',
    telemetryKeys: ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic'],
    meshIds: ['Mesh_Heart_Myocardium'],
    color: '#dc2626',
    highlightColor: '#00ffff',
    cameraTarget: [0.01, 0.34, 0.05],
    cameraPosition: [0.0, 0.35, 1.25],
    isContinuousTelemetryAvailable: true,
    notes: 'Continuous heart rate acquired telemetrically via BioHarness chest band; arterial pressure sampled via periodic ambulatory cuff.',
    clinicalProtocolNotice: 'Continuous telemetry tracks cardiovascular deconditioning, orthostatic intolerance risk, and autonomic regulation.',
  },

  arteries: {
    id: 'arteries',
    meshName: 'Mesh_Major_Arteries_Red',
    nodeName: 'Major_Arteries_Red',
    label: 'Major Arteries (Arterial Tree)',
    systemId: 'cardiovascular',
    systemLabel: 'Cardiovascular System',
    description: 'Systemic high-pressure arterial conduit network: ascending aorta, aortic arch, carotid arteries, brachial and femoral branches.',
    physiologicalFunction: 'Transports oxygenated blood under arterial pressure from the left ventricle to brain, viscera, and extremities.',
    scientificRationale: 'Arterial blood pressure monitoring tracks vascular resistance and baroreflex resetting in microgravity.',
    telemetryKeys: ['blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate'],
    meshIds: ['Mesh_Major_Arteries_Red'],
    color: '#ef4444',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.1, 0.04],
    cameraPosition: [0.0, 0.1, 2.0],
    isContinuousTelemetryAvailable: true,
    notes: 'Monitors systemic vascular resistance, mean arterial pressure, and cephalad arterial pulse pressure.',
    clinicalProtocolNotice: 'Arterial compliance and flow-mediated dilation are evaluated pre- and post-mission via vascular ultrasound.',
  },

  veins: {
    id: 'veins',
    meshName: 'Mesh_Major_Veins_Blue',
    nodeName: 'Major_Veins_Blue',
    label: 'Major Veins (Venous Tree)',
    systemId: 'cardiovascular',
    systemLabel: 'Cardiovascular System',
    description: 'Low-pressure venous return system: superior and inferior vena cava, internal jugular veins, subclavian, and femoral venous pathways.',
    physiologicalFunction: 'Directs deoxygenated venous return back to the right atrium; accommodates cephalad venous blood pooling in weightlessness.',
    scientificRationale: 'Venous engorgement in head and neck occurs within hours of entering microgravity, contributing to cephalad fluid shift, facial fullness, and elevated jugular venous pressure.',
    telemetryKeys: ['heart_rate'],
    meshIds: ['Mesh_Major_Veins_Blue'],
    color: '#2563eb',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.1, 0.04],
    cameraPosition: [0.0, 0.1, 2.0],
    isContinuousTelemetryAvailable: true,
    notes: 'Jugular venous flow stasis and thrombosis risk are monitored in flight via scheduled ultrasound protocols.',
    clinicalProtocolNotice: 'Absence of hydrostatic pressure gradient in microgravity shifts ~1.5–2.0 L of venous fluid toward the head and upper body.',
  },

  lungs: {
    id: 'lungs',
    meshName: 'Mesh_Lungs_and_Bronchial_Tree',
    nodeName: 'Lungs_and_Bronchial_Tree',
    label: 'Lungs & Bronchial Tree',
    systemId: 'respiratory',
    systemLabel: 'Respiratory System',
    description: 'Bilateral lung lobes with arborized tracheobronchial network providing alveolar gas diffusion interface.',
    physiologicalFunction: 'Facilitates pulmonary alveolar oxygen uptake and carbon dioxide elimination to maintain arterial blood gas homeostasis.',
    scientificRationale: 'Respiratory impedance band captures thoracic cadence; capillary pulse oximetry (SpO2) monitors systemic oxygen transport and cabin atmosphere scrubbing efficiency.',
    telemetryKeys: ['respiratory_rate', 'spo2'],
    meshIds: ['Mesh_Lungs_and_Bronchial_Tree'],
    color: '#f87171',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.45, 0.02],
    cameraPosition: [0.0, 0.45, 1.35],
    isContinuousTelemetryAvailable: true,
    notes: 'Respiratory rate continuously derived from thoracic plethysmography; SpO2 tracked via wearable pulse oximeter.',
    clinicalProtocolNotice: 'Pulmonary ventilation-perfusion uniformity improves moderately in microgravity due to elimination of gravitational apex-to-base pleural gradients.',
  },

  brain_spinal_cord: {
    id: 'brain_spinal_cord',
    meshName: 'Mesh_Brain_and_Spinal_Cord',
    nodeName: 'Brain_and_Spinal_Cord',
    label: 'Brain & Spinal Cord (CNS)',
    systemId: 'nervous',
    systemLabel: 'Central Nervous System',
    description: 'Cerebral cortex, cerebellum, brainstem, and descending spinal cord within the axial vertebral canal.',
    physiologicalFunction: 'Coordinates cognitive processing, motor planning, autonomic regulation, neurovestibular motion integration, and sensory perception.',
    scientificRationale: 'Evaluates neurovestibular space motion sickness (SMS), cephalad intracranial fluid pressure, and neuro-ocular SANS signaling. Continuous streaming parenchymal sensors are not deployed; cognitive tracking uses periodic computerized batteries.',
    telemetryKeys: [],
    meshIds: ['Mesh_Brain_and_Spinal_Cord'],
    color: '#fbcfe8',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.65, 0.02],
    cameraPosition: [0.0, 0.65, 1.25],
    isContinuousTelemetryAvailable: false,
    notes: 'Scientific Guardrail: Sleep architecture is tracked via non-anatomical telemetry channels. SpO2 is peripheral oxygen saturation and mapped under Pulmonary/Respiratory gas exchange. Peripheral SpO2 reflects systemic capillary saturation, NOT intracranial parenchymal tissue oxygenation.',
    clinicalProtocolNotice: 'Space motion sickness typically peaks during flight days 1-3, resolving as central neurovestibular reweighting occurs.',
  },

  liver: {
    id: 'liver',
    meshName: 'Mesh_Liver_Hepatic_Lobes',
    nodeName: 'Liver_Hepatic_Lobes',
    label: 'Liver (Hepatic Lobes)',
    systemId: 'digestive',
    systemLabel: 'Digestive & Hepatic System',
    description: 'Major metabolic visceral organ located in the right hypochondrium beneath the diaphragm.',
    physiologicalFunction: 'Synthesizes plasma proteins, clears toxins, manages lipid and glucose metabolism, and produces bile for digestion.',
    scientificRationale: 'Deep visceral metabolic activity contributes to core thermal homeostasis. Monitored via ingestible thermal telemetry pills and periodic flight biochemical blood panels.',
    telemetryKeys: ['core_temperature', 'body_temperature'],
    meshIds: ['Mesh_Liver_Hepatic_Lobes'],
    color: '#991b1b',
    highlightColor: '#00ffff',
    cameraTarget: [-0.03, 0.25, 0.04],
    cameraPosition: [-0.03, 0.25, 1.25],
    isContinuousTelemetryAvailable: true,
    notes: 'Core temperature measured via ingestible RF thermal sensor pill transit through the GI tract.',
    clinicalProtocolNotice: 'Hepatic cytochrome P450 enzyme kinetics and drug pharmacokinetics may be altered by microgravity-induced visceral perfusion shifts.',
  },

  stomach: {
    id: 'stomach',
    meshName: 'Mesh_Stomach_Gastric_Curvature',
    nodeName: 'Stomach_Gastric_Curvature',
    label: 'Stomach & Gastric Curvature',
    systemId: 'digestive',
    systemLabel: 'Digestive & Hepatic System',
    description: 'J-shaped muscular hollow organ featuring greater and lesser curvatures positioned in the upper abdomen.',
    physiologicalFunction: 'Performs mechanical churning and enzymatic gastric acid breakdown of ingested food boluses.',
    scientificRationale: 'Gastric motility is susceptible to early-mission space motion sickness and autonomic cephalad shift. Thermal telemetry pill passes through stomach during initial recording hours.',
    telemetryKeys: ['core_temperature'],
    meshIds: ['Mesh_Stomach_Gastric_Curvature'],
    color: '#fb7185',
    highlightColor: '#00ffff',
    cameraTarget: [0.04, 0.24, 0.04],
    cameraPosition: [0.04, 0.24, 1.25],
    isContinuousTelemetryAvailable: true,
    notes: 'Ingestible core temperature capsule records gastric temperature during initial transit phase.',
    clinicalProtocolNotice: 'Delayed gastric emptying has been observed in some crewmembers during acute space motion adaptation.',
  },

  intestines: {
    id: 'intestines',
    meshName: 'Mesh_Intestines_Small_and_Large_Colon',
    nodeName: 'Intestines_Small_and_Large_Colon',
    label: 'Intestines & Colon',
    systemId: 'digestive',
    systemLabel: 'Digestive & Hepatic System',
    description: 'Small intestine convolutions (duodenum, jejunum, ileum) framed by the ascending, transverse, descending colon, and rectum.',
    physiologicalFunction: 'Nutrient absorption, electrolyte/fluid resorption, enteric immune defense, and gut microbiome host defense.',
    scientificRationale: 'Core body temperature continuously monitored as the wireless telemetric pill traverses the intestinal lumen over a 24-to-48 hour window.',
    telemetryKeys: ['core_temperature'],
    meshIds: ['Mesh_Intestines_Small_and_Large_Colon'],
    color: '#d97706',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.03, 0.02],
    cameraPosition: [0.0, 0.03, 1.35],
    isContinuousTelemetryAvailable: true,
    notes: 'Deep visceral core thermal readings provided via radio-telemetry ingestible sensor pill.',
    clinicalProtocolNotice: 'Crew microbiome composition shifts over long-duration spaceflights; monitored via scheduled fecal sample collections.',
  },

  kidneys: {
    id: 'kidneys',
    meshName: 'Mesh_Kidneys_Bilateral_Renal',
    nodeName: 'Kidneys_Bilateral_Renal',
    label: 'Kidneys (Bilateral Renal)',
    systemId: 'urinary',
    systemLabel: 'Urinary & Renal System',
    description: 'Retroperitoneal bean-shaped organs positioned on either side of the lumbar vertebral column.',
    physiologicalFunction: 'Filters blood plasma, regulates extracellular fluid volume, electrolyte osmolarity, and excretes nitrogenous metabolites.',
    scientificRationale: 'Microgravity bone demineralization elevates urinary calcium excretion, increasing nephrolithiasis (kidney stone) risk. Continuous streaming renal sensors do not exist; monitored via daily urine volume logs and hydration protocols.',
    telemetryKeys: [],
    meshIds: ['Mesh_Kidneys_Bilateral_Renal'],
    color: '#881337',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.15, 0.01],
    cameraPosition: [0.0, 0.15, 1.25],
    isContinuousTelemetryAvailable: false,
    notes: 'No continuous streaming sensor deployed. Monitored via operational urine volume monitoring (UVM), specific gravity, and fluid intake logging.',
    clinicalProtocolNotice: 'Hydration countermeasures (minimum 2.0-2.5 L/day fluid intake) and dietary potassium citrate reduce stone precipitation risk.',
  },

  bladder: {
    id: 'bladder',
    meshName: 'Mesh_Urinary_Bladder_and_Ureters',
    nodeName: 'Urinary_Bladder_and_Ureters',
    label: 'Urinary Bladder & Ureters',
    systemId: 'urinary',
    systemLabel: 'Urinary & Renal System',
    description: 'Pelvic hollow muscular distensible reservoir and bilateral tubular ureters connecting kidneys to bladder.',
    physiologicalFunction: 'Stores urine produced by the renal filtration system until scheduled voluntary voiding.',
    scientificRationale: 'Bladder volume sensation is altered during early microgravity adaptation due to lack of gravitational fluid hydrostatic pooling at the bladder base.',
    telemetryKeys: [],
    meshIds: ['Mesh_Urinary_Bladder_and_Ureters'],
    color: '#fbbf24',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, -0.05, 0.04],
    cameraPosition: [0.0, -0.05, 1.25],
    isContinuousTelemetryAvailable: false,
    notes: 'Operational voiding frequency and volume recorded into the Environmental Control and Life Support System (ECLSS) urine processing assembly.',
    clinicalProtocolNotice: 'Flight rules emphasize timed voiding protocols during extravehicular activities (EVA) and launch/entry operations.',
  },

  skeleton: {
    id: 'skeleton',
    meshName: 'Mesh_Skull_RibCage_Spine_Skeleton',
    nodeName: 'Skull_RibCage_Spine_Skeleton',
    label: 'Skeleton (Spine, Ribcage, Pelvis)',
    systemId: 'skeletal',
    systemLabel: 'Skeletal Framework',
    description: 'Cranium, cervical-thoracic-lumbar spine, ribcage, clavicles, pelvic girdle, and long bones of the extremities.',
    physiologicalFunction: 'Provides rigid axial framework, protects internal organs, enables countermeasure locomotion, and maintains calcium reservoir.',
    scientificRationale: 'Absence of weight-bearing mechanical loading causes 1.0–1.5% monthly bone mineral loss in lumbar spine and calcaneus. Continuous streaming telemetry does not exist; evaluated via ARED resistive exercise load logs and pre-/post-mission DXA scans.',
    telemetryKeys: [],
    meshIds: ['Mesh_Skull_RibCage_Spine_Skeleton'],
    color: '#f1f5f9',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.0, 0.0],
    cameraPosition: [0.0, 0.05, 2.5],
    isContinuousTelemetryAvailable: false,
    notes: 'No continuous bone mineral telemetry stream available. Tracked through daily Advanced Resistive Exercise Device (ARED) force logs.',
    clinicalProtocolNotice: 'NASA flight rules mandate daily heavy resistive exercise loading (~600-800 kg cumulative force) plus bisphosphonate or nutritional countermeasures.',
  },

  muscles: {
    id: 'muscles',
    meshName: 'Mesh_Muscular_Structures',
    nodeName: 'Muscular_Structures',
    label: 'Muscular System (Major Groups)',
    systemId: 'muscular',
    systemLabel: 'Muscular System',
    description: 'Major somatic postural and locomotor muscle groups: pectorals, deltoids, abdominals, latissimus, biceps, quadriceps, and gastrocnemius.',
    physiologicalFunction: 'Generates joint torque, maintains posture against spacecraft structures, assists venous return, and produces metabolic thermogenesis.',
    scientificRationale: 'Microgravity induces selective atrophy of slow-twitch postural muscle fibers. Monitored in flight via daily 2.5-hour countermeasure exercise logs (ARED, T2 treadmill, CEVIS cycle ergometer) and neuromuscular ultrasound.',
    telemetryKeys: [],
    meshIds: ['Mesh_Muscular_Structures'],
    color: '#b94747',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.0, 0.0],
    cameraPosition: [0.0, 0.05, 2.4],
    isContinuousTelemetryAvailable: false,
    notes: 'No continuous streaming electromyography deployed in standard mission operations. Monitored through cycle ergometer wattage and ARED resistive countermeasure performance.',
    clinicalProtocolNotice: 'High-intensity interval countermeasure sessions maintain skeletal muscle protein synthesis and slow myofibrillar volume loss.',
  },

  outer_shell: {
    id: 'outer_shell',
    meshName: 'Mesh_Human_Body_Structure_Outer_Shell',
    nodeName: 'Human_Body_Structure_Outer_Shell',
    label: 'Human Body Anatomical Contour',
    systemId: 'integumentary',
    systemLabel: 'Human Body Outer Contour',
    description: 'Translucent whole-body anatomical surface silhouette providing anatomical scale and spatial reference.',
    physiologicalFunction: 'Anatomical reference surface and dermal barrier boundary for sensor placement.',
    scientificRationale: 'Whole-body spatial context for locating telemetry electrodes, BioHarness chest bands, blood pressure cuffs, and wearable sensors.',
    telemetryKeys: [],
    meshIds: ['Mesh_Human_Body_Structure_Outer_Shell'],
    color: '#38bdf8',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.0, 0.0],
    cameraPosition: [0.0, 0.05, 2.6],
    isContinuousTelemetryAvailable: false,
    notes: 'Translucent display layer for anatomical spatial orientation; opacity can be adjusted or toggled off.',
    clinicalProtocolNotice: 'Illustrative whole-body envelope — not a patient-specific laser body scan or volumetric anthropometry model.',
  },

  // Authoritative Regional Definitions for Backward Compatibility & Test Suite Verification
  cardiovascular: {
    id: 'cardiovascular',
    meshName: 'Mesh_Heart_Myocardium',
    nodeName: 'Heart_Myocardium',
    label: 'Cardiovascular System',
    systemId: 'cardiovascular',
    systemLabel: 'Cardiovascular System',
    description: 'Mediastinal cardiac pump, aortic root, and systemic arterial hemodynamic circulation.',
    physiologicalFunction: 'Ventricular stroke volume and arterial pressure propulsion.',
    scientificRationale: 'Ventricular contraction rate and systemic arterial pressure track primary cardiac operational cadence during microgravity cephalad fluid shifts and exercise countermeasures.',
    telemetryKeys: ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic'],
    meshIds: ['Mesh_Heart_Myocardium', 'Mesh_Major_Arteries_Red', 'Mesh_Major_Veins_Blue'],
    color: '#f43f5e',
    highlightColor: '#00ffff',
    cameraTarget: [0.01, 0.34, 0.05],
    cameraPosition: [0.0, 0.35, 1.25],
    isContinuousTelemetryAvailable: true,
    notes: 'Acquired via thoracic BioHarness band and ambulatory blood pressure cuffs.',
    clinicalProtocolNotice: 'Continuous heart rate monitoring tracks cardiovascular deconditioning and autonomic regulation.',
  },

  musculoskeletal: {
    id: 'musculoskeletal',
    meshName: 'Mesh_Skull_RibCage_Spine_Skeleton',
    nodeName: 'Skull_RibCage_Spine_Skeleton',
    label: 'Musculoskeletal Framework',
    systemId: 'skeletal',
    systemLabel: 'Skeletal Framework',
    description: 'Vertebral column (cervical to lumbar), thoracic ribcage, pelvic girdle, and extremities.',
    physiologicalFunction: 'Structural axial load distribution and locomotion.',
    scientificRationale: 'Continuous physiological telemetry sensors are NOT deployed in-flight for bone mineral density, vertebral elongation, or muscle atrophy. Ground DXA scans and ARED exercise countermeasure resistive logs provide periodic empirical evaluation.',
    telemetryKeys: [],
    meshIds: ['Mesh_Skull_RibCage_Spine_Skeleton', 'Mesh_Muscular_Structures'],
    color: '#a855f7',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.0, 0.0],
    cameraPosition: [0.0, 0.05, 2.5],
    isContinuousTelemetryAvailable: false,
    notes: 'No continuous telemetry stream available. Monitored via periodic exercise countermeasure logs and post-flight imaging.',
    clinicalProtocolNotice: 'Absence of continuous streaming telemetry does not imply nominal bone or muscle status. NASA flight rules allocate 2.5 hours total daily exercise time, comprising ~60–90 min dedicated ARED resistive loading plus ~30–45 min aerobic conditioning (T2 treadmill or CEVIS bike) with setup and hygiene.',
  },

  ocular: {
    id: 'ocular',
    meshName: 'Mesh_Brain_and_Spinal_Cord',
    nodeName: 'Brain_and_Spinal_Cord',
    label: 'Ocular & Visual System (SANS)',
    systemId: 'nervous',
    systemLabel: 'Central Nervous System',
    description: 'Bilateral orbits, optic nerve sheath, globe morphology, and retinal microvasculature.',
    physiologicalFunction: 'Visual sensory reception and phototransduction.',
    scientificRationale: 'Spaceflight-Associated Neuro-ocular Syndrome (SANS) manifests as optic disc edema, globe flattening, and choroidal folds driven by cephalad venous fluid redistribution. No continuous streaming sensor monitors optic nerve morphology.',
    telemetryKeys: [],
    meshIds: ['Mesh_Brain_and_Spinal_Cord'],
    color: '#38bdf8',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.65, 0.05],
    cameraPosition: [0.0, 0.65, 1.2],
    isContinuousTelemetryAvailable: false,
    notes: 'Evaluated via scheduled in-flight optical coherence tomography (OCT) and funduscopy. No continuous telemetry sensor deployed.',
    clinicalProtocolNotice: 'No continuous streaming telemetry is assigned to ocular anatomy. In-flight SANS surveillance follows scheduled periodic diagnostic imaging protocols (e.g., illustrative 30-to-60 day cadence per Spaceflight Standard Measures; exact schedule determined by mission flight rules).',
  },

  neurological: {
    id: 'neurological',
    meshName: 'Mesh_Brain_and_Spinal_Cord',
    nodeName: 'Brain_and_Spinal_Cord',
    label: 'Neurological & Sensorimotor System',
    systemId: 'nervous',
    systemLabel: 'Central Nervous System',
    description: 'Neurocranium, cerebral compartments, vestibular inner ear apparatus, and sensorimotor balance.',
    physiologicalFunction: 'Higher cortical processing and sensorimotor coordination.',
    scientificRationale: 'Evaluates neurovestibular space motion adaptation and sensorimotor balance. Sleep duration and sleep staging are non-anatomical operational metrics tracked in the Non-Anatomical Habitat Drawer, NOT mapped to cranial brain tissue. Peripheral pulse oximetry reflects systemic capillary saturation, NOT intracranial parenchymal tissue oxygenation.',
    telemetryKeys: [],
    meshIds: ['Mesh_Brain_and_Spinal_Cord'],
    color: '#06b6d4',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.65, 0.02],
    cameraPosition: [0.0, 0.65, 1.25],
    isContinuousTelemetryAvailable: false,
    notes: 'Scientific Guardrail: Sleep architecture is tracked via non-anatomical telemetry channels. SpO2 is peripheral oxygen saturation and mapped under Pulmonary/Respiratory gas exchange. Peripheral SpO2 reflects systemic capillary saturation, NOT intracranial parenchymal tissue oxygenation.',
    clinicalProtocolNotice: 'Sensorimotor coordination and motion sickness are tracked through scheduled operational protocols and subjective crew reports.',
  },

  thermoregulation: {
    id: 'thermoregulation',
    meshName: 'Mesh_Liver_Hepatic_Lobes',
    nodeName: 'Liver_Hepatic_Lobes',
    label: 'Core Thermoregulation',
    systemId: 'digestive',
    systemLabel: 'Digestive & Hepatic System',
    description: 'Internal visceral core thermal homeostasis and circadian temperature rhythm.',
    physiologicalFunction: 'Visceral core metabolic heat maintenance and thermal homeostasis.',
    scientificRationale: 'Monitors core body temperature and circadian rhythm shifts. Elevation in resting core temperature (spaceflight thermoregulation impairment) is tracked during active mission days.',
    telemetryKeys: ['core_temperature', 'body_temperature'],
    meshIds: ['Mesh_Liver_Hepatic_Lobes', 'Mesh_Stomach_Gastric_Curvature'],
    color: '#f59e0b',
    highlightColor: '#00ffff',
    cameraTarget: [-0.03, 0.25, 0.04],
    cameraPosition: [-0.03, 0.25, 1.25],
    isContinuousTelemetryAvailable: true,
    notes: 'Acquired telemetrically from an ingestible radio-frequency thermal sensor capsule in the GI tract or dermal sensors.',
    clinicalProtocolNotice: 'Post-exercise recovery kinetics reflect thermoregulatory countermeasure efficacy.',
  },

  respiratory: {
    id: 'respiratory',
    meshName: 'Mesh_Lungs_and_Bronchial_Tree',
    nodeName: 'Lungs_and_Bronchial_Tree',
    label: 'Pulmonary / Respiratory System',
    systemId: 'respiratory',
    systemLabel: 'Respiratory System',
    description: 'Bilateral lung lobes, bronchial arborization, and alveolar gas exchange.',
    physiologicalFunction: 'Thoracic gas ventilation and pulmonary gas diffusion.',
    scientificRationale: 'Respiratory rate measures thoracic expansion cadence. Arterial oxygen saturation (SpO2) measures peripheral oxygen saturation by pulse oximetry.',
    telemetryKeys: ['respiratory_rate', 'spo2'],
    meshIds: ['Mesh_Lungs_and_Bronchial_Tree'],
    color: '#10b981',
    highlightColor: '#00ffff',
    cameraTarget: [0.0, 0.45, 0.02],
    cameraPosition: [0.0, 0.45, 1.35],
    isContinuousTelemetryAvailable: true,
    notes: 'Respiratory impedance sensors coupled with peripheral pulse oximetry (SpO2). SpO2 measures peripheral oxygen saturation by pulse oximetry.',
    clinicalProtocolNotice: 'Monitors microgravity pulmonary ventilation-perfusion matching and atmospheric scrub efficiency.',
  },
};

export const ANATOMICAL_REGIONS: Record<string, AnatomicalStructureDefinition> = ANATOMICAL_STRUCTURES;

export const ANATOMICAL_STRUCTURE_LIST = [
  ANATOMICAL_STRUCTURES.heart,
  ANATOMICAL_STRUCTURES.arteries,
  ANATOMICAL_STRUCTURES.veins,
  ANATOMICAL_STRUCTURES.lungs,
  ANATOMICAL_STRUCTURES.brain_spinal_cord,
  ANATOMICAL_STRUCTURES.liver,
  ANATOMICAL_STRUCTURES.stomach,
  ANATOMICAL_STRUCTURES.intestines,
  ANATOMICAL_STRUCTURES.kidneys,
  ANATOMICAL_STRUCTURES.bladder,
  ANATOMICAL_STRUCTURES.skeleton,
  ANATOMICAL_STRUCTURES.muscles,
  ANATOMICAL_STRUCTURES.outer_shell,
];

export const ANATOMICAL_REGION_LIST = ANATOMICAL_STRUCTURE_LIST;

export const ANATOMICAL_SYSTEM_LIST = Object.values(ANATOMICAL_SYSTEMS);
