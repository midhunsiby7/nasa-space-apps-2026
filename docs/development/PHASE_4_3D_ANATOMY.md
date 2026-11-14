# COSMOLOOKUP — Phase 4: Interactive 3D Anatomy Navigation Experience

> **Milestone:** Phase 4 — Interactive 3D Anatomy Experience  
> **Repository:** `midhunsiby7/nasa-space-apps-2026`  
> **Date:** 2026-11-14  
> **Status:** Implementation Complete & Validated  

---

## 1. Executive Summary & Product Objective

Phase 4 introduces an interactive, spatial human body representation that serves as a **functional navigation and telemetry inspection interface** for astronaut physiological health. 

Rather than serving as an aesthetic or decorative model, the 3D mannequin acts as an intuitive, embodied portal into COSMOLOOKUP's health intelligence engine, connecting physical anatomical regions to:
- Real-time and latest sensor telemetry.
- Personal operational baselines (median and IQR envelopes).
- Sen's slope trend trajectories and robust Z-deviations.
- Operational alerts and clinical assessment findings.

### Strict Scientific, Clinical & Ethical Guardrails

1. **Spatial Navigation Mechanism, NOT Organ Pathology:**
   Highlighting a body region is explicitly an organizational interface to locate sensors. It does **not** signify an organ diagnosis, localized pathology, or automated medical determination. Prominent guardrail notices are permanently displayed on the viewport and inspector.
2. **Telemetry Availability Truthfulness:**
   In real human spaceflight, continuous wearable sensors do not exist for every anatomical system. For systems like the **Ocular System (Spaceflight-Associated Neuro-ocular Syndrome - SANS)** and **Musculoskeletal Framework (bone mineral density & muscle volume)**, continuous streaming data is explicitly flagged as **Unavailable / Offline Protocol**. These are never fabricated or simulated as nominal to avoid giving false impressions of safety.
3. **Non-Anatomical Channel Isolation:**
   Crucial environmental and whole-body exposures—such as ionizing deep-space radiation (`radiation_dose`), ECLSS life-support cabin parameters (total pressure, ppO₂, ppCO₂), sleep architecture, and neuro-behavioral readiness—are not mapped to arbitrary organs. They are housed in a dedicated **Non-Anatomical Flight Telemetry Drawer**.
4. **Resilient Dual-Mode Visualization & WebGL Fallback:**
   The interface supports both a 3D WebGL holographic canvas (powered by Three.js & React Three Fiber) and a lightweight, interactive 2D schematic SVG mannequin. If WebGL context is lost or unsupported by hardware, the application gracefully and automatically falls back to 2D schematic mode with zero data loss.

---

## 2. Anatomical & Telemetry Registry Architecture

The spatial mapping is governed authoritatively by `frontend/src/components/anatomy/anatomyRegistry.ts`.

| Anatomical Region | Target Anatomical System | Mapped Continuous Telemetry | In-Flight Telemetry Availability | Clinical & Flight Operational Protocol |
|---|---|---|---|---|
| **Cardiovascular** | Circulatory & Hemodynamics (mediastinum, heart, aortic root) | `heart_rate`, `blood_pressure_systolic`, `blood_pressure_diastolic` | **Active** | Thoracic BioHarness band & ambulatory blood pressure cuffs monitor cephalad fluid shifts and exercise countermeasure response. |
| **Respiratory** | Pulmonary Ventilation & Gas Exchange (bilateral lungs, trachea) | `respiratory_rate`, `spo2` | **Active** | BioHarness acoustic/impedance respiratory sensors coupled with optical pulse oximetry. Tracks ventilation-perfusion matching and ECLSS scrub efficiency. |
| **Thermoregulation** | Deep Visceral & Core Thermal Homeostasis | `core_temperature`, `body_temperature` | **Active** | Ingestible radio-frequency thermal sensor capsule in GI tract and skin thermometry. Tracks spaceflight-induced elevated resting core temperatures. |
| **Neurological / Sensorimotor** | Central Nervous System & Vestibular Balance | `sleep_duration`, `spo2` (systemic capillary proxy) | **Active** | Tracks neurovestibular space motion adaptation and circadian sleep architecture. Guardrail: SpO₂ reflects peripheral capillary saturation, not intracranial tissue oxygenation. |
| **Ocular (SANS)** | Bilateral Orbits, Optic Nerve Sheath & Retinal Microvasculature | *None (No continuous sensor)* | **Unavailable / Periodic** | Evaluated via scheduled 30-day in-flight Optical Coherence Tomography (OCT) scans, dilated funduscopic imaging, and visual acuity charts. |
| **Musculoskeletal** | Axial Skeleton, Vertebral Column, Pelvis & Extremities | *None (No continuous sensor)* | **Unavailable / Periodic** | Continuous streaming sensors do not exist in flight for bone density or muscle cross-sectional area. Evaluated via daily 2.5h ARED/T2 countermeasure logs and pre/post-mission DXA scans. |

