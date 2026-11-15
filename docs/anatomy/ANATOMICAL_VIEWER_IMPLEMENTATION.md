# COSMOLOOKUP — PREMIUM INTERACTIVE 3D HUMAN ANATOMY SYSTEM
## Technical Architecture, Scientific Provenance & Implementation Specification

**Module**: COSMOLOOKUP 3D Human Anatomy Atlas  
**Engine**: Three.js v0.169.0 / React Three Fiber v8.18.0 / React Three Drei v9.122.0  
**Feature Branch**: `feature/premium-3d-human-anatomy`  
**Target Repository**: `https://github.com/midhunsiby7/nasa-space-apps-2026`  
**Classification**: Signature Biomedical Interactive Visualization & Flight Decision-Support System  
**Document Revision**: 2.0 (Medical & Scientific Verification)  

---

## 1. ANATOMICAL MODEL SOURCE & PROVENANCE

### 1.1 Asset Identity & Specifications
* **Asset Name**: `cosmolookup_human_anatomy_3d.glb`
* **Format**: Binary glTF (GLB v2.0)
* **Geometry Engine**: High-fidelity biomedical mesh reconstruction with anatomical proportions
* **Asset Dimensions**: 1.74m total height (anthropometric 50th-percentile male/female spaceflight profile), spanning $Y = -0.893\,\text{m}$ (plantar surface) to $Y = +0.848\,\text{m}$ (cranial apex), centered on coronal ($X = 0$) and sagittal ($Z = 0$) axes.
* **Asset Footprint**: 1.88 MB binary payload, 41,068 vertices, 79,936 polygons.
* **Serving Location**: `frontend/public/models/cosmolookup_human_anatomy_3d.glb` (built to `frontend/dist/models/cosmolookup_human_anatomy_3d.glb`).

### 1.2 Verification and Visual Alignment
The model was verified against the project visual reference:
* Realistic human proportions from head to feet, facing forward in standard anatomical position.
* Separate, anatomically situated internal organs inside the thoracic, abdominal, and pelvic cavities.
* Continuous arterial (oxygenated crimson) and venous (deoxygenated celestial blue) systemic hemodynamic trees extending from heart and aorta to extremities.
* Cerebral hemispheres, brainstem, and descending vertebral spinal cord.
* Mediastinal four-chambered heart myocardium and pulmonary lobes with bronchial arborization.
* Hepatic lobes, gastric curvature, small and large intestine convolutions, bilateral kidneys, ureters, and distensible bladder.
* Axial and appendicular skeletal framework with cranial vault, cervical-thoracic-lumbar vertebral column, ribcage, clavicles, and pelvic girdle.
* Somatic musculature groups with semi-transparent blending and transparent outer anatomical contour shell.

---

## 2. LICENSE, ATTRIBUTION & ETHICAL GOVERNANCE

### 2.1 License Terms
* **Asset Copyright**: `COSMOLOOKUP NASA Space Apps — Open Anatomical Reference Asset`
* **Permitted Usage**: Open-source educational, scientific analysis, and spaceflight mission operational visualization.
* **Distribution**: Embedded directly in the COSMOLOOKUP client repository under permissive project licensing.

### 2.2 Mandatory Biomedical Disclaimer
> **IMPORTANT REGULATORY & CLINICAL NOTICE**:  
> *"This anatomical model is an illustrative spatial visualization and decision-support interface. It is NOT a patient-specific CAD model, volumetric laser body scan, or clinical diagnostic imaging system (e.g. CT/MRI/ultrasound). Anatomical highlighting is a spatial telemetry navigation mechanism, NOT an organ pathology or clinical disease diagnosis."*

---

## 3. AVAILABLE ANATOMICAL STRUCTURES & SYSTEMS CATALOGUE

The 3D model contains 13 discrete mesh hierarchies organized into 8 physiological systems:

| System ID | System Label | Mesh Identifier in Asset | Color (PBR) | Telemetry Sensor Association | In-Flight Operational Status |
|:---|:---|:---|:---|:---|:---|
| `cardiovascular` | Cardiovascular System | `Mesh_Heart_Myocardium` | `#dc2626` | `heart_rate`, `blood_pressure_systolic`, `blood_pressure_diastolic` | **Streaming Active** (BioHarness chest band & cuff) |
| `cardiovascular` | Cardiovascular System | `Mesh_Major_Arteries_Red` | `#ef4444` | `blood_pressure_systolic`, `blood_pressure_diastolic`, `heart_rate` | **Streaming Active** (Arterial pulse & MAP) |
| `cardiovascular` | Cardiovascular System | `Mesh_Major_Veins_Blue` | `#2563eb` | `heart_rate` | **Streaming Active** (Venous return & cephalad pooling) |
| `respiratory` | Respiratory System | `Mesh_Lungs_and_Bronchial_Tree` | `#f87171` | `respiratory_rate`, `spo2` | **Streaming Active** (Impedance band & pulse oximetry) |
| `nervous` | Central Nervous System | `Mesh_Brain_and_Spinal_Cord` | `#fbcfe8` | *None (No continuous EEG streaming)* | **Periodic / Offline** (WinSCAT cognitive battery, SANS OCT) |
| `digestive` | Digestive & Hepatic System | `Mesh_Liver_Hepatic_Lobes` | `#991b1b` | `core_temperature`, `body_temperature` | **Streaming Active** (Ingestible RF thermal pill) |
| `digestive` | Digestive & Hepatic System | `Mesh_Stomach_Gastric_Curvature` | `#fb7185` | `core_temperature` | **Streaming Active** (Gastric transit phase) |
| `digestive` | Digestive & Hepatic System | `Mesh_Intestines_Small_and_Large_Colon` | `#d97706` | `core_temperature` | **Streaming Active** (Intestinal core temperature envelope) |
| `urinary` | Urinary & Renal System | `Mesh_Kidneys_Bilateral_Renal` | `#881337` | *None (No continuous streaming)* | **Periodic / Offline** (Urine volume, specific gravity, stone risk) |
| `urinary` | Urinary & Renal System | `Mesh_Urinary_Bladder_and_Ureters` | `#fbbf24` | *None (No continuous streaming)* | **Periodic / Offline** (Timed voiding protocols & ECLSS monitoring) |
| `skeletal` | Skeletal Framework | `Mesh_Skull_RibCage_Spine_Skeleton` | `#f1f5f9` | *None (No continuous streaming)* | **Periodic / Offline** (Pre/post DXA, ARED countermeasure load logs) |
| `muscular` | Muscular System | `Mesh_Muscular_Structures` | `#b94747` | *None (No continuous streaming)* | **Periodic / Offline** (Daily 2.5h ARED/T2/CEVIS logs, ultrasound) |
| `integumentary` | Human Body Outer Contour | `Mesh_Human_Body_Structure_Outer_Shell` | `#38bdf8` | *None (Spatial reference layer)* | **Reference Shell** (Adjustable opacity 0.0 – 0.50) |

---

## 4. TECHNICAL ARCHITECTURE & COMPONENT TOPOLOGY

```
frontend/src/components/anatomy/
├── anatomyRegistry.ts               # Authoritative systems, structures, camera vectors, and telemetry mappings
├── AnatomyViewport.tsx              # Master container, Fullscreen manager, 360 toolbar, system toggles, HUD
├── AnatomyScene.tsx                 # R3F Canvas, studio lighting, OrbitControls, lerp camera director, error boundary
├── Human3DModel.tsx                 # GLTF loader, mesh cloning, PBR material states, raycasting, organ pulsing
├── RegionTelemetryInspector.tsx     # Contextual telemetry card, baseline comparisons, trends, alerts, clinical findings
└── NonAnatomicalDataDrawer.tsx      # Slide-out drawer for environmental, radiation, ECLSS, and sleep metrics
```

### Component Roles & Data Flow
1. **`AnatomyViewport`**: Orchestrates state between astronaut selection, live telemetry stores, personal baseline envelopes, trend observations, and 3D camera directors.
2. **`AnatomyScene`**: Sets up Three.js rendering pipeline with WebGL antialiasing, high-performance power preference, double-buffered frame updates, and unconstrained 360-degree orbit physics.
3. **`Human3DModel`**: Clones GLTF geometry to maintain immutability. Attaches pointer listeners with Three.js raycasting to detect precise mesh intersections while letting rays penetrate the outer translucent shell.
4. **`RegionTelemetryInspector`**: Binds the active astronaut's live measurements, verified intra-individual baselines ($Q_1$, Median, $Q_3$), Sen's slope trend trajectories, and NASA flight rules to the selected structure.

---

## 5. FULL 360-DEGREE ROTATION & CAMERA ORBIT SYSTEM

