# COSMOLOOKUP — Frontend Client Application

> **Project:** COSMOLOOKUP (NASA Space Apps Challenge 2026)  
> **Role:** Member 1 — Frontend Developer & UI/UX Lead  
> **Feature Branch:** `feature/frontend-baseline-insights`  
> **Base / Target Integration Branch:** `develop`  
> **Stack:** React 18+, TypeScript, Vite, Tailwind CSS, Three.js, React Three Fiber, React Three Drei, Recharts, Lucide Icons  

---

## 1. Executive Summary & Capabilities Overview

**COSMOLOOKUP** is a spaceflight astronaut health telemetry observation, personal baseline modeling, and decision-support platform designed for aerospace flight surgeons and human research biomedical teams. It adheres to strict scientific integrity, physiological provenance, and explainability standards.

In **Phase 3B & Phase 4 (Unified Implementation)**, the frontend client integrates the Phase 2A backend **Measurement Catalog & Context Taxonomy** and the Phase 2B **Personal Baseline Engine & Operational Envelopes** with the Phase 3A **Interactive 3D Human Anatomy Explorer**.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          COSMOLOOKUP HUD SYSTEM                           │
├────────────────────┬──────────────────────┬───────────────────────────────┤
│ 3D ANATOMY VIEWPORT│ TELEMETRY EXPLORER   │ PERSONAL BASELINES & INSIGHTS │
│ • 6 Body Systems   │ • Catalog (10 Metric)│ • Non-Parametric Order Stats  │
│ • Orbit & Tracking │ • Context Taxonomy   │ • Operational Envelopes (IQR) │
│ • Live Vitals Link │ • Modality Isolation │ • Comparability Engine (5 R)  │
│ • Region Inspector │ • Recharts Teleplot  │ • 9-Point Evidence Breakdown  │
└────────────────────┴──────────────────────┴───────────────────────────────┘
```

---

## 2. Core Operational Modules

### A. Measurement Catalog Explorer (`GET /api/v1/measurements/catalog`)
- **10 Canonical Metrics:** Inspects the official Phase 2A catalog across 5 physiological categories: `cardiovascular`, `respiratory`, `thermal`, `sleep`, and `environmental`.
- **Metadata Inspection:** Displays standard units, human-readable labels, clinical descriptions, wire aliases (e.g. `blood_oxygen` → `spo2`), applicable operational contexts, and derived status (`mean_arterial_pressure`).
- **Physical Sanity Bounds:** Displays physical validation boundaries (e.g. HR `[30.0 – 220.0 bpm]`, SpO2 `[50.0 – 100.0 %]`). Explicitly labeled as **sensor physical validation bounds**, **never** conflated with clinical diagnostic thresholds.
- **Direct Navigation:** One-click navigation to live telemetry time-series charts or baseline envelopes for any catalog metric.

### B. Context-Aware Telemetry Explorer
- **Multi-Dimensional Filtering:** Flight surgeons can isolate telemetry streams by:
  - Metric Category (`cardiovascular`, `respiratory`, `thermal`, `sleep`, `environmental`)
  - Operational Context Tier:
    - *Tier A (Baseline Eligible):* `resting_cabin`, `sleep_cycle`, `exercise_active`, `exercise_recovery`
    - *Tier B (Operational Tracking):* `eva_operational`
    - *Tier C (Excluded Ingestion):* `unknown`, `other`
  - Exercise Countermeasure Modality: `ared_resistive`, `cevis_aerobic`, `t2_treadmill`, `other`, `unknown`
  - Temporal Window: Start and End ISO 8601 timestamps
- **Biometric Time-Series Visualizer:** Recharts-powered graphs featuring dynamic Y-axis scaling, interactive hover inspection, data quality color-coding, and baseline reference overlays.
- **Audited Raw Packet Inspector:** Paginated telemetry ledger detailing measured timestamps, values, units, raw context annotations, exercise modalities, originating sensor models, data quality ratings (`nominal` vs. `degraded`), and provenance flags (`Empirical` vs. `Synthetic`).

### C. Personal Baselines & Operational Envelopes (`/baselines`)
- **Non-Parametric Order Statistics:** Formulates individualized reference values using median and quartiles ($Q_1$, $Q_3$, $IQR = Q_3 - Q_1$, and Gaussian-equivalent robust scale $\sigma_{\text{IQR}} = IQR / 1.349$), preventing skew from transient spaceflight outliers.
- **Parametric Secondary References:** Displays secondary sample mean, standard deviation, and observed physical range ($\text{Min} – \text{Max}$).
- **Data Quality & Window Accounting:** Transparent counts of nominal records included, degraded records excluded, synthetic flags, algorithm version (`v2b-iqr`), and calculation duration.
- **On-Demand Baseline Calculation:** Mission operators can calculate or refresh envelopes via `POST /api/v1/astronauts/{id}/baselines/calculate`. Transparently handles backend guards:
  - `400 INELIGIBLE_BASELINE_CONTEXT`: Rejection of Tier B (EVA) or Tier C contexts.
  - `422 INSUFFICIENT_MEASUREMENTS`: Graceful notice when data points for a specific context are insufficient.
  - `404 BASELINE_NOT_FOUND`: Clear indicator when an envelope has not yet been computed.

### D. Strict Scientific Comparability Engine
Implements the 5 mandatory scientific comparability rules before evaluating telemetry:
1. **Metric Resolution:** Strictly rejects comparing dissimilar metrics (e.g. heart rate vs. blood pressure).
2. **Physiological Temperature Independence:** Explicitly rejects interchanging superficial body temperature (`body_temperature`) with visceral core temperature (`core_temperature`).
3. **Operational Context Isolation:** Rejects comparing EVA telemetry (`eva_operational`) against shirt-sleeve habitat baselines (`resting_cabin`).
4. **Countermeasure Modality Isolation:** Rejects comparing differing exercise equipment (e.g. ARED resistive loading against CEVIS aerobic cycle ergometer baselines).
5. **Wire Alias Normalization:** Transparently resolves legacy or wire aliases (e.g. `blood_oxygen` $\leftrightarrow$ `spo2`) to canonical metrics.

When comparable, provides real-time offset delta ($\Delta = \text{Observed} - \text{Median}$), percent delta ($\Delta\%$), and within-envelope status ($Q_1 \le \text{Value} \le Q_3$).

### E. Explainable Health Observations Panel
Presents an uncompromised 9-point evidence breakdown for every evaluated observation:
1. **Observation Value & Unit**
2. **Measurement UTC Timestamp**
3. **Personal Baseline Reference Envelope ($Q_1$, Median, $Q_3$)**
4. **Context Comparability Evaluation Result & Rationale**
5. **Sample Size & Ingested Record Volume**
6. **Data Quality Status (`nominal` vs. `degraded`)**
7. **Hardware Sensor Origin & Anatomical Site**
8. **Synthetic Flag & Traceability Provenance**
9. **Decision-Support Limitation Disclaimer:** Explicit notification stating COSMOLOOKUP is a decision-support and trend-analysis tool, **not** an autonomous diagnostic medical system or clinical treatment authority.

### F. Interactive 3D Human Anatomy & Baseline Integration
- 6 anatomical zones: Cardiovascular, Pulmonary/Respiratory, Core Thermoregulation, Cranial Neuro-System, Musculoskeletal & Spine, Lower Extremities.
- Directly links 3D region inspection to personal baseline envelopes.
- "Inspect Baseline Envelope" shortcut instantly transitions flight surgeons from 3D anatomical exploration into personal operational envelopes.

---

## 3. Technology Stack

- **Framework:** React 18+ with TypeScript (strict mode, zero implicit any)
- **Build Tool:** Vite 5 (chunk-splitting optimized for Three.js, Recharts, Lucide)
- **Styling:** Tailwind CSS with custom aerospace HUD theme (`space-*`, `telemetry-*`)
- **3D Graphics:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Charting:** Recharts with custom SVG reference lines and shaded reference bands
- **Icons:** Lucide React
- **API Client:** Type-safe native Fetch client with connection state tracking and offline demo fallback

---

## 4. Installation & Local Development

### 1. Prerequisites
- **Node.js:** v18.0.0+ (Tested on Node.js v24.19.0)
- **Python:** v3.11+ (For running FastAPI backend)
- **Browser:** Modern browser with WebGL 2.0 support (Chrome, Edge, Firefox, Safari)

### 2. Setup
```bash
cd frontend
npm install
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```
Client launches locally at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Compiles TypeScript and outputs production bundle in `dist/` with zero errors.

### 5. Strict Type Checking
```bash
npm run lint
```
Executes `tsc --noEmit` validating strict TypeScript typing across all components.

### 6. Automated End-to-End Integration Tests
```bash
npm run test:integration
```
Launches the automated integration test suite validating all 30 test scenarios against the live FastAPI backend server.

---

## 5. Automated Integration Test Suite (30 Verification Points)

The automated test script (`scripts/test-integration.mjs`) verifies complete compliance:

| # | Test Scenario | Verified Endpoint / Engine | Status |
|---|---|---|---|
| 1 | Backend health check | `GET /api/v1/health` | ✓ PASS |
| 2 | Astronaut listing retrieval | `GET /api/v1/astronauts` | ✓ PASS |
| 3 | Astronaut schema fields (`id`, `name`, `mission_name`) | `GET /api/v1/astronauts` | ✓ PASS |
| 4 | Astronaut detail lookup | `GET /api/v1/astronauts/astro-001` | ✓ PASS |
| 5 | Measurement collection retrieval (25 seeded records) | `GET /api/v1/astronauts/astro-001/measurements` | ✓ PASS |
| 6 | Provenance transparency (`is_synthetic = true`) | Telemetry Collection Schema | ✓ PASS |
| 7 | Measurement type reconciliation (7 seeded metrics) | Telemetry Collection Schema | ✓ PASS |
| 8 | Measurement filtering by `measurement_type` | `GET .../measurements?measurement_type=heart_rate` | ✓ PASS |
| 9 | Astronaut directory filtering by `mission_name` | `GET /astronauts?mission_name=AURORA-1` | ✓ PASS |
| 10 | Measurement pagination (`limit=5`, `offset=5`) | `GET .../measurements?limit=5&offset=5` | ✓ PASS |
| 11 | Non-existent astronaut error handling (404) | `GET /astronauts/astro-nonexistent-999` | ✓ PASS |
| 12 | Invalid query parameter handling (400) | `GET /astronauts?limit=999` | ✓ PASS |
| 13 | Empty measurement handling (missing metric) | `GET .../measurements?measurement_type=radiation_dose` | ✓ PASS |
| 14 | Measurement catalog discovery (10 metrics, 3 tiers, 5 modalities) | `GET /api/v1/measurements/catalog` | ✓ PASS |
| 15 | Catalog physical validation bounds (`[30 - 220 bpm]`) | `GET /api/v1/measurements/catalog` | ✓ PASS |
| 16 | Context filtering on measurements | `GET .../measurements?context=resting_cabin` | ✓ PASS |
| 17 | Context + Modality filtering | `GET ...?context=exercise_active&exercise_modality=ared_resistive` | ✓ PASS |
| 18 | Baseline calculation eligibility guard (EVA rejected: 400) | `POST /api/v1/astronauts/{id}/baselines/calculate` | ✓ PASS |
| 19 | Baseline data guard (Insufficient measurements: 422) | `POST /api/v1/astronauts/{id}/baselines/calculate` | ✓ PASS |
| 20 | Baseline calculation success with populated data (200) | `POST /api/v1/astronauts/{id}/baselines/calculate` | ✓ PASS |
| 21 | Statistical mathematical integrity ($Q_1 \le Median \le Q_3, \sigma_{\text{IQR}}$) | Non-Parametric Order Statistics Math | ✓ PASS |
| 22 | Baseline listing schema & envelope validation | `GET /api/v1/astronauts/{id}/baselines` | ✓ PASS |
| 23 | Single baseline lookup retrieves specific envelope (200) | `GET /api/v1/astronauts/{id}/baselines/{type}` | ✓ PASS |
| 24 | Active baseline reference lookup verifies lifecycle status | `GET /api/v1/astronauts/{id}/baselines/active` | ✓ PASS |
| 25 | Uncalculated metric error handling (404) | `GET .../baselines/radiation_dose` | ✓ PASS |
| 26 | Comparability engine: In-envelope observation ($72\text{ bpm} \in [70, 74]$) | Client Scientific Comparability Engine | ✓ PASS |
| 27 | Comparability engine: Out-of-envelope observation ($95\text{ bpm} \notin [70, 74]$) | Client Scientific Comparability Engine | ✓ PASS |
| 28 | Operational isolation: Rejection of EVA vs. resting cabin | Client Scientific Comparability Engine | ✓ PASS |
| 29 | Modality isolation: Rejection of CEVIS aerobic vs. ARED resistive | Client Scientific Comparability Engine | ✓ PASS |
| 30 | Physiological isolation: Rejection of superficial vs. core temp | Client Scientific Comparability Engine | ✓ PASS |
| 31 | Wire alias normalization: `blood_oxygen` $\rightarrow$ `spo2` | Client Scientific Comparability Engine | ✓ PASS |
| 32 | Missing baseline handling: Safe non-comparable result | Client Scientific Comparability Engine | ✓ PASS |

---

## 6. Directory Structure

```
frontend/
├── scripts/
│   └── test-integration.mjs             # 32-point end-to-end integration test runner
├── src/
│   ├── components/
│   │   ├── anatomy/                     # 3D Human Anatomy module (Three.js & R3F)
│   │   │   ├── AnatomyScene.tsx
│   │   │   ├── AnatomyViewport.tsx
│   │   │   ├── Human3DModel.tsx
│   │   │   ├── RegionTelemetryInspector.tsx
│   │   │   └── anatomyRegistry.ts
│   │   ├── baselines/                   # Phase 4 Personal Baselines & Insights
│   │   │   └── PersonalBaselinesView.tsx
│   │   ├── catalog/                     # Phase 3B Measurement Catalog Explorer
│   │   │   └── MeasurementCatalogView.tsx
│   │   ├── charts/                      # Recharts biometric visualizer with IQR reference bands
│   │   │   └── TelemetryTimeSeriesChart.tsx
│   │   ├── common/                      # HUD badges, indicators, and buttons
│   │   ├── dashboard/                   # Mission Overview and module cards
│   │   │   └── MissionOverview.tsx
│   │   ├── layout/                      # Navigation Sidebar and Header
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── telemetry/                   # Multi-dimensional telemetry stream and packet inspector
│   │       └── TelemetryStreamSection.tsx
│   ├── services/
│   │   ├── apiClient.ts                 # Full REST API Client with connection state tracker
│   │   └── demoData.ts                  # High-fidelity synthetic fallback demonstration data
│   ├── types/
│   │   ├── api.ts
│   │   ├── astronaut.ts
│   │   ├── baseline.ts                  # Personal baseline & operational envelope interfaces
│   │   ├── catalog.ts                   # Canonical metric, context & modality interfaces
│   │   └── measurement.ts
│   ├── utils/
│   │   └── formatters.ts                # Comparability engine, formatters, and metadata
│   ├── App.tsx                          # Root application orchestrator and tab router
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 7. Medical & Decision-Support Disclaimer

COSMOLOOKUP is strictly an aerospace biomedical research and decision-support visualization platform developed for the NASA Space Apps Challenge 2026.

- All operational envelopes ($Q_1$, $Median$, $Q_3$, $IQR$) represent intra-individual statistical distributions derived from historical telemetry, **not** clinical diagnostic guidelines or medical alert thresholds.
- The platform does **not** provide autonomous diagnostic assessments, medical treatment recommendations, or autonomous clinical intervention.
- Telemetry records flagged with `is_synthetic: true` represent illustrative, synthetic test data engineered for software evaluation and system verification.
