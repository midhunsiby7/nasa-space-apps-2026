# COSMOLOOKUP — Project State & Architectural Blueprint

> **Project:** COSMOLOOKUP (NASA Space Apps Challenge 2026)  
> **Status:** Phase 0 — Foundation & Repository Initialization  
> **Last Updated:** 2026-11-14  

---

## 1. Project Overview

**COSMOLOOKUP** is an integrated mission telemetry and astronaut health observation platform built for the NASA Space Apps Challenge 2026. During extended deep-space exploration (such as Artemis lunar missions and planned Mars transits), continuous monitoring and rapid cross-referencing of astronaut physiological vitals, environmental factors, and mission timelines are critical for crew well-being and operational safety.

COSMOLOOKUP provides:
- Centralized exploration of astronaut profiles and crew assignments across deep-space missions.
- Time-series tracking and visualization of physiological vitals (heart rate, blood oxygen, core body temperature) and operational metrics (radiation exposure, cabin environmental factors).
- Dual-origin data transparency: clear distinction between verified empirical research data and synthetic physiological simulation models.
- An intuitive, responsive interface coupled with a high-performance RESTful API.

---

## 2. Team Responsibilities

To ensure parallel development and clear separation of concerns, team responsibilities are partitioned as follows:

| Role | Domain | Primary Responsibilities |
|---|---|---|
| **Project Architect & Backend Lead** | System Architecture & Backend Service | - System architecture, database schema design, and API contract governance.<br>- Backend service implementation (FastAPI, ORM, data validation).<br>- Integration integrity, data access optimization, and unit testing.<br>- Repository hygiene, merge reviews, and API consistency. |
| **Frontend Developer & UI/UX Lead** | Web Client & Visualizations | - Modern SPA dashboard interface (React, Vite, Tailwind CSS).<br>- Visual analytics: interactive time-series charts, mission day scrubbers, astronaut directories.<br>- Client-side API consumption adhering strictly to `API_CONTRACT.md`.<br>- Responsive design, accessibility, and intuitive telemetry exploration. |
| **Research & Data Specialist** | Domain Research & Data Pipelines | - Investigation of NASA physiological research and biomedical telemetry standards.<br>- Sourcing empirical datasets (e.g., NASA Life Sciences Data Archive, analog mission vitals).<br>- Formulation of realistic synthetic data generation models for long-duration spaceflight.<br>- Population and verification of data sets in `data/research/` and `data/synthetic/`. |

---

## 3. Technology Stack

The stack is intentionally selected for fast iteration, lightweight deployment, strong typing, and minimal developer friction:

### Backend & API
- **Language:** Python 3.11+
- **Web Framework:** FastAPI (high performance, native async, automatic OpenAPI documentation)
- **Data Validation & Serialization:** Pydantic v2
- **ORM / Database Layer:** SQLAlchemy 2.0 / SQLModel (lightweight declarative mappings)
- **ASGI Server:** Uvicorn

### Frontend
- **Framework:** React 18+ with TypeScript
- **Tooling & Bundler:** Vite
- **Styling:** Tailwind CSS
- **Data Visualization:** Chart.js / Recharts (for telemetry and time-series biometric charts)
- **HTTP Client:** Axios or native Fetch API

### Data & Storage
- **Development Database:** SQLite 3 (zero configuration, self-contained for local dev)
- **Production Target:** PostgreSQL (compatible schema for containerized/cloud deployments)
- **Data Formats:** CSV, JSON, Parquet for raw research and synthetic datasets

### Collaboration & Version Control
- **VCS:** Git & GitHub
- **Branching Model:** Git Flow (`main`, `develop`, and scoped feature branches)

---

## 4. Architecture Overview

COSMOLOOKUP follows a decoupled three-tier architecture:

```
┌──────────────────────────────────────────────────────────┐
│                   Frontend Client (SPA)                  │
│       React + TypeScript + Vite + Tailwind CSS           │
│   (Astronaut Directory, Telemetry Charts, Timeline)      │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTP / JSON (REST API)
                             ▼
┌──────────────────────────────────────────────────────────┐
│                    Backend API Service                   │
│                     FastAPI + Pydantic                   │
│   (Route Handlers, Data Serialization, Business Logic)   │
└────────────────────────────┬─────────────────────────────┘
                             │ SQLAlchemy / SQLModel
                             ▼
┌──────────────────────────────────────────────────────────┐
│                    Data Storage Layer                    │
│                 SQLite (Dev) / PostgreSQL                │
│  [Astronauts Table] ◄── 1:N ──► [Measurements Table]     │
└──────────────────────────────────────────────────────────┘
```

- **Client Tier:** Interacts with the backend exclusively via standard REST JSON calls specified in `API_CONTRACT.md`.
- **Service Tier:** Validates all queries and parameters, enforces business logic, and yields standardized JSON responses.
- **Data Tier:** Relational storage modeling astronauts and high-frequency time-series measurements with indexed query paths.

---

