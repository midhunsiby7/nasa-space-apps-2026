# COSMOLOOKUP — Project State & Architectural Blueprint

> **Project:** COSMOLOOKUP (NASA Space Apps Challenge 2026)  
> **Status:** Phase 8 — Final Documentation, Submission & Demo Preparation (In Progress)  
> **Last Updated:** 2026-11-14  
> **Canonical Repository:** `D:\nasa2026` (`https://github.com/midhunsiby7/nasa-space-apps-2026`)  
> **Canonical Target Branch:** `develop` | **Release Branch:** `main`

---

## 1. Project Overview

**COSMOLOOKUP** is an integrated mission telemetry, astronaut physiological health observation, and explainable clinical decision-support platform engineered for the NASA Space Apps Challenge 2026. During extended deep-space exploration—including Artemis lunar base operations and prolonged Mars transits—continuous monitoring, rapid cross-referencing of astronaut vitals, habitat environmental factors, and mission timelines are vital for crew well-being and operational safety.

COSMOLOOKUP delivers:
- **Centralized Astronaut Exploration:** Comprehensive crew directory with mission role assignments, flight elapsed days (MET/Flight Day), and active exploration context.
- **Intra-Individual Personal Operational Envelopes (POEs):** Non-parametric statistical baselines ($P_{50}$ median, $IQR = Q_3 - Q_1$, robust scale $\sigma_{\text{IQR}} = IQR / 1.349$) that supersede population reference ranges with individual-specific operational baselines.
- **Longitudinal Trend Intelligence:** Sen's slope rate-of-change velocity metrics and robust Z-score deviation tracking across sliding lookback windows.
- **Explainable Health Assessment & Alerts:** Multi-tier clinical attention classifications (`routine`, `needs_attention`, `medical_review_recommended`, `emergency`), transparent plain-language explanations, non-prescriptive deterministic operational guidance, and full operator alert lifecycle management (`active` $\rightarrow$ `acknowledged` $\rightarrow$ `resolved`).
- **Interactive 3D Anatomy Navigation:** Three.js and React Three Fiber procedural mannequin with smooth orbital camera controls, contextual regional vitals inspection, and zero-dependency 2D SVG schematic fallback.
- **Scientific Safeguards & Clinical Primacy:** Strict non-diagnostic positioning, clinical primacy for crew-reported symptoms over normal telemetry, telemetry staleness warnings, and decoupled non-anatomical channels (ECLSS life support, deep-space ionizing radiation, PVT cognitive metrics).
- **Dual-Origin Data Transparency:** Complete provenance labeling (`is_synthetic: true/false`) distinguishing empirical spaceflight research from synthetic simulation models.
- **Judge Demonstration Tour Controller:** Built-in 10-step interactive walkthrough guiding evaluators through the end-to-end clinical workflow.

---

## 2. Team Responsibilities

To ensure parallel development and clear separation of concerns, team responsibilities are partitioned as follows:

| Role | Domain | Primary Responsibilities |
|---|---|---|
| **Project Architect & Backend Lead** | System Architecture & Backend Service | - System architecture, database schema design, and API contract governance.<br>- Backend service implementation (FastAPI, SQLAlchemy 2.0, Pydantic v2).<br>- Intra-individual baseline engine, Sen's slope trend analytics, and assessment synthesis.<br>- Integration integrity, data access optimization, and unit testing.<br>- Repository hygiene, merge reviews, and API consistency. |
| **Frontend Developer & UI/UX Lead** | Web Client & Visualizations | - Modern SPA dashboard interface (React 18+, TypeScript, Vite, Tailwind CSS).<br>- Interactive 3D holographic anatomy canvas (Three.js, React Three Fiber, Drei) with 2D SVG fallback.<br>- Visual analytics: interactive time-series charts (Recharts), mission day scrubbers, astronaut directories.<br>- Personal baselines and measurement catalog views.<br>- Client-side API consumption adhering strictly to `API_CONTRACT.md`.<br>- Responsive design, accessibility, and offline demo mode. |
| **Research & Data Specialist** | Domain Research & Data Pipelines | - Investigation of NASA physiological research and biomedical telemetry standards.<br>- Alignment with NASA-STD-3001 (Vol 1 & 2) and NASA Spaceflight Standard Measures.<br>- Sourcing empirical datasets (NASA LSDA, OSDR, analog mission vitals).<br>- Formulation of realistic synthetic data generation models for long-duration spaceflight.<br>- Population and verification of data sets in `data/research/` and `data/synthetic/`. |

---

## 3. Technology Stack

The stack is intentionally selected for fast iteration, lightweight deployment, strong typing, and rock-solid reliability:

