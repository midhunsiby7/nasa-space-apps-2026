# COSMOLOOKUP — Frontend Client Application

> **Project:** COSMOLOOKUP (NASA Space Apps Challenge 2026)  
> **Role:** Member 1 — Frontend Developer & UI/UX Lead  
> **Branch:** `feature/frontend-dashboard`  
> **Stack:** React 18+, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons  

---

## 1. Overview

The **COSMOLOOKUP** frontend is a high-reliability, web-based astronaut health telemetry observation and analysis platform. Inspired by professional aerospace mission control systems and biomedical monitoring consoles, it offers flight surgeons and researchers real-time visibility into astronaut vitals, mission timelines, and data provenance across long-duration spaceflights.

### Key Capabilities

1. **Mission Control Dashboard:**
   - Centralized flight status, mission day counters, crew telemetry summaries, and system integrity indicators.
2. **Astronaut Roster Directory:**
   - Real-time crew search by name, role, or astronaut ID.
   - Filtering across spaceflight missions (e.g., Artemis VII, Mars Transit-1, ISS Expedition 74).
   - Detailed astronaut specification modal strictly adhering to API Contract v1.0.
3. **Biometric Telemetry Teleplot:**
   - Interactive time-series charts powered by Recharts for vital signs (`heart_rate`, `blood_oxygen`, `core_temperature`, `radiation_dose`).
   - High-fidelity hover tooltips showing UTC timestamps, data quality ratings, origin sensors, and operational context.
   - Raw telemetry packet inspector table with tabular audit capabilities.
4. **Mission Timeline Scrubber:**
   - Mission elapsed day context (e.g., D+42).
   - Time-window filtering (Recent 8h, 24h Window, All Historical Points).
5. **Data Provenance & Scientific Integrity:**
   - Visual badges and filters distinguishing between **Empirical Spaceflight Data** (`is_synthetic: false`) and **Algorithmic Synthetic Simulations** (`is_synthetic: true`).
   - Explicit disclaimer that the application provides observational analysis and does not deliver clinical diagnoses.
6. **3D Anatomy Viewport Architecture:**
   - Prepared layout and component boundary (`AnatomyViewport`) with interactive anatomical zone selection (Cranial, Cardiopulmonary, Core, Systemic Dose) and rotation yaw controls.
   - Ready for direct React Three Fiber / Three.js `<Canvas>` injection.
7. **Resilient Offline / Demo Mode:**
   - Fully functional contract-compliant synthetic demonstration fallback when the backend service is offline.

---

## 2. Prerequisites & Technology Requirements

- **Node.js:** v18.0.0+ (Tested on Node.js v24.19.0)
- **Package Manager:** `npm` (v9.0.0+) or `pnpm`
- **Modern Browser:** Chrome, Edge, Firefox, or Safari with WebGL / CSS Grid support

---

## 3. Installation & Local Development

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Variables Configuration
Copy the example environment configuration:
```bash
cp .env.example .env
```

Available environment variables:

| Variable | Description | Default Value |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL for backend REST API endpoints | `http://localhost:8000/api/v1` |

### 3. Start Development Server
```bash
npm run dev
```
The client will launch locally at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Generates optimized, bundled static assets in `frontend/dist/`.

### 5. Type & Quality Checks
```bash
npm run lint
```
Runs strict TypeScript compilation checks (`tsc --noEmit`).

---

## 4. Frontend Architecture & Folder Structure

```
frontend/
├── public/                 # Static assets and favicon
├── src/
│   ├── assets/             # Brand logos and vector graphics
│   ├── components/
│   │   ├── anatomy/        # 3D anatomy viewport and interactive wireframe mannequin
│   │   │   └── AnatomyViewport.tsx
│   │   ├── astronaut/      # Crew roster directory, cards, and modal specifications
│   │   │   ├── AstronautCard.tsx
│   │   │   ├── AstronautDirectory.tsx
│   │   │   └── AstronautProfileModal.tsx
│   │   ├── charts/         # Recharts time-series telemetry plots and custom tooltips
│   │   │   └── TelemetryTimeSeriesChart.tsx
│   │   ├── common/         # Atomic UI primitives (Badges, Spinners, Error messages)
│   │   │   ├── Badge.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── dashboard/      # Top-level mission status, vitals banner, provenance notice
│   │   │   ├── MissionOverview.tsx
│   │   │   ├── ProvenanceNotice.tsx
│   │   │   └── SelectedAstronautBanner.tsx
│   │   ├── layout/         # App shell, persistent navigation, header with UTC mission clock
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── Sidebar.tsx
│   │   └── telemetry/      # Metric channel cards, scrubber, and raw packet table
│   │       ├── MissionDayScrubber.tsx
│   │       ├── TelemetryMetricCard.tsx
│   │       └── TelemetryStreamSection.tsx
│   ├── services/
│   │   ├── apiClient.ts    # Authoritative API client with offline demo fallback
│   │   └── demoData.ts     # Contract-compliant synthetic & empirical demo datasets
│   ├── styles/
│   │   └── index.css       # Tailwind CSS directives, space palette, and HUD styling
│   ├── types/
│   │   ├── api.ts          # Request/response interfaces and error models
│   │   ├── astronaut.ts    # Strict Astronaut entity definitions
│   │   └── measurement.ts  # Strict Measurement entity and DataQuality types
│   ├── utils/
│   │   └── formatters.ts   # Metric metadata, UTC timestamp, and quality badge formatters
│   ├── App.tsx             # Central state coordinator and module router
│   ├── main.tsx            # React application entry point
│   └── vite-env.d.ts       # Vite client TypeScript definitions
├── index.html              # HTML5 template
├── package.json            # Scripts and dependencies
├── postcss.config.js       # PostCSS plugins
├── tailwind.config.js      # Aerospace color tokens and theme extensions
├── tsconfig.json           # Bundler TypeScript configuration
├── tsconfig.node.json      # Node TypeScript configuration
└── vite.config.ts          # Vite build and proxy settings
```

---

## 5. Strict API Contract Adherence

All HTTP queries target endpoints defined in [docs/api/API_CONTRACT.md](../docs/api/API_CONTRACT.md):

1. **`GET /api/v1/astronauts`**  
   - Query Parameters: `mission_name`, `limit`, `offset`
   - Response Payload: `{ data: Astronaut[], total: number, limit: number, offset: number }`
2. **`GET /api/v1/astronauts/{astronaut_id}`**  
   - Path Parameters: `astronaut_id`
   - Response Payload: `Astronaut` (`id`, `name`, `crew_role`, `mission_name`, `mission_day`, `created_at`)
3. **`GET /api/v1/astronauts/{astronaut_id}/measurements`**  
   - Path Parameters: `astronaut_id`
   - Query Parameters: `measurement_type`, `start_time`, `end_time`, `limit`, `offset`
   - Response Payload: `{ astronaut_id: string, data: Measurement[], total: number, limit: number, offset: number }`

If the backend service is offline or unreachable, the client automatically switches to **Offline Demo Mode**, providing a seamless, fully interactive demonstration utilizing verified synthetic test data without throwing unhandled exceptions.