## 5. Development Phases

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Phase 0  │ ──► │  Phase 1  │ ──► │  Phase 2  │ ──► │  Phase 3  │ ──► │  Phase 4  │
│Foundations│     │ Data/DB   │     │ Backend   │     │ Frontend  │     │Integration│
└───────────┘     └───────────┘     └───────────┘     └───────────┘     └───────────┘
```

1. **Phase 0 — Foundation & Repository Initialization (Current Phase):**
   - Establish directory structures and tracking.
   - Author foundational contracts (`PROJECT_STATE.md`, `API_CONTRACT.md`, `DATABASE_SCHEMA.md`).
   - Configure `.gitignore` and `README.md`.
   - Initialize and synchronize `main` and `develop` git branches.

2. **Phase 1 — Data Ingestion & Database Modeling:**
   - Implement database entities in Python based on `DATABASE_SCHEMA.md`.
   - Research real-world flight telemetry ranges; write synthetic data generator scripts.
   - Seed database with baseline astronaut profiles and telemetry measurements.

3. **Phase 2 — Core Backend API Implementation:**
   - Implement the three agreed endpoints in FastAPI.
   - Add unit and integration tests for route responses and error handling.
   - Auto-generate interactive Swagger/OpenAPI documentation (`/docs`).

4. **Phase 3 — Frontend Dashboard & Visualizations:**
   - Scaffold the React + Vite frontend application.
   - Implement astronaut profile cards, search, and detail views.
   - Build interactive biometric telemetry time-series charts.

5. **Phase 4 — Integration, Polish & Presentation:**
   - Connect frontend directly to the running backend service.
   - End-to-end testing, error boundary handling, and latency optimization.
   - Prepare final documentation, project presentation, and demonstration videos.

---

## 6. Current Progress

- [x] Initialized root directory structure (`frontend/`, `backend/`, `data/`, `docs/`).
- [x] Configured unified `.gitignore` covering Python, Node.js, SQLite, IDEs, and environments.
- [x] Created authoritative API contract (`docs/api/API_CONTRACT.md`).
- [x] Created authoritative database schema specification (`docs/architecture/DATABASE_SCHEMA.md`).
- [x] Established project status tracking (`docs/PROJECT_STATE.md`).
- [x] Authored repository entry point (`README.md`).
- [x] Implemented Phase 1 Backend API (astronaut and measurement telemetry endpoints, seed data, 17 automated tests).
- [x] Implemented Phase 1 Frontend UI (astronaut roster, biometrics detail, time-series charts).
- [x] Approved Phase 2 Architecture (`docs/architecture/PHASE_2_BASELINE_DESIGN.md`).
- [x] Implemented Phase 2A Measurement Foundation (Catalog, Normalization, Context Taxonomy, Modality Isolation, Comparability Rules).
- [x] Implemented Phase 2B Personal Baseline Calculation Engine (Robust non-parametric statistics, Personal Operational Envelopes, API endpoints, 63 automated tests).
- [x] Implemented Phase 2C Baseline Lifecycle & Maturity Management (Preflight immutability, in-flight versioning, criteria snapshots, 4 API endpoints).
- [x] Implemented Phase 2D Trend Intelligence & Freshness Engine (Sen's slope rate-of-change, robust Z-scores, consecutive run-rules, staleness intervals, 3 API endpoints).
- [x] Implemented Phase 2E Explainable Health Assessment & Alerts (Multi-tier attention classifications, transparent explanations, safe non-diagnostic guidance, alert deduplication & lifecycle, 8 API endpoints, 81 automated tests).
- [x] Implemented Phase 3 Frontend–Backend Integration (Centralized API client, personal baselines UI, trend velocity indicators, explainable assessments, alerts hub with operator lifecycle, clinical primacy guardrails, `docs/development/PHASE_3_FRONTEND_INTEGRATION.md`).
- [x] Implemented Phase 4 Interactive 3D Anatomy Navigation Experience (Three.js & React Three Fiber canvas, procedural anatomical model, OrbitControls with camera director, 2D schematic SVG fallback, WebGL error boundary, region telemetry inspector, non-anatomical telemetry drawer, clinical & scientific guardrails, `docs/development/PHASE_4_3D_ANATOMY.md`).
- [x] Synchronized and Reconciled PR #10 (eature/frontend-baseline-insights) with develop (6d6d07b), integrating 3D anatomy with personal baseline and catalog navigation links, isolated test database fixtures, and 42/42 automated integration assertions.
- [ ] Phase 5: Mission Intelligence & Operations Experience (Governing gate: pending final review and merge of PR #10 into develop).

---

## 7. Important Decisions

1. **Strict API Contract Enforcement:**
   Backend and frontend developers must abide by the schemas defined in `docs/api/API_CONTRACT.md`. Neither team may alter route structures, parameters, or field names without an agreed update to the contract document.

2. **Lightweight & Self-Contained:**
   Development relies on SQLite to ensure zero-friction onboarding for all team members (no external database server required to get started).

3. **Telemetry Provenance (`is_synthetic`):**
   Every measurement record includes an `is_synthetic` boolean and a `source` descriptor to ensure complete scientific transparency between real analog/spaceflight datasets and synthetic generated points.

4. **Single Source of Truth for Models:**
   Pydantic schemas and database tables derive from `DATABASE_SCHEMA.md`.

5. **Versioned REST API:**
   All routes are prefixed with `/api/v1/` to allow seamless future extensions.

---

## 8. Integration Rules

1. **Branching Strategy:**
   - `main`: Protected release branch. Only merged via pull requests from `develop` upon milestone completion.
   - `develop`: Primary integration branch. All feature branches branch off and merge into `develop`.
   - Feature branches: Named with conventional prefixes:
     - `feature/backend-<feature-name>`
     - `feature/frontend-<feature-name>`
     - `feature/research-<feature-name>`
2. **Never Commit Secrets:**
   Do not commit API tokens, passwords, `.env` files, or proprietary raw datasets. Use `.env.example` templates.
3. **No Breaking Changes Without Notice:**
   Any modification to `API_CONTRACT.md` or `DATABASE_SCHEMA.md` requires discussion and explicit agreement before code modification.
4. **Code Quality Standards:**
   - Python code must pass formatting (`black`/`ruff`) and basic typing checks.
   - Frontend code must pass TypeScript compilation and lint checks.
   - Merges into `develop` require working unit/integration verification.
