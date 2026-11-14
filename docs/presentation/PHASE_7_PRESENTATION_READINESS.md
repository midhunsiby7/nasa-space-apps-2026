# COSMOLOOKUP — Phase 7: UI/UX Refinement & Presentation Readiness

> **Project:** COSMOLOOKUP (NASA Space Apps Challenge 2026)  
> **Milestone:** Phase 7 — UI/UX Refinement, Accessibility, and Judge Presentation Readiness  
> **Target Branch:** `develop`  
> **Verification Status:** Backend 103/103 tests passed, Frontend TypeScript 0 errors, Production Build 0 errors.

---

## 1. Executive Summary

Phase 7 elevates COSMOLOOKUP from an integrated engineering prototype to an intuitive, visually coherent, mission-grade spaceflight operations platform. Designed specifically for long-duration deep-space exploration (e.g., Artemis lunar missions and future Mars transits), COSMOLOOKUP equips flight surgeons and mission operators with clear visual hierarchy, intra-individual Personal Operational Envelopes (POEs), longitudinal trend velocity indicators, explainable decision support, and a dedicated 3D/2D spatial anatomy navigation deck.

This document serves as the authoritative operational guide, visual design specification, and demonstration script for judging evaluation.

---

## 2. Visual System & Spaceflight Operations Design Architecture

COSMOLOOKUP avoids superfluous decorative clutter, excessive gradients, and distracting animations in favor of a high-contrast, purpose-built NASA Flight Surgeon HUD aesthetic:

- **Color Palette & Visual Semantics:**
  - **Space Void Backgrounds (`#070a0f`, `#0b0f17`, `#101725`):** High-contrast dark surfaces preventing ocular fatigue in dim mission control environments.
  - **Telemetry Cyan (`#38bdf8`):** System active indicators, personal baseline references, active focus zones.
  - **Telemetry Emerald (`#10b981`):** Nominal physiological vitals, healthy sensor currency, verified telemetry.
  - **Telemetry Amber (`#f59e0b`):** Parameter caution, isolated trend shifts, stale sensor warnings, needs-attention tier.
  - **Telemetry Rose (`#f43f5e`):** Critical alerts, medical review recommended, acute physiological deviations.
  - **Deep Violet / Purple (`#c084fc`, `#a855f7`):** Non-anatomical habitat channels (deep-space radiation dosimeters, ECLSS cabin atmospheric telemetry).
- **Dual-Origin Provenance Badging:** Every card, chart, and modal explicitly identifies whether telemetry derives from empirical research or synthetic physiological simulation models (`SYNTHETIC SIMULATION` vs `EMPIRICAL RESEARCH`).
- **Accessible Typography & Semantics:** Monospace numerals (`JetBrains Mono`, `Fira Code`) for precise vital alignment, high contrast text scales (`text-space-100` to `text-space-400`), keyboard-accessible navigation (`tabIndex`, `onKeyDown`), and non-color-dependent status tags (`[NOMINAL]`, `[ELEVATED]`, `[STALE]`, `[CRITICAL]`).

---

## 3. Key Application Modules

### A. Main Dashboard & Astronaut Operational Health Cockpit (`MissionOverview.tsx`)
- **Fleet-Wide Status Banner:** Monitored crew count, active exploration missions (Artemis III, Mars Transit Analog, Lunar Gateway), health status tiers, unresolved active alerts, and telemetry stream packet volume.
- **Dedicated Health Cockpit:** High-priority cockpit presenting the selected astronaut’s profile, active mission day, and a 4-metric vital card matrix (Heart Rate, SpO₂, Core Temp, Radiation Flux) displaying:
  1. Real-time telemetry value.
  2. Personal baseline median ($P_{50}$).
  3. Interquartile baseline bounds ($P_{25} - P_{75}$).
  4. Sen’s slope trend direction arrow (`INCREASING`, `DECREASING`, `STABLE`).
  5. Telemetry currency badge (`FRESH` vs `STALE`).
- **Urgent Attention Alerts Banner:** Immediately surfaces unacknowledged critical and high-severity operational alerts with direct links to the Alerts Hub.
- **Interactive Crew Selector:** One-click crew member switching across active missions.

