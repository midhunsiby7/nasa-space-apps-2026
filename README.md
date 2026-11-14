# COSMOLOOKUP — Astronaut Health & Telemetry Intelligence Platform

[![NASA Space Apps Challenge 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-0B3D91.svg)](https://www.spaceappschallenge.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20SQLAlchemy-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18+](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript-61DAFB.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/3D%20Canvas-Three.js%20%7C%20R3F-black.svg)](https://threejs.org/)
[![Backend Tests](https://img.shields.io/badge/Pytest-103%20Passed-brightgreen.svg)]()
[![Integration Tests](https://img.shields.io/badge/Integration%20Suite-50%20Passed-brightgreen.svg)]()

> **COSMOLOOKUP** is a spaceflight physiological observation, intra-individual baseline modeling, and explainable clinical decision-support platform built for the **NASA Space Apps Challenge 2026**. Designed for flight surgeons, biomedical engineers, and mission operators, COSMOLOOKUP transforms complex astronaut telemetry into transparent, actionable health intelligence for deep-space exploration.

---

## 1. Mission Challenge & Problem Statement

During long-duration human space exploration—from Artemis lunar surface habitats to interplanetary Mars transits—crew members encounter the **NASA Five Hazards of Human Spaceflight**:
1. **Space Radiation** (carcinogenesis, central nervous system effects, acute solar particle events)
2. **Isolation and Confinement** (circadian rhythm disruption, sleep architecture degradation, cognitive fatigue)
3. **Distance from Earth** (communication latencies up to 22 minutes each way, requiring autonomous medical decision support)
4. **Gravity Fields** (cephalad fluid shifts, neurovestibular space motion sickness, cardiovascular deconditioning, bone mineral loss, muscle atrophy)
5. **Hostile / Closed Environments** (ECLSS atmospheric balance, particulate matter, acoustic exposure)

### Why Population Averages Fail in Deep Space
Terrestrial medical monitoring relies heavily on broad population reference intervals (e.g., resting heart rate 60–100 bpm). In microgravity, cephalad fluid shift triggers acute neuro-humoral diuresis and a ~15–20% contraction in circulating plasma volume within the first 48 hours. What constitutes a healthy vital sign on Earth may signal cardiovascular decompensation or dehydration during spaceflight.

**COSMOLOOKUP solves this paradigm shift:**
Instead of comparing an astronaut against terrestrial population averages, COSMOLOOKUP establishes **Personal Operational Envelopes (POEs)** derived from the astronaut's own verified preflight benchmarks and calibrated in-flight observations.

---

## 2. Core Capabilities & Architectural Features

### A. Astronaut Operational Health Cockpit
- **Fleet-Wide Overview:** Real-time summary of crew complement across active exploration missions (Artemis VII, Mars Transit Analog, Lunar Gateway Base).
- **Personal Vitals Matrix:** Real-time display of core vitals (Heart Rate, SpO₂, Core Temperature, Radiation Flux) paired with individual baseline medians ($P_{50}$), interquartile ranges ($P_{25} - P_{75}$), Sen's slope trend velocity, and telemetry freshness indicators.
- **Urgent Attention Alerts Banner:** Instantly highlights unacknowledged critical and high-severity clinical alerts with direct links to the Alerts Hub.
- **Interactive Crew Selector:** Rapid single-click switching across all monitored crew members.

### B. Interactive 3D Holographic Anatomy & 2D Fallback
- **Three.js & React Three Fiber Mannequin:** 3D procedural humanoid model featuring smooth orbital controls, customizable lighting stages, and automated camera director lerping to target anatomical zones.
- **6 Anatomical Body Systems:**
  - *Cardiovascular System* (thoracic pulse visualizer, resting HR, blood pressure, MAP)
  - *Respiratory / Pulmonary System* (ventilation visualizer, SpO₂, respiratory rate)
  - *Thermoregulation System* (visceral core temperature vs superficial temperature)
  - *Cranial / Neurological System* (ICP surrogate indicators, cognitive alertness)
  - *Ocular System / SANS* (scheduled funduscopy/OCT tracking; non-continuous sensor truthfulness)
  - *Musculoskeletal System & Spine* (exercise countermeasure tracking; non-continuous telemetry truthfulness)
- **Zero-Dependency 2D SVG Schematic Fallback:** High-contrast 2D anatomical silhouette with interactive target regions, guaranteeing operational availability on low-power spacecraft terminals or environments without WebGL hardware acceleration.

### C. Personal Operational Envelopes (POEs) & Baseline Engine
- **Robust Non-Parametric Order Statistics:** Formulates individualized reference envelopes using median ($P_{50}$) and quartiles ($Q_1, Q_3, IQR = Q_3 - Q_1$, and robust scale $\sigma_{\text{IQR}} = IQR / 1.349$), preventing bias from spaceflight transients or noisy sensor packets.
- **Secondary Parametric References:** Tracks sample mean, sample standard deviation, and observed physical extrema ($\text{Min} - \text{Max}$).
- **Baseline Lifecycle Management:** Enforces preflight immutability (`baseline_type: preflight`), in-flight versioning lineage, and maturity progression (`insufficient` $\rightarrow$ `provisional` $\rightarrow$ `established`).
- **Context & Modality Isolation:** Strictly enforces scientific comparability rules:
  - Rejects comparing EVA telemetry (`eva_operational`) against resting cabin baselines (`resting_cabin`).
  - Rejects comparing differing exercise equipment (e.g. ARED resistive lifting vs CEVIS cycle ergometer).
  - Strictly distinguishes superficial body temperature from ingestible core temperature sensor streams.

### D. Longitudinal Trend Intelligence & Freshness Engine
- **Sen's Slope Rate-of-Change Estimator:** Non-parametric trend velocity metric measuring parameter drift per 24-hour interval across sliding lookback windows (1–720 hours).
- **Robust Standardized Deviation ($Z_{\text{robust}}$):** Calculates $(x - \text{median}) / \sigma_{\text{IQR}}$ to detect physiological excursions without assuming Gaussian distribution.
- **Consecutive Deviation Run-Rules:** Distinguishes isolated acute spikes from sustained baseline shifts.
- **Telemetry Freshness & Staleness Tracking:** Monitors elapsed intervals against category-specific expected collection frequencies (e.g. 6h for resting vitals, 1h for radiation dosimeters), raising alerts when sensors go stale.

### E. Explainable Clinical Decision Support & 5-Point Matrix
- **Four Attention Tiers:** Deterministically categorizes crew status into `routine`, `needs_attention`, `medical_review_recommended`, and `emergency`.
- **Flight Surgeon 5-Point Decision Support Matrix:**
  1. *What changed?* — Specific parameter shift and robust Z-deviation.
  2. *Compared with which baseline?* — Active baseline version and preflight envelope reference.
  3. *How reliable is the telemetry?* — Data quality metrics (`nominal` vs `degraded`) and sensor currency.
  4. *Why was an alert generated?* — Multi-metric concordance, run-rule excursions, or symptom triggers.
  5. *What action is recommended?* — Safe, non-prescriptive operational suggestions (hydration recheck, rest cycle, flight surgeon consultation).

### F. Strict Clinical Primacy Safeguards
- **Crew Symptom Dominance:** Crew-reported subjective symptoms (e.g., acute chest pain, persistent cephalic headache, visual disturbances) take immediate clinical precedence over normal statistical vitals.
- **Absence of Data Is Not Normal:** Missing, degraded, or stale telemetry streams trigger explicit investigation alerts rather than assuming nominal status.

### G. Non-Anatomical Habitat & Environmental Telemetry Center
- **Dedicated Decoupled Channels:**
  - *Ionizing Deep-Space Radiation:* ALARA cumulative effective dose (mSv) and dosimeter flux rates.
  - *ECLSS Cabin Life Support:* Total atmospheric pressure (101.3 kPa), partial pressure O₂ (21.2 kPa), and nominal CO₂ scrubbing levels ($< 3.0$ mmHg).
  - *Cognitive Readiness:* Psychomotor Vigilance Task (PVT) reaction speeds and sleep cycle architecture.

### H. 10-Step Interactive Judge Demonstration Tour
- Built-in guided walkthrough accessible directly from the application header.
- Guides evaluators through:
  1. Mission fleet overview
  2. Selected astronaut profile
  3. Interactive 3D / 2D anatomical navigation
  4. Regional vital inspection
  5. Personal operational baseline calculation
  6. Longitudinal trend trajectory
  7. Telemetry freshness verification
  8. Explainable health assessment & decision support
  9. Operational alert lifecycle (`active` $\rightarrow$ `acknowledged` $\rightarrow$ `resolved`)
  10. Non-anatomical habitat center

### I. Offline Resilience & Demo Mode
- Client-side mock fixture fallback automatically activates when the backend server is unreachable.
- Offline write-action guards intercept calculations, alert updates, and symptom reports, gracefully informing operators while preserving complete UI interactivity.

---

## 3. Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend Client (SPA)                           │
│  React 18  │  TypeScript (Strict)  │  Vite 5  │  Tailwind CSS          │
│  Three.js & React Three Fiber  │  Recharts  │  Lucide React Icons      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON (REST API v1)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Backend API Service                            │
│  FastAPI (Async ASGI)  │  Python 3.11+  │  Pydantic v2 (Validation)   │
│  SQLAlchemy 2.0 (ORM)  │  NumPy / SciPy (Non-Parametric Analytics)     │
│  Uvicorn (High-Performance Server)  │  Pytest (Automated Test Suite)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQL Engine
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Data Storage Layer                             │
│  SQLite 3 (Development / Self-Contained)  │  PostgreSQL (Production)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Scientific Foundations & Authoritative Standards

COSMOLOOKUP is engineered in strict alignment with authoritative NASA biomedical flight standards:

1. **NASA-STD-3001, Volume 1 (Revision C):** *NASA Space Flight Human-System Standard: Crew Health.*
   - Defines medical monitoring protocols, baseline requirements, flight surgeon authority, and countermeasure guidelines.
2. **NASA-STD-3001, Volume 2 (Revision D):** *NASA Space Flight Human-System Standard: Human Factors, Habitability, and Environmental Health.*
   - Permissible vehicle atmospheric composition (total pressure 101.3 kPa, ppO₂ 19.5–23.1 kPa, ppCO₂ nominal scrub target $< 3.0$ mmHg / 400 Pa), acoustics, thermal comfort, and lighting.
3. **NASA Spaceflight Standard Measures (SSM):**
   - Standardized physiological, behavioral, and operational measures collected across long-duration ISS and exploration missions.
4. **NASA Human Research Roadmap (HRR):**
   - Evidence-based risk mitigation across the **Five Hazards of Spaceflight**.
5. **Telemetry Availability Truthfulness:**
   - Systems lacking continuous wearable in-flight sensors (such as ocular SANS and bone mineral density) explicitly display unavailable continuous telemetry status rather than fabricating continuous nominal signals.
6. **Dual-Origin Provenance (`is_synthetic`):**
   - Every telemetry record, baseline envelope, assessment, and alert carries an explicit `is_synthetic` boolean flag, ensuring total transparency between empirical research datasets and synthetic flight simulations.

> **IMPORTANT CLINICAL DISCLAIMER:**  
> COSMOLOOKUP is an operational decision-support and physiological trend-analysis platform designed for flight surgeons and biomedical teams. It is **not** an FDA/CE-certified diagnostic medical device, does **not** make autonomous clinical determinations, and does **not** issue medical prescriptions.

---

## 5. Quick Start & Local Setup

### Prerequisites
- **Python:** 3.11 or newer (Validated on Python 3.12)
- **Node.js:** 18.0.0 or newer (Validated on Node.js 24)
- **Git:** 2.30 or newer

### 1. Clone the Repository
```bash
git clone https://github.com/midhunsiby7/nasa-space-apps-2026.git
cd nasa-space-apps-2026
```

### 2. Backend Setup & Startup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with initial astronaut profiles and synthetic telemetry
python -m app.seed

# Start the FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now running at `http://localhost:8000`.  
Interactive Swagger/OpenAPI documentation is available at `http://localhost:8000/docs`.

### 3. Frontend Setup & Startup
In a separate terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend application will launch at `http://localhost:5173`.

### 4. Running in Offline Demo Mode
If you wish to explore the frontend without running the backend server, simply start the frontend (`npm run dev`). COSMOLOOKUP will detect backend unavailability, connect to its built-in realistic mock data fixtures, and display an **OFFLINE DEMO MODE** status banner.

---

## 6. Automated Testing & Verification Suite

COSMOLOOKUP maintains a comprehensive multi-tier automated testing and verification pipeline:

### 1. Backend Test Suite (Pytest)
Executes 103 automated tests covering models, services, baseline engine, trend analytics, assessment synthesis, clinical primacy safeguards, and multi-mission scenario tests:
```bash
# From repository root
backend/.venv/Scripts/python -m pytest backend/tests -v
```
**Result:** `103 passed, 0 failed` (100% pass rate).

### 2. Frontend Strict TypeScript Type Check
Validates complete TypeScript typing with zero implicit `any`:
```bash
cd frontend
npm run lint
```
**Result:** `0 errors`.

### 3. Frontend Production Build
Validates Vite bundler chunking and asset minification:
```bash
cd frontend
npm run build
```
**Result:** `0 errors` (Outputs production bundle in `dist/`).

### 4. End-to-End Integration Suite
Launches an isolated backend instance, runs idempotent database migrations, and executes 42 end-to-end integration assertions across all functional tiers:
```bash
# From repository root
node frontend/scripts/test-integration.mjs
```
**Result:** `42 Passed, 0 Failed`.

---

## 7. Repository Directory Structure

```
nasa-space-apps-2026/
├── backend/                        # Backend REST API Service
│   ├── app/
│   │   ├── api/v1/                 # Version 1 API routes
│   │   │   ├── endpoints/          # Route handlers (astronauts, baselines, trends, etc.)
│   │   │   └── router.py           # Aggregated v1 API router
│   │   ├── catalog/                # Canonical measurement catalog & context taxonomies
│   │   ├── core/                   # Configuration, settings, and custom exceptions
│   │   ├── database/               # Database engine, base metadata, and session management
│   │   ├── models/                 # SQLAlchemy 2.0 ORM database entities
│   │   ├── schemas/                # Pydantic v2 validation and serialization schemas
│   │   ├── services/               # Core business logic and statistical analytics engines
│   │   ├── main.py                 # FastAPI application factory and error handlers
│   │   └── seed.py                 # Non-destructive database seeding script
│   ├── tests/                      # Automated pytest suite (103 tests)
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # Frontend Web Application (React 18 + Vite)
│   ├── scripts/
│   │   └── test-integration.mjs    # Automated cross-platform E2E integration test runner
│   ├── src/
│   │   ├── components/
│   │   │   ├── anatomy/            # 3D Three.js canvas & 2D SVG schematic fallback
│   │   │   ├── baselines/          # Personal baselines exploration and envelope cards
│   │   │   ├── catalog/            # Measurement catalog explorer view
│   │   │   ├── dashboard/          # Astronaut health cockpit and mission overview
│   │   │   ├── demo/               # 10-step Judge Demonstration Tour controller
│   │   │   ├── layout/             # Header, sidebar, and layout wrappers
│   │   │   └── telemetry/          # Time-series charts and stream tables
│   │   ├── services/
│   │   │   ├── apiClient.ts        # Type-safe native Fetch client
│   │   │   └── demoData.ts         # Offline realistic simulation fixtures
│   │   ├── types/                  # TypeScript interface declarations
│   │   ├── utils/                  # Comparability engine and formatting utilities
│   │   └── App.tsx                 # Root application state and navigation controller
│   ├── package.json                # Node dependencies and build scripts
│   └── vite.config.ts              # Vite bundler and chunk-splitting configuration
│
├── docs/                           # Authoritative Documentation & Specifications
│   ├── api/
│   │   └── API_CONTRACT.md         # Binding API contract specifications
│   ├── architecture/
│   │   ├── DATABASE_SCHEMA.md      # Relational database schema models
│   │   └── PHASE_2_BASELINE_DESIGN.md # Baseline engine statistical blueprint
│   ├── presentation/
│   │   ├── PHASE_7_PRESENTATION_READINESS.md # Presentation & UI/UX specification
│   │   └── PHASE_8_SUBMISSION_AND_DEMO.md    # Judge demo tour & submission guide
│   ├── validation/
│   │   ├── PHASE_5_SCIENTIFIC_VALIDATION.md  # Scientific evidence audit & scenario report
│   │   └── PHASE_6_SYSTEM_INTEGRATION.md     # E2E system integration report
│   └── PROJECT_STATE.md            # Living project status and development log
│
├── README.md                       # Repository entry point (this file)
└── .gitignore                      # Unified Git ignore rules
```

---

## 8. Development Roadmap & Milestone Summary

- [x] **Phase 0: Foundations & Architecture** — Directory scaffolding, API contract, database schema, Git Flow.
- [x] **Phase 1: Backend API Foundation** — Core models, SQLite storage, baseline telemetry endpoints, seed pipeline.
- [x] **Phase 2: Health Intelligence Engines** — Measurement catalog, non-parametric baseline calculation engine ($P_{50}, IQR$), baseline lifecycle, Sen's slope trend intelligence, explainable multi-tier assessments, operational alerts.
- [x] **Phase 3: Frontend–Backend API Integration** — Unified API client, live astronaut dashboard, time-series telemetry plots, baseline cards, alerts hub.
- [x] **Phase 4: 3D Holographic Anatomy** — Interactive Three.js/R3F mannequin, camera director, region inspector, 2D SVG schematic fallback.
- [x] **Phase 5: Scientific Validation** — NASA-STD-3001 evidence audit, clinical primacy safeguards, missing/stale telemetry handling, 14 operational scenario tests.
- [x] **Phase 6: System Integration** — 13 E2E user workflows, interactive crew symptom reporting, offline write-action guards, idempotent database seeding.
- [x] **Phase 7: UI/UX Refinement & Presentation Readiness** — Aerospace HUD styling, Astronaut Operational Health Cockpit, 5-point Flight Surgeon decision matrix, 10-step Judge Demo Tour.
- [x] **Phase 8: Final Documentation & Submission Preparation** — Synchronized documentation audit, authoritative API contracts, comprehensive submission guides, verified test pipelines.

---

## 9. Team & Challenge Attribution

**NASA Space Apps Challenge 2026**  
Project: **COSMOLOOKUP**  
Repository: [midhunsiby7/nasa-space-apps-2026](https://github.com/midhunsiby7/nasa-space-apps-2026)  
License: [MIT License](LICENSE)
