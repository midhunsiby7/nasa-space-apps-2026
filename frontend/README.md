# COSMOLOOKUP — Frontend Client Application

> **Project:** COSMOLOOKUP (NASA Space Apps Challenge 2026)  
> **Status:** Production Ready (Phase 8 Documentation & Submission)  
> **Target Branch:** `develop`  
> **Stack:** React 18+, TypeScript, Vite 5, Tailwind CSS, Three.js, React Three Fiber, React Three Drei, Recharts, Lucide Icons  
> **Verification Status:** TypeScript 0 errors (`tsc --noEmit`), Production Build 0 errors (`vite build`), Integration Tests 42/42 passed.

---

## 1. Executive Summary & Capabilities Overview

**COSMOLOOKUP** is a spaceflight astronaut health telemetry observation, personal operational baseline modeling, and clinical decision-support interface engineered for aerospace flight surgeons, biomedical engineers, and astronaut crews.

The frontend client integrates all operational modules into a high-contrast, mission-grade aerospace HUD:
- **Astronaut Operational Health Cockpit:** Fleet status, selected astronaut profile card, active mission elapsed day, 4-metric vital card matrix ($P_{50}$ median, IQR, Sen's slope trend, freshness badge), and quick crew switcher.
- **Interactive 3D Holographic Anatomy Viewport:** Three.js and React Three Fiber procedural humanoid model featuring smooth orbital controls, physiological pacing animations (cardiac pulse ~72 bpm, pulmonary ventilation ~14 bpm), camera director lerping, and a zero-dependency 2D SVG schematic fallback for low-power terminals.
- **Personal Operational Baselines Explorer:** Non-parametric order statistics ($P_{50}, Q_1, Q_3, IQR, \sigma_{\text{IQR}} = IQR / 1.349$), baseline lifecycle lineage (preflight immutability, in-flight versioning), and on-demand baseline calculation.
- **Measurement Catalog View:** Exploration of 10 canonical metrics, context taxonomies (Tier A: Baseline Eligible, Tier B: Operational Tracking, Tier C: Excluded), exercise modalities, and physical sensor validation boundaries.
- **Biometric Time-Series Visualizer:** Recharts-powered graphs featuring dynamic Y-axis scaling, interactive hover inspection, IQR baseline bands, and data quality indicators.
- **Explainable Health Intelligence Deck:** Multi-tier clinical attention classifications (`routine`, `needs_attention`, `medical_review_recommended`, `emergency`), transparent reasoning, and the Flight Surgeon 5-Point Decision Support Matrix.
- **Interactive Crew Symptom Reporting Dialog:** Enables crew members or flight surgeons to submit subjective symptoms (e.g. `headache`, `acute_chest_pain`), triggering clinical primacy escalation over statistical vitals.
- **Operational Alerts Hub:** Complete operator alert lifecycle (`active` $\rightarrow$ `acknowledged` $\rightarrow$ `resolved`) with persistent audit notes.
- **Judge Demonstration Tour Controller:** Built-in 10-step interactive walkthrough guiding evaluators through the entire clinical workflow.
- **Resilient Offline Demo Engine:** Automatic detection of backend connectivity; seamless fallback to rich realistic simulation fixtures with client-side write-action guards.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          COSMOLOOKUP HUD SYSTEM                           │
├────────────────────┬──────────────────────┬───────────────────────────────┤
│ 3D ANATOMY VIEWPORT│ TELEMETRY EXPLORER   │ PERSONAL BASELINES & INSIGHTS │
│ • 6 Body Systems   │ • Catalog (10 Metric)│ • Non-Parametric Order Stats  │
│ • Orbit & Tracking │ • Context Taxonomy   │ • Operational Envelopes (IQR) │
│ • Live Vitals Link │ • Modality Isolation │ • Comparability Engine (5 R)  │
│ • 2D SVG Fallback  │ • Recharts Teleplot  │ • 5-Point Decision Matrix     │
└────────────────────┴──────────────────────┴───────────────────────────────┘
```

---

## 2. Core Operational Modules

### A. Main Dashboard & Health Cockpit (`src/components/dashboard/`)
- **Mission Fleet Banner:** Displays crew count, active exploration missions (Artemis VII, Mars Transit Analog, Lunar Gateway), health status tiers, active alert counters, and packet volumes.
- **Selected Astronaut Cockpit:** High-priority display of selected crew member's profile, flight elapsed day, and vital cards:
  1. Real-time telemetry value.
  2. Personal baseline median ($P_{50}$).
  3. Interquartile baseline bounds ($P_{25} - P_{75}$).
  4. Sen's slope trend arrow (`INCREASING`, `DECREASING`, `STABLE`).
  5. Telemetry currency badge (`FRESH` vs `STALE`).
- **Urgent Attention Alerts Banner:** Surfaces unacknowledged critical and high-severity alerts.
- **Quick Crew Switcher:** Single-click switching between monitored crew members.

### B. Interactive 3D Anatomy & 2D Schematic Fallback (`src/components/anatomy/`)
- **3D Procedural Mannequin:** Built using Three.js and React Three Fiber with custom lighting stages and smooth camera lerp transitions to 6 anatomical target zones.
- **Physiological Pacing Visualizers:** Cardiac thoracic pulse (~72 bpm) and pulmonary ventilation (~14 bpm) visualizers. Explicitly labeled as visual reference pacers, **not** live ECG/respirometer waveforms.
- **Zero-Dependency 2D SVG Fallback:** High-contrast 2D SVG silhouette with clickable anatomical target zones, ensuring availability on low-power terminals or WebGL-disabled systems.
- **Sensor Availability Truthfulness:** Cardiovascular, respiratory, and thermoregulation regions show active continuous telemetry, while Ocular SANS and Musculoskeletal systems explicitly display "Continuous Telemetry Unavailable" notices, clarifying periodic offline examination protocols per NASA Spaceflight Standard Measures.
- **Non-Anatomical Habitat Drawer:** Decouples environmental variables (ECLSS life support, deep-space ionizing radiation, PVT cognitive readiness) into dedicated channels.

### C. Personal Baselines & Operational Envelopes (`src/components/baselines/`)
- **Non-Parametric Order Statistics:** Formulates individualized reference values using median and quartiles ($Q_1$, $Q_3$, $IQR = Q_3 - Q_1$, and Gaussian-equivalent robust scale $\sigma_{\text{IQR}} = IQR / 1.349$), preventing skew from transient spaceflight outliers.
- **Parametric Secondary References:** Displays secondary sample mean, standard deviation, and observed physical range ($\text{Min} – \text{Max}$).
- **Data Quality & Window Accounting:** Transparent counts of nominal records included, degraded records excluded, synthetic flags, algorithm version (`v2c-lifecycle`), and calculation duration.
- **On-Demand Baseline Calculation:** Mission operators can calculate or refresh envelopes via `POST /api/v1/astronauts/{id}/baselines/calculate`. Transparently handles backend guards:
  - `400 INELIGIBLE_BASELINE_CONTEXT`: Rejection of Tier B (EVA) or Tier C contexts.
  - `422 INSUFFICIENT_MEASUREMENTS`: Graceful notice when data points for a specific context are insufficient.
  - `404 BASELINE_NOT_FOUND`: Clear indicator when an envelope has not yet been computed.

### D. Measurement Catalog Explorer (`src/components/catalog/`)
- **10 Canonical Metrics:** Inspects the official catalog across 5 physiological categories: `cardiovascular`, `respiratory`, `thermal`, `sleep`, and `environmental`.
- **Metadata Inspection:** Displays standard units, clinical descriptions, wire aliases (e.g. `blood_oxygen` $\rightarrow$ `spo2`), applicable operational contexts, and derived status (`mean_arterial_pressure`).
- **Physical Sanity Bounds:** Displays physical validation boundaries (e.g. HR `[30.0 – 220.0 bpm]`, SpO2 `[50.0 – 100.0 %]`). Explicitly labeled as **sensor physical validation bounds**, **never** conflated with clinical diagnostic thresholds.
- **Direct Navigation:** One-click navigation to live telemetry time-series charts or baseline envelopes for any catalog metric.

### E. Telemetry Time-Series Visualizer (`src/components/telemetry/`)
- **Multi-Dimensional Filtering:** Flight surgeons can isolate telemetry streams by Metric Category, Operational Context Tier, Exercise Countermeasure Modality, and Temporal Window.
- **Biometric Time-Series Visualizer:** Recharts-powered graphs featuring dynamic Y-axis scaling, interactive hover inspection, data quality color-coding, and baseline reference overlays.
- **Audited Raw Packet Inspector:** Paginated telemetry ledger detailing timestamps, values, units, context annotations, exercise modalities, originating sensor models, data quality ratings (`nominal` vs. `degraded`), and provenance flags (`Empirical` vs. `Synthetic`).

### F. Explainable Health Intelligence & Clinical Decision Support
- **Flight Surgeon 5-Point Decision Support Matrix:**
  1. *What changed?* — Identifies specific parameter shifts and Robust Z-score deviations.
  2. *Compared with which baseline?* — Identifies active calibrated baseline versions and preflight reference envelopes.
  3. *How reliable is the measurement?* — Cites sensor data quality, calibration status, and telemetry staleness.
  4. *Why was an alert generated?* — Identifies lookback window run-rules, multi-metric concordance, or subjective symptom triggers.
  5. *What action is recommended?* — Provides non-prescriptive, safe operational guidance.
- **Clinical Primacy Safeguards:** Crew-reported subjective symptoms strictly override normal statistical vitals.
- **Absence of Data Is Not Normal:** Missing or stale telemetry streams trigger explicit warning states rather than assuming nominal status.

### G. Operational Alerts Hub
- Real-time listing of active, acknowledged, and resolved alerts.
- Acknowledge and resolve action dialogs with operator notes.
- Dedicated offline guard notices when backend is offline.

### H. 10-Step Interactive Judge Demonstration Tour (`src/components/demo/`)
- Built-in guided walkthrough directly accessible via the **"JUDGE DEMO TOUR"** button in the header.
- Guides evaluators sequentially through all 10 key operational milestones.

---

## 3. Technology Stack & Dependencies

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React 18.3+ | Component-driven UI architecture with hooks and error boundaries |
| **Language** | TypeScript 5.5+ | Strict type safety, complete schema validation, zero `any` |
| **Bundler** | Vite 5.4+ | Lightning-fast HMR and optimized production asset chunking |
| **Styling** | Tailwind CSS 3.4+ | Aerospace HUD dark-mode theme (`space-*`, `telemetry-*`) |
| **3D Graphics** | Three.js / R3F / Drei | Procedural humanoid mannequin canvas, camera orbit controls |
| **Charting** | Recharts 2.12+ | Responsive SVG time-series charts, IQR reference bands |
| **Icons** | Lucide React | High-contrast aerospace iconography |
| **HTTP Client** | Native Fetch API | Type-safe REST client with offline mock fallback |

---

## 4. Installation & Local Development

### Prerequisites
- **Node.js:** v18.0.0+ (Validated on Node.js v24)
- **npm:** v9.0.0+

### Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables (optional; defaults to http://localhost:8000/api/v1)
cp .env.example .env
```

### Start Development Server
```bash
npm run dev
```
Client launches locally at `http://localhost:5173`.

### Strict Type Checking
```bash
npm run lint
```
Executes `tsc --noEmit`, verifying zero TypeScript type errors.

### Production Build
```bash
npm run build
```
Compiles TypeScript and creates optimized production bundle in `dist/`.

### Run Automated Integration Tests
```bash
npm run test:integration
```
Launches the automated integration test suite validating all 42 scenarios against an isolated backend instance.

---

## 5. Automated Integration Test Suite (42 Verification Points)

The automated test runner (`scripts/test-integration.mjs`) executes 42 end-to-end integration assertions:

| # | Test Scenario | Verified Endpoint / Module | Status |
|---|---|---|---|
| 1 | Backend health check | `GET /api/v1/health` | ✓ PASS |
| 2 | Astronaut listing retrieval | `GET /api/v1/astronauts` | ✓ PASS |
| 3 | Astronaut schema fields | `GET /api/v1/astronauts` | ✓ PASS |
| 4 | Astronaut detail lookup | `GET /api/v1/astronauts/astro-001` | ✓ PASS |
| 5 | Measurement collection retrieval | `GET /api/v1/astronauts/{id}/measurements` | ✓ PASS |
| 6 | Provenance transparency (`is_synthetic`) | `GET /api/v1/astronauts/{id}/measurements` | ✓ PASS |
| 7 | Core metric type reconciliation | `GET /api/v1/astronauts/{id}/measurements` | ✓ PASS |
| 8 | Measurement filtering by type | `GET /api/v1/astronauts/{id}/measurements` | ✓ PASS |
| 9 | Astronaut directory filtering by mission | `GET /api/v1/astronauts?mission_name=...` | ✓ PASS |
| 10 | Measurement pagination | `GET /api/v1/astronauts/{id}/measurements` | ✓ PASS |
| 11 | Error handling: Non-existent astronaut | `GET /api/v1/astronauts/astro-999` (404) | ✓ PASS |
| 12 | Error handling: Invalid limit parameter | `GET /api/v1/astronauts?limit=999` (400) | ✓ PASS |
| 13 | Empty measurement collection handling | `GET /api/v1/astronauts/{id}/measurements` | ✓ PASS |
| 14 | Catalog discovery | `GET /api/v1/measurements/catalog` | ✓ PASS |
| 15 | Catalog physical bounds metadata | `GET /api/v1/measurements/catalog` | ✓ PASS |
| 16 | Context filtering | `GET /api/v1/astronauts/{id}/measurements` | ✓ PASS |
| 17 | Modality filtering | `GET /api/v1/astronauts/{id}/measurements` | ✓ PASS |
| 18 | Baseline eligibility guard (EVA rejected) | `POST .../baselines/calculate` (400) | ✓ PASS |
| 19 | Baseline data guard (insufficient points) | `POST .../baselines/calculate` (422) | ✓ PASS |
| 20 | Baseline calculation success | `POST .../baselines/calculate` (200) | ✓ PASS |
| 21 | Mathematical integrity of baseline envelope | Envelope statistics ($Q_1 \le P_{50} \le Q_3$) | ✓ PASS |
| 22 | Baseline collection listing | `GET /api/v1/astronauts/{id}/baselines` | ✓ PASS |
| 23 | Single baseline lookup | `GET .../baselines/{metric}` | ✓ PASS |
| 24 | Active baseline lookup | `GET .../baselines/active` | ✓ PASS |
| 25 | Error handling: Uncalculated baseline | `GET .../baselines/{uncalculated}` (404) | ✓ PASS |
| 26 | Comparability engine: Nominal resting check | Client Comparability Evaluator | ✓ PASS |
| 27 | Comparability engine: Out-of-envelope check | Client Comparability Evaluator | ✓ PASS |
| 28 | Scientific isolation: EVA vs resting | Client Comparability Evaluator | ✓ PASS |
| 29 | Scientific isolation: ARED vs CEVIS | Client Comparability Evaluator | ✓ PASS |
| 30 | Scientific isolation: Core vs superficial temp | Client Comparability Evaluator | ✓ PASS |
| 31 | Wire aliasing (`blood_oxygen` $\leftrightarrow$ `spo2`) | Client Comparability Evaluator | ✓ PASS |
| 32 | Missing baseline handling | Client Comparability Evaluator | ✓ PASS |
| 33 | Telemetry freshness report | `GET .../trends/freshness` | ✓ PASS |
| 34 | Multi-metric health trends retrieval | `GET .../trends` | ✓ PASS |
| 35 | Trend observation schema integrity | `GET .../trends` | ✓ PASS |
| 36 | Single metric trend analysis | `GET .../trends/{metric}` | ✓ PASS |
| 37 | Latest health assessment retrieval | `GET .../assessments/latest` | ✓ PASS |
| 38 | Assessment synthesis & clinical primacy | `POST .../assessments` | ✓ PASS |
| 39 | Operational alerts collection retrieval | `GET .../alerts` | ✓ PASS |
| 40 | Alert acknowledgement lifecycle | `POST /api/v1/alerts/{id}/acknowledge` | ✓ PASS |
| 41 | Alert resolution lifecycle | `POST /api/v1/alerts/{id}/resolve` | ✓ PASS |
| 42 | Anatomy Registry integrity & NASA-STD-3001 | Anatomy Registry & Fallback Schema | ✓ PASS |