### B. Interactive 3D Anatomy & 2D Schematic Fallback (`AnatomyViewport.tsx`)
- **Procedural 3D Mannequin:** Built with Three.js and React Three Fiber, featuring smooth camera lerp transitions to focused anatomical regions (Cardiovascular, Respiratory, Thermoregulation, Ocular/SANS, Neurological, Musculoskeletal).
- **Physiological Animation Pacing:** Rhythmic cardiac thoracic pulse (~72 bpm) and pulmonary ventilation (~14 bpm) providing subtle visual vitality without misleading operators as live ECG/respirometer waveforms.
- **Wireframe & Camera Controls:** Toggleable holographic wireframe mesh, camera orbit controls, and single-click camera orientation reset.
- **Zero-Dependency 2D Schematic Fallback:** High-contrast 2D SVG silhouette with interactive anatomical target zones, guaranteeing operational availability on low-power spacecraft terminals or WebGL-disabled hardware.
- **Scientific Labeling & Modality Isolation:** Disclaims the mannequin as an illustrative navigation model rather than organ pathology, clearly distinguishing available continuous telemetry from scheduled offline examination protocols (e.g., SANS OCT imaging or ARED exercise logs).

### C. Health Intelligence Deck & 5-Point Operator Matrix (`HealthIntelligenceSection.tsx`)
- **Flight Surgeon 5-Point Decision Support Matrix:** Directly answers the five core clinical questions:
  1. *What changed?* — Identifies specific parameter shifts and Robust Z-score deviations.
  2. *Compared with which baseline?* — Identifies active calibrated baseline versions and preflight reference envelopes.
  3. *How reliable is the measurement?* — Cites sensor data quality, calibration status, and telemetry staleness.
  4. *Why was an alert generated?* — Identifies lookback window run-rules, multi-metric concordance, or subjective symptom triggers.
  5. *What action is recommended?* — Provides non-prescriptive, safe operational guidance (e.g., hydration recheck, rest cycle, flight surgeon consultation).
- **Trend Matrix:** Sen’s slope rate-of-change, robust Z-scores, consecutive deviation run-rules, and staleness intervals.
- **Personal Operational Envelopes (POEs):** Non-parametric percentile distribution ($P_{05}, P_{25}, P_{50}, P_{75}, P_{95}$), IQR-based robust dispersion, and baseline maturity lifecycle (`insufficient`, `provisional`, `established`).
- **Interactive Crew Subjective Symptom Reporting:** Allows operators to submit microgravity symptoms (headache, dizziness, fatigue, thermal discomfort, acute chest pain, vision blur). Empirically demonstrates the **Clinical Primacy Rule**: reported crew symptoms escalate assessment tiers even if resting biometrics are statistical nominals.

### D. Dedicated Non-Anatomical Habitat Telemetry Center (`NonAnatomicalDataDrawer.tsx`)
- Accessible globally from the header, sidebar, and anatomy view.
- **Dosimetric Ionizing Radiation:** Cumulative dose in mSv, hourly flux ($\mu\text{Sv/h}$), ALARA flight protocol rule, and simulated dosimeter array sensor attribution.
- **ECLSS Life Support Parameters:** Total cabin pressure (101.3 kPa / 14.7 psi), normoxic $pp\text{O}_2$ (21.2 kPa / 20.9%), $pp\text{CO}_2$ scrubbing ($< 3.0\text{ mmHg}$), cabin temperature, and relative humidity (44%).
- **Sleep & Circadian Dynamics:** 24-hour sleep duration, REM/Deep sleep ratio, and GMT circadian light synchronization.
- **Cognitive Readiness & Operational Fatigue:** Psychomotor Vigilance Task (PVT-B) response speed (214 ms), cognitive lapse rate, and subjective workload score.

### E. Alerts Hub (`AlertsHub.tsx`)
- Multi-tier alert lifecycle: `active` $\to$ `acknowledged` $\to$ `resolved`.
- Severity filtering (`critical`, `high`, `medium`, `low`) and status filtering.
- Transparent alert explanations detailing why the threshold was crossed.
- Real-time write action reliability: rejects mutations with HTTP 503 error feedback if the backend is disconnected, preventing silent failure.

---

## 4. Recommended 10-Step Judge Demonstration Script

To present COSMOLOOKUP effectively to evaluators, launch the **Judge Demo Tour** by clicking the **"Demo Tour"** button in the top navigation bar. Follow this guided sequence:

