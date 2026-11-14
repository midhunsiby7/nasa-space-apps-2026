# COSMOLOOKUP — NASA Space Apps 2026

[![NASA Space Apps Challenge 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-blue.svg)](https://www.spaceappschallenge.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Architecture: 3--Tier Decoupled](https://img.shields.io/badge/Architecture-3--Tier%20Decoupled-success.svg)]()

> **COSMOLOOKUP** is an astronaut health telemetry, mission biometrics observation, and physiological analytics platform developed for the NASA Space Apps Challenge 2026.

---

## 1. Project Introduction

During long-duration space exploration—from Lunar Artemis surface habitats to deep-space transits—monitoring and interpreting astronaut physical and operational health is mission-critical. **COSMOLOOKUP** provides flight surgeons, mission planners, and researchers with an intuitive platform to track, inspect, and analyze multidimensional telemetry data across mission timelines.

Key features include:
- **Astronaut Roster & Profile Directory:** Direct lookup of crew members, mission roles, and flight elapsed days.
- **Biometric & Environmental Telemetry:** Ingestion, querying, and visualization of vital signs (heart rate, core temperature, SpO2) and habitat context (radiation exposure, operational workload).
- **Dual-Source Fidelity:** Clear separation and transparency between empirical spaceflight data and algorithmic synthetic simulation data.
- **Modular REST API:** High-speed endpoints designed around a strict, versioned API contract.

---

## 2. Technology Stack

COSMOLOOKUP utilizes a modern, typed, lightweight stack engineered for rapid iteration and rock-solid reliability:

| Tier | Technologies |
|---|---|
| **Frontend** | React 18+, TypeScript, Vite, Tailwind CSS, Recharts / Chart.js |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy 2.0 / SQLModel |
| **Database** | SQLite (zero-setup development), PostgreSQL compatible |
| **Data & Research** | Python (Pandas, NumPy), JSON / CSV telemetry datasets |
| **Tooling & Docs** | Git / GitHub Flow, OpenAPI / Swagger, Markdown specifications |

---

## 3. Repository Structure

```
nasa-space-apps-2026/
│
├── frontend/               # Web client application (React + Vite + Tailwind CSS)
│   └── .gitkeep
│
├── backend/                # REST API service (FastAPI + SQLAlchemy)
│   └── .gitkeep
│
├── data/                   # Data sources and generation pipelines
│   ├── synthetic/          # Synthetic biometric generation scripts and mock data
│   │   └── .gitkeep
│   └── research/           # Real-world empirical flight research data and references
│       └── .gitkeep
│
├── docs/                   # Authoritative project documentation & contracts
│   ├── architecture/       # Architecture blueprints and database models
│   │   └── DATABASE_SCHEMA.md
│   ├── api/                # API contracts and endpoint documentation
│   │   └── API_CONTRACT.md
│   ├── research/           # Scientific notes, papers, and NASA reference material
│   │   └── .gitkeep
│   ├── development/        # Developer onboarding guides and workflows
│   │   └── .gitkeep
│   └── PROJECT_STATE.md    # Living project state, team roadmap, and decisions
│
├── README.md               # Project root overview and onboarding guide
└── .gitignore              # Unified ignore configuration for Python, Node, & DBs
```

---

## 4. Team Responsibilities

To enable efficient parallel development, responsibilities are organized across three primary roles:

- **Project Architect & Backend Developer:**
  - System architecture, database schemas, and REST API contract management.
  - Backend API development with FastAPI, data validation, and query performance.
  - Integration testing and repository quality control.
- **Frontend Developer & UI/UX Lead:**
  - Modern, responsive single-page web client built with React, Vite, and Tailwind CSS.
  - Dynamic charts, mission day scrubbing, astronaut profile cards, and telemetry visualization.
  - Client-side integration adhering strictly to [docs/api/API_CONTRACT.md](docs/api/API_CONTRACT.md).
- **Research & Data Specialist:**
  - NASA data exploration (Life Sciences Data Archive, analog mission telemetry).
  - Synthetic data generation modeling for spaceflight vitals under various mission stresses.
  - Data curation in `data/research/` and `data/synthetic/`.

---

## 5. Initial Setup Instructions

### Prerequisites
- **Git** 2.30+
- **Python** 3.11+
- **Node.js** 18+ and `npm`

### Cloning the Repository
```bash
git clone https://github.com/midhunsiby7/nasa-space-apps-2026.git
cd nasa-space-apps-2026
```

### Checking out the Integration Branch
All active development branches off `develop`:
```bash
git checkout develop
```

### Documentation & Contract Reference
Before writing code, review the core architectural contracts:
- [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) — Comprehensive project status, roadmap, and design choices.
- [docs/api/API_CONTRACT.md](docs/api/API_CONTRACT.md) — Exact specifications for all `/api/v1` routes and payloads.
- [docs/architecture/DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) — Data models, relationships, types, and constraints.

---

## 6. Development Workflow

We follow a structured Git Flow model to ensure parallel streams do not collide:

```
main (protected production releases)
  │
  └── develop (main integration branch)
        │
        ├── feature/backend-<feature-name>
        ├── feature/frontend-<feature-name>
        └── feature/research-<feature-name>
```

### Branching Rules
1. **Never commit directly to `main` or `develop`.**
2. Always branch off `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/<team-prefix>-<short-description>
   ```
3. Prefix branch names according to your work stream:
   - `feature/backend-...`
   - `feature/frontend-...`
   - `feature/research-...`

### Pull Request & Integration Protocol
1. **Adherence to Contracts:**
   Ensure backend implementations match [docs/api/API_CONTRACT.md](docs/api/API_CONTRACT.md) and frontend requests use those exact formats.
2. **No Secrets or Bloat:**
   Never commit `.env` files, credentials, or large local database dumps (`.sqlite`, `.db`).
3. **Review & Merge:**
   Open a Pull Request into `develop` for peer review before merging.