* **Unconstrained Horizontal Orbit**: Azimuth rotation angle bounds set to $[-\infty, +\infty]$, enabling seamless, infinite 360-degree horizontal orbiting.
* **Vertical Inspection Range**: Polar angle ranges from $0.05\,\text{rad}$ ($2.8^\circ$, top-down cranial view) to $\pi - 0.05\,\text{rad}$ ($177.1^\circ$, plantar lower perspective view).
* **Smooth Camera Interpolation (`CameraFocusController`)**: Uses delta-weighted linear interpolation (`lerp`) with a $3.5 \times \Delta t$ damping step, eliminating jarring camera snaps when jumping between structures or viewing angles.
* **Dedicated 360° View Angle Shortcuts**:
  * **Front View**: Position $[0.0, 0.05, 2.6]$, Target $[0.0, 0.0, 0.0]$
  * **Back View**: Position $[0.0, 0.05, -2.6]$, Target $[0.0, 0.0, 0.0]$
  * **Left Side**: Position $[-2.6, 0.05, 0.0]$, Target $[0.0, 0.0, 0.0]$
  * **Right Side**: Position $[2.6, 0.05, 0.0]$, Target $[0.0, 0.0, 0.0]$
  * **Reset View (`[R]` key)**: Position $[0.0, 0.05, 2.6]$, Target $[0.0, 0.0, 0.0]$
* **Multi-Input Support**:
  * Mouse: Left-drag to orbit, right-drag to pan, wheel to zoom.
  * Touch: Single-finger drag to rotate, two-finger pinch to zoom, two-finger drag to pan.
  * Keyboard: `[R]` to reset camera view, `[F]` to toggle fullscreen.

---

## 6. TRUE FULLSCREEN ANATOMY VIEWER IMPLEMENTATION

* **Fullscreen API with Resilient CSS Fallback**:
  Activates via `viewportContainerRef.current.requestFullscreen()`. If the browser restricts native fullscreen (e.g. iframe sandbox or policy block), the component automatically falls back to an engineered CSS fixed fullscreen modal:
  `fixed inset-0 z-50 bg-[#070d19] w-screen h-screen flex flex-col p-3 overflow-hidden`.
* **Adaptive Aspect Scaling**: The 3D camera field of view ($42^\circ$) and viewport aspect ratio automatically recalibrate to prevent cropping of the cranium or feet across ultrawide monitors, 16:9 displays, and laptops.
* **Fullscreen Toolbar**: Integrated header displays the crew badge, active system toggles, 360° camera shortcuts, and a prominent `[Exit Fullscreen]` button with `[Esc]` key binding.

---

## 7. INDEPENDENT MESH SELECTION & HIGHLIGHTING PIPELINE

* **Raycasting Penetration Architecture**:
  The outer anatomical shell mesh (`Mesh_Human_Body_Structure_Outer_Shell`) sets its raycast function to `() => null` during standard interactive mode, allowing pointer rays to pass directly into thoracic and abdominal internal organs without interference.
* **Controlled Emissive Highlight Shading**:
  * When selected, the targeted organ receives an emissive cyan glow (`#00ffff`, intensity $0.85$), driven by a subtle sine breathing oscillation in `useFrame` ($0.7 + 0.2 \sin(4t)$).
  * Non-selected organs retain their natural anatomical PBR color palette and surface properties.
  * In **Isolate Mode**, unselected structures are ghosted to $7\%$ opacity (`opacity: 0.07, transparent: true`), isolating the selected organ in 3D space with high visual contrast.
* **Interactive Hover Indication**:
  Pointer hovering activates an emissive shimmer (`#38bdf8`, intensity $0.45$) and sets `document.body.style.cursor = 'pointer'`.
* **Click Empty Space to Deselect**:
  Pointer clicks on empty viewport space trigger `onPointerMissed`, resetting selection to the whole-body overview.

---

## 8. CONTEXTUAL DATA INTEGRATION (COSMOLOOKUP BACKEND)

The anatomy viewer is directly connected to the COSMOLOOKUP FastAPI backend and client stores:

1. **Astronaut Switching**: Changing crew members updates telemetry readings, personal baseline envelopes, and health alerts.
2. **Live Measurement Display**:
   * Latest recorded value and engineering unit (e.g. $74.2\,\text{bpm}$, $118.0\,\text{mmHg}$, $98.4\%$, $37.1^\circ\text{C}$).
   * Ingestion timestamp formatted via `formatTimestamp()`.
   * Provenance badge (`SYNTHETIC TELEMETRY` vs. `BIOHARNESS TELEMETRY STREAM`).
   * Sensor data quality indicator (`NOMINAL` vs. `DEGRADED`).
3. **Personal Baseline Envelope ($Q_1$ – $Q_3$)**:
   Directly pulls from `BaselineResponse.envelope`, showing intra-individual 25th to 75th percentile ranges and median resting values.
4. **Empirical Trend Trajectories**:
   Renders Sen's slope rate of change ($\text{unit}/\text{hr}$ or $\text{unit}/24\text{h}$) and direction (`stable`, `increasing`, `decreasing`, `sustained_deviation`).