| Step | Action | Feature Highlight | What to Say / Observe |
|:---:|---|---|---|
| **1** | Select Synthetic Astronaut | Provenance & Roster | *"COSMOLOOKUP maintains dual-origin data transparency. Astronaut Dr. Elena Rostova is monitored on Artemis III with clear synthetic simulation badging."* |
| **2** | Open 3D Anatomy Map | Spatial Navigation | *"The 3D Holographic Anatomy model maps biometrics to anatomical zones with smooth camera framing. Notice the cardiorespiratory pulse and the clear disclaimer that this is an illustrative navigation model."* |
| **3** | View Heart Rate Telemetry | Biometric Stream | *"Continuous 1.0 Hz telemetry streams with calibrated sensors. Time filters allow scrubbing across 8-hour, 24-hour, and complete mission logs."* |
| **4** | Inspect Personal Baselines | Baseline Calculation Engine | *"Rather than applying generic population averages, the platform calculates non-parametric Personal Operational Envelopes ($P_{05} - P_{95}$) with preflight immutability."* |
| **5** | Open Trend Matrix | Trend Intelligence | *"Sen's slope rates of change and robust Z-scores detect slow, insidious physiological drift before acute medical emergencies occur."* |
| **6** | Review Health Assessment | Explainable Decision Support | *"The Flight Surgeon 5-Point Matrix answers: What changed? Compared to which baseline? How reliable? Why alert? What recommended action? No fabricated medical diagnoses."* |
| **7** | Click 'Report Symptoms' | Crew Subjective Input | *"Select Cephalad Head Fullness / Headache or Space Motion Sickness to test astronaut self-reported symptoms."* |
| **8** | Verify Clinical Primacy | Clinical Primacy Rule | *"Notice the assessment immediately escalates to 'needs_attention' or 'medical_review_recommended' despite resting vitals being nominal. NASA Clinical Primacy: telemetry never dismisses reported symptoms."* |
| **9** | Open Non-Anatomical Channels | Systemic & Habitat Sensors | *"Ionizing cosmic radiation (ALARA), ECLSS cabin atmosphere, and PVT cognitive readiness are separated from organ anatomy for scientific fidelity."* |
| **10** | Switch to 2D Fallback | Operational Resilience | *"On low-power lunar lander terminals or in the event of WebGL degradation, the 2D SVG schematic maintains 100% telemetry interaction without dependencies."* |

---

## 5. Important Features & Safeguards to Highlight

1. **Non-Diagnostic & Non-Prescriptive Decision Support:** The system never issues medical diagnoses or drug prescriptions (`is_medical_prescription: false`). Guidance is limited to operational countermeasures (hydration check, sleep schedule adjustment, flight surgeon consultation).
2. **Clinical Primacy Enforcement:** Objective sensor data does not override human clinical reports. When crew members report physical symptoms, decision-support tiers automatically upgrade regardless of nominal vital values.
3. **Absence of Telemetry Transparency:** Missing or stale data is surfaced with warning indicators (`[STALE]`, `UNVERIFIED`) rather than masked as nominal physiology.
4. **Offline Write Reliability:** If the network connection drops, write actions (`acknowledgeAlert`, `resolveAlert`) throw an explicit HTTP 503 error banner rather than pretending to succeed in local memory.
5. **Demonstration Threshold Safety:** Emergency thresholds (e.g. SpO₂ < 85%) are strictly labeled as unvalidated demonstration test scaffolding and disabled by default unless an approved NASA flight protocol is provided.

---

## 6. Known Limitations

- **Simulated ECLSS & Dosimeter Feeds:** Habitat environmental parameters and radiation dosimeter feeds are generated from nominal Exploration Atmosphere standards (NASA-STD-3001) rather than live Orion/ISS telemetry feeds.
- **Illustrative Anatomical Model:** The 3D model is a procedural navigation mannequin and does not represent real-time internal organ deformation, blood flow physics, or patient-specific anatomical abnormalities.
- **Single-Node Local Storage:** In the local demonstration build, persistent data is stored in SQLite; enterprise cloud deployments target PostgreSQL.

---

## 7. Setup & Execution Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Git

### 1. Backend Service
```bash
# In repository root
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Or if using system Python with backend requirements:
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive OpenAPI documentation is available at: `http://localhost:8000/docs`

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
The application opens at: `http://localhost:5173`

### 3. Automated Verification Suites
```bash
# Backend pytest suite (103 tests)
backend\.venv\Scripts\python.exe -m pytest backend/tests

# Frontend TypeScript compilation & linting (0 errors)
cd frontend
npm run lint

# Frontend production build (0 errors)
npm run build
```