---

## 3. Component Hierarchy & Design

```
AnatomyViewport
 ├── Action Toolbar (3D/2D Toggle, Wireframe Toggle, Reset View, Non-Anatomical Drawer Trigger, Quick Region Selector Pills)
 ├── Viewport Layout (Two-Column Grid)
 │    ├── Left Column: Spatial Canvas
 │    │    ├── [3D Mode] AnatomyScene
 │    │    │    ├── SceneErrorBoundary (Catches WebGL context failures -> falls back to 2D)
 │    │    │    ├── Canvas (@react-three/fiber)
 │    │    │    │    ├── OrbitControls (Damped rotation, restricted zoom & pitch)
 │    │    │    │    ├── CameraFocusController (Interpolates camera position & target toward selected region)
 │    │    │    │    ├── HolographicFloorStage (Rotating concentric HUD rings & orientation crosshairs)
 │    │    │    │    └── Human3DModel (Procedural anatomical meshes: cranium, brain, eyes, spine, ribs, pelvis, extremities, pulsating heart, ventilating lungs, orbiting sensor capsule)
 │    │    └── [2D Mode] Interactive SVG Mannequin (Demarcated clickable & hoverable anatomical regions)
 │    └── Right Column: RegionTelemetryInspector
 │         ├── Region Title, Biomedical Rationale & Medical Guardrail Notice
 │         ├── [If Continuous Telemetry Active]
 │         │    ├── Telemetry Metric Sub-Tabs (e.g. Heart Rate vs Systolic BP)
 │         │    ├── Latest Reading Hero + Timestamp + Data Quality & Provenance Badges
 │         │    ├── Personal Operational Baseline Envelope (Median, IQR, Robust Z-Score)
 │         │    ├── Trend Velocity & Trajectory (Sen's Slope, Direction, Consecutive Deviations)
 │         │    ├── Relevant Operational Alerts
 │         │    ├── Explainable Assessment Findings
 │         │    └── Quick Action: Jump to Full Time-Series Telemetry Stream
 │         └── [If Telemetry Unavailable (SANS / Musculoskeletal)]
 │              ├── High-Visibility Notice: "Continuous In-Flight Telemetry Unavailable"
 │              ├── Operational Warning: "Absence of streaming telemetry does NOT signify nominal physiology or low risk"
 │              └── Flight Operational Protocols (OCT, Funduscopy, ARED exercise, DXA scans)
 └── NonAnatomicalDataDrawer
      ├── Ionizing Cosmic Radiation Stream (`radiation_dose`, ALARA protocol, dosimeter array)
      ├── ECLSS Life Support Cabin Atmosphere (Total pressure, ppO₂, ppCO₂ scrubbing, humidity)
      ├── Circadian Staging & Sleep Architecture (REM/Deep ratios, circadian phase shift)
      └── Neuro-Behavioral Readiness (PVT psychomotor vigilance, workload indices)
```

---

## 4. Verification & Testing

### Frontend Build & Lint Verification
- `npm run lint` (`tsc --noEmit`): Passed with **0 errors**.
- `npm run build` (`tsc && vite build`): Succeeded in **8.94s**. Dedicated Three.js code chunk (`dist/assets/three-*.js`) isolated cleanly via Rollup `manualChunks`.

### Backend Regression Verification
- Ran complete test suite: `backend/.venv/Scripts/python -m pytest backend/tests`
- Result: **85 passed, 1 warning** (100% green in 1.55s). Zero backend regressions.

### PR #10 Integration & Navigation Hooks
- **Baseline Envelope Navigation**: RegionTelemetryInspector incorporates direct navigation buttons (onNavigateToBaselines) enabling operators to pivot directly from regional telemetry cards to the astronaut's active baseline calculation and envelope inspector.
- **Measurement Catalog Navigation**: Connected onNavigateToCatalog to link directly to canonical NASA physiological definitions and sanity bounds.
- **End-to-End Integration Suite**: Validated via 
pm run test:integration (42/42 assertions passing across isolated backend test database with clean lifecycle teardown).