### Backend & API
- **Language:** Python 3.11+ (Validated on Python 3.12)
- **Web Framework:** FastAPI (high performance, native async, automatic OpenAPI documentation at `/docs`)
- **Data Validation & Serialization:** Pydantic v2 (strict type enforcement and serialization)
- **ORM / Database Layer:** SQLAlchemy 2.0 (declarative mappings, indexed time-series queries)
- **Statistical Analytics:** NumPy, SciPy (non-parametric Sen's slope, robust order statistics)
- **ASGI Server:** Uvicorn
- **Testing:** Pytest, HTTPX TestClient (103 automated tests)

### Frontend
- **Framework:** React 18+ with TypeScript (strict type checking, zero implicit `any`)
- **Tooling & Bundler:** Vite 5 (chunk-splitting optimized for Three.js, Recharts, Lucide)
- **Styling:** Tailwind CSS with custom aerospace HUD theme (`space-*`, `telemetry-*`)
- **3D Graphics:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Charting:** Recharts (time-series biometric plots, IQR baseline bands, reference thresholds)
- **Icons:** Lucide React
- **HTTP Client:** Type-safe native Fetch client with offline demo fallback

### Data & Storage
- **Development Database:** SQLite 3 (zero configuration, self-contained for local dev)
- **Production Target:** PostgreSQL (compatible declarative schema for containerized/cloud deployments)
- **Data Formats:** JSON, CSV, SQLite

### Collaboration & Version Control
- **VCS:** Git & GitHub (`midhunsiby7/nasa-space-apps-2026`)
- **Branching Model:** Git Flow (`main`, `develop`, and scoped feature branches)

---

## 4. Architecture Overview

COSMOLOOKUP follows a decoupled three-tier architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend Client (SPA)                           │
│             React 18 + TypeScript + Vite + Tailwind CSS                │
│  ┌──────────────────────┬──────────────────────┬────────────────────┐  │
│  │ 3D/2D Anatomy Canvas │ Telemetry Visualizer │ Cockpit & Alerts   │  │
│  │ Three.js / R3F / SVG │ Recharts Time-Series │ Decision Matrix    │  │
│  └──────────────────────┴──────────────────────┴────────────────────┘  │
│  ┌──────────────────────┬──────────────────────┬────────────────────┐  │
│  │ Personal Baselines   │ Measurement Catalog  │ Judge Demo Tour    │  │
│  │ Non-Parametric IQR   │ Context Taxonomy     │ 10-Step Controller │  │
│  └──────────────────────┴──────────────────────┴────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON (REST API v1)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Backend API Service                            │
│                         FastAPI + Pydantic v2                          │
│  ┌──────────────────────┬──────────────────────┬────────────────────┐  │
│  │ /astronauts          │ /measurements        │ /catalog           │  │
│  │ Roster & Profiles    │ Time-Series Query    │ Context Taxonomy   │  │
│  ├──────────────────────┼──────────────────────┼────────────────────┤  │
│  │ /baselines           │ /trends              │ /assessments       │  │
│  │ Calculation & Life   │ Sen's Slope & Stale  │ Multi-Metric Logic │  │
│  ├──────────────────────┴──────────────────────┴────────────────────┤  │
│  │ /alerts (Lifecycle: active -> acknowledged -> resolved)          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQLAlchemy 2.0
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Data Storage Layer                             │
│                      SQLite (Dev) / PostgreSQL                         │
│  [Astronauts] ◄── 1:N ──► [Measurements]                               │
│  [Astronauts] ◄── 1:N ──► [AstronautBaseline] (Versioned & Immutable)   │
│  [Astronauts] ◄── 1:N ──► [HealthAssessment] ◄── 1:N ──► [HealthAlert] │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Development Phases Roadmap

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Phase 0  │ ──► │  Phase 1  │ ──► │  Phase 2  │ ──► │  Phase 3  │ ──► │  Phase 4  │
│Foundations│     │Backend API│     │Intelligence│    │Integration│     │3D Anatomy │
└───────────┘     └───────────┘     └───────────┘     └───────────┘     └───────────┘
                                                                              │
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐           │
│  Phase 8  │ ◄── │  Phase 7  │ ◄── │  Phase 6  │ ◄── │  Phase 5  │ ◄─────────┘
│Final Docs │     │UI/UX Demo │     │System Inte│     │ Scientific│
└───────────┘     └───────────┘     └───────────┘     └───────────┘
```

1. **Phase 0 — Repository Foundation & Initialization:**
   - Establish directory structures, Git repository, unified `.gitignore`, and branching strategy.
   - Author foundational contracts (`PROJECT_STATE.md`, `API_CONTRACT.md`, `DATABASE_SCHEMA.md`).
   - Synchronize `main` and `develop` branches.

2. **Phase 1 — Data Ingestion & Backend Foundation:**
   - Implement database entities in SQLAlchemy derived from `DATABASE_SCHEMA.md`.
   - Seed database with baseline astronaut profiles and synthetic biometric measurements.
   - Implement initial endpoints (`GET /astronauts`, `GET /astronauts/{id}`, `GET /astronauts/{id}/measurements`).
   - Automated test suite (17 tests passing).

3. **Phase 2 — Health Intelligence & Decision Support Engines:**
   - **Phase 2A:** Measurement Catalog, normalizer, and context taxonomy (`docs/architecture/PHASE_2_BASELINE_DESIGN.md`).
   - **Phase 2B:** Personal baseline calculation engine using non-parametric statistics ($P_{50}, IQR, \sigma_{\text{IQR}}$) and Personal Operational Envelopes (63 tests).
   - **Phase 2C:** Baseline lifecycle management (preflight immutability, in-flight versioning, criteria snapshots).
   - **Phase 2D:** Trend intelligence (Sen's slope rate-of-change, robust Z-scores, freshness evaluation).
   - **Phase 2E:** Explainable assessments (4 attention tiers, transparent explanations, deterministic guidance, operator alert lifecycle, 81 tests).

4. **Phase 3 — Frontend–Backend API Integration:**
   - Unified API client (`apiClient.ts`) connecting React client to FastAPI backend.
   - Integrated live astronaut roster, time-series telemetry plots, personal baselines, trends, assessments, and operational alerts.
   - PR #11 merged into `develop` (`fe78346`).

5. **Phase 4 — Interactive 3D Anatomy Navigation Experience:**
   - Three.js & React Three Fiber holographic anatomical mannequin with orbit controls and region camera director.
   - Resilient zero-dependency 2D SVG schematic fallback for WebGL-disabled terminals.
   - Region telemetry inspector, non-anatomical telemetry drawer, and physiological animation visualizers.
   - PR #12 merged into `develop` (`6d6d07b`).

6. **Phase 5 — Scientific Validation & Scenario Testing:**
   - Systematic evidence audit against NASA-STD-3001 (Vol 1 & 2) and NASA Spaceflight Standard Measures.
   - Clinical primacy safeguard implementation (crew-reported symptoms override normal statistical telemetry).
   - Stale/missing telemetry safeguards; telemetry availability truthfulness (OCT/BMD continuous telemetry flagged unavailable).
   - 14 automated operational scenario tests (99 tests passing).
   - PR #13 merged into `develop` (`b5bbf93`).

7. **Phase 6 — Complete System Integration & Bug Fixing:**
   - 13 verified end-to-end user workflows; offline write-action guards with resilient demo mock fallback.
   - Interactive crew symptom reporting dialog with clinical primacy escalation.
   - Non-destructive idempotent database seeding; cross-platform test runner hardening.
   - 103 backend automated tests passing.
   - PR #14 merged into `develop` (`54f3cb8`).

8. **Phase 7 — UI/UX Refinement & Presentation Readiness:**
   - Mission-grade aerospace HUD styling (`space-*`, `telemetry-*`).
   - Astronaut Operational Health Cockpit with 4-metric vital card matrix and quick astronaut selector.
   - Flight Surgeon 5-Point Decision Support Matrix answering all critical operational questions.
   - Global Non-Anatomical Habitat & Systemic Telemetry Center (radiation, ECLSS, PVT cognitive).
   - Built-in 10-step interactive Judge Demonstration Tour.
   - Reconciled and merged PR #10 / PR #16 (`ce438d9`): dedicated Personal Baselines view, Measurement Catalog explorer, and 42 integration tests.
   - PR #15 merged into `develop` (`fb0a8b1`).

9. **Phase 8 — Final Documentation, Submission & Demo Preparation (Current Phase):**
   - Comprehensive documentation audit and synchronization across all repo docs.
   - Synchronization of `docs/api/API_CONTRACT.md` with all live endpoints and Pydantic schemas.
   - Full rewrite of root `README.md` with complete setup instructions, architecture diagrams, and scientific transparency notices.
   - Dedicated Phase 8 submission guide (`docs/presentation/PHASE_8_SUBMISSION_AND_DEMO.md`).
   - Verification of all test suites (103 backend pytest, 42 frontend integration, TypeScript & Vite build clean).

---

## 6. Current Progress & Milestones

| Milestone | PR / Commit | Status | Verification Summary |
|---|---|---|---|
| **Phase 0: Foundation** | Initial Commits | Complete | Directory structure, Git Flow, contracts, `.gitignore`. |
| **Phase 1: Backend Foundation** | PR #7 (`a8e3ff3`) | Complete | Astronaut & measurement endpoints, SQLite schema, 17 tests. |
| **Phase 2: Health Intelligence** | PR #9 (`1b499ee`) | Complete | Baseline engine, trend analytics, explainable assessments, alerts, 81 tests. |
| **Phase 3: Frontend API Integration** | PR #11 (`fe78346`) | Complete | End-to-end API client, baselines, trends, alerts UI, 85 tests. |
| **Phase 4: 3D Holographic Anatomy** | PR #12 (`6d6d07b`) | Complete | Three.js R3F canvas, 2D SVG fallback, region inspector, 85 tests. |
| **Phase 5: Scientific Validation** | PR #13 (`b5bbf93`) | Complete | NASA-STD-3001 audit, clinical primacy safeguards, 14 scenario tests, 99 tests. |
| **Phase 6: System Integration** | PR #14 (`54f3cb8`) | Complete | 13 E2E workflows, symptom reporting dialog, offline hardening, 103 tests. |
| **Phase 7: UI/UX & Presentation** | PR #15 (`fb0a8b1`) | Complete | Health Cockpit, 5-point decision matrix, 10-step Judge Tour, HUD visual system. |
| **PR #10 / PR #16 Reconciliation** | PR #16 (`ce438d9`) | Complete | Baselines view, catalog view, cross-platform runner, 42 integration tests. |
| **Phase 8: Final Docs & Submission** | `feature/phase-8-...` | **In Progress** | Audited API contract, comprehensive READMEs, submission guide, 103+42 tests. |

### Verified Test Summary:
- **Backend Test Suite:** 103/103 tests passing (`pytest backend/tests`).
- **Frontend Integration Suite:** 42/42 scenarios passing (`test-integration.mjs`).
- **Frontend TypeScript Compilation:** 0 errors (`tsc --noEmit`).
- **Frontend Production Build:** 0 errors (`vite build`).

---

## 7. Architectural Decisions & Safety Safeguards

1. **Strict API Contract Enforcement:**
   Backend endpoints and frontend client adhere strictly to `docs/api/API_CONTRACT.md`. All routes are versioned under `/api/v1/`.

2. **Intra-Individual Non-Parametric Modeling:**
   COSMOLOOKUP uses individual-specific operational envelopes ($P_{50}, IQR$) rather than fixed population thresholds, accommodating physiological adaptations to microgravity (cephalad fluid shift, cardiovascular deconditioning).

3. **Clinical Primacy Principle:**
   Crew-reported subjective symptoms strictly override normal statistical telemetry. A normal vital reading never invalidates astronaut-reported symptoms (e.g. chest pain, severe headache).

4. **Absence of Telemetry Is Not Normal:**
   Stale or missing telemetry triggers explicit warning states (`stale`, `unknown`), never defaulting to nominal or healthy assumptions.

5. **Telemetry Availability Truthfulness:**
   Anatomical systems lacking wearable in-flight continuous sensors (such as ocular SANS and bone mineral density) explicitly display "Continuous Telemetry Unavailable" notices, clarifying periodic offline examination protocols.

6. **Decoupled Non-Anatomical Channels:**
   Environmental life support (ECLSS), ionizing radiation (ALARA), and cognitive readiness (PVT) are tracked in dedicated habitat channels rather than artificially forced onto anatomical organ models.

7. **Dual-Origin Data Transparency:**
   Every measurement record, baseline envelope, assessment finding, and alert includes an `is_synthetic` boolean flag, maintaining scientific honesty between real analog datasets and synthetic flight simulations.

8. **Non-Diagnostic Decision-Support Positioning:**
   COSMOLOOKUP is strictly an operational decision-support and trend-analysis tool for mission controllers and flight surgeons. It is not an autonomous diagnostic medical device and does not issue medical prescriptions.

---

## 8. Integration Rules

1. **Branching Strategy:**
   - `main`: Protected release branch. Only updated via pull requests upon final milestone completion.
   - `develop`: Active integration branch. All feature branches branch from and merge into `develop`.
   - Feature branches: `feature/<stream>-<description>`.
2. **Never Commit Secrets:**
   No tokens, API keys, `.env` files, or binary SQLite dumps in Git history.
3. **Automated Verification Gate:**
   Prior to submitting or merging any pull request, the complete test verification pipeline must pass:
   - `backend/.venv/Scripts/python -m pytest backend/tests` (103 tests)
   - `cd frontend && npm run lint` (`tsc --noEmit`)
   - `cd frontend && npm run build` (`vite build`)
   - `node frontend/scripts/test-integration.mjs` (42 integration tests)