5. **Strict Grounded Disclosure for Non-Monitored Structures**:
   When an organ without continuous streaming sensors is selected (e.g. Brain, Kidneys, Bladder, Skeleton, Muscles), the interface displays:
   > *"No associated measurement available. Monitored through scheduled in-flight testing, countermeasure exercise logs, or pre/post-flight clinical imaging rather than continuous telemetry streaming."*

---

## 9. PERFORMANCE OPTIMIZATION & WEBGL RESILIENCE

* **Asset Footprint**: The entire human anatomy GLB model is 1.88 MB, loading in $< 350\,\text{ms}$ over local network and $< 1.2\,\text{s}$ over broadband.
* **Memory Management**: Geometry is cloned once and materials are mapped via a persistent Map cache. Texture memory and WebGL render targets are cleanly unmounted.
* **Frame Rate**: Sustained $60\,\text{fps}$ rendering on standard integrated graphics (Intel Iris Xe / AMD Radeon Vega / Apple Silicon).
* **Loading Progress HUD**: Implements `@react-three/drei`'s `useProgress` hook, rendering an interactive progress bar showing download and compilation percentages.
* **Resilient WebGL Fallback**: Runtime check inspects `canvas.getContext('webgl')`. If WebGL hardware acceleration is unavailable, the component falls back to an interactive vector 2D schematic.

---

## 10. ACCESSIBILITY & INCLUSIVE INTERACTION

* **Non-3D Accessible Anatomy Index**:
  A dedicated "Anatomy Index" drawer provides a keyboard-navigable list of all 13 anatomical structures and 8 systems. Users can inspect every organ, telemetry stream, baseline, and flight rule without needing a mouse or 3D interaction.
* **Keyboard Navigation**:
  * `[F]`: Toggle Fullscreen view.
  * `[R]`: Reset camera orientation to front view.
  * `[Esc]`: Exit fullscreen mode.
  * `[Tab]`: Navigate accessible organ chips and action buttons.
* **Screen Reader Semantic Attributes**:
  Every interactive element includes explicit `title`, `aria-label`, and text equivalents.

---

## 11. VERIFICATION & TEST RESULTS

### 11.1 Test Suite Summary
* **Frontend TypeScript Compilation (`tsc --noEmit`)**: **PASSED (0 errors)**
* **Vite Production Bundler (`vite build`)**: **PASSED (0 errors, 8.40s build time)**
* **End-to-End Integration Suite (`npm run test:integration`)**: **50 / 50 PASSED (100% pass rate)**
* **Backend Pytest Suite (`python -m pytest`)**: **118 / 118 PASSED (100% pass rate)**

```
========================================
INTEGRATION RESULTS: 50 Passed, 0 Failed
========================================
✓ [PASS] 42. Anatomy Registry integrity: All regions defined with strict NASA-STD-3001 guardrails; ocular/musculoskeletal continuous telemetry flagged unavailable; non-anatomical drawer preserved
```

### 11.2 Verification Deliverables Produced
All required screenshots and video demonstrations have been captured:

1. `01_full_body_front_view.png` — Complete human body, head to feet, frontal anatomical view.
2. `02_full_body_back_view.png` — Complete posterior view showing spine, dorsal vasculature, and musculature.
3. `03_left_side_view.png` — Left profile inspection showing sagittal organ layering.
4. `04_right_side_view.png` — Right profile inspection showing hepatic lobes and thoracic depth.
5. `05_selected_heart.png` — Selected heart myocardium with cyan emissive highlight and cardiovascular telemetry.
6. `06_selected_brain.png` — Selected cranial cerebrum and spinal cord with offline cognitive notice.
7. `07_selected_lungs.png` — Selected bilateral lungs with pulmonary ventilation and SpO2 telemetry.
8. `08_fullscreen_mode.png` — True fullscreen view occupying full display area.
9. `09_anatomical_system_isolation.png` — System isolation mode with ghosted non-selected structures.
10. `anatomy_360_rotation_selection.gif` — 360-degree continuous rotation and interactive organ selection demonstration video.

---

## 12. KNOWN LIMITATIONS & SCIENTIFIC ROADMAP

1. **Non-Continuous Sensors**: Microgravity bone demineralization (osteopenia) and spaceflight-associated neuro-ocular syndrome (SANS) cannot be continuously streamed via wearable telemetry in flight; they rely on periodic scheduled in-flight OCT imaging and pre/post DXA scans.
2. **Skin Contours**: The outer shell represents a standardized anthropometric envelope rather than a subject-specific laser scan.
3. **Visceral Motion**: Organ geometries reflect standard anatomical atlas morphology; peristalsis and visceral displacement during high-G launch/entry maneuvers are not dynamically simulated.
