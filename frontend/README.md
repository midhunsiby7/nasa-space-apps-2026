# COSMOLOOKUP — Frontend Client Application

> **Project:** COSMOLOOKUP (NASA Space Apps Challenge 2026)  
> **Role:** Member 1 — Frontend Developer & UI/UX Lead  
> **Branch:** `feature/frontend-integration`  
> **Target Integration Branch:** `develop`  
> **Stack:** React 18+, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons  

---

## 1. Overview & Phase 2 Integration

The **COSMOLOOKUP** frontend is a high-reliability, web-based astronaut health telemetry observation and analysis platform. Inspired by professional aerospace mission control systems and biomedical monitoring consoles, it offers flight surgeons and researchers visibility into astronaut vitals, mission timelines, and data provenance across deep-space missions.

In **Phase 2 (Frontend–Backend Integration)**, the frontend has been connected to the live FastAPI REST service, reconciling data types, establishing dynamic metric discovery, and ensuring scientific transparency between synthetic and empirical data records.

### Key Capabilities

1. **Live Backend Integration & Health Surveillance:**
   - Centralized API client consuming `/api/v1/astronauts`, `/api/v1/astronauts/{id}`, `/api/v1/astronauts/{id}/measurements`, and `/api/v1/health`.
   - Dynamic connection state tracker (`CONNECTED`, `CONNECTING`, `OFFLINE`, `ERROR`, `OFFLINE_DEMO`).
   - Timeout and standard error envelope parsing (`{ error: { code, message, details } }`).
2. **Telemetry Reconciliation & Dynamic Metrics:**
   - Reconciles the 7 seeded backend metrics (`heart_rate`, `spo2`, `body_temperature`, `respiratory_rate`, `blood_pressure_systolic`, `blood_pressure_diastolic`, `sleep_duration`) without modifying raw data records.
   - Dynamic metric selector generated from the actual telemetry types present in the loaded dataset.
   - Missing or unseeded metrics (e.g. `radiation_dose`) are omitted cleanly rather than fabricated.
3. **Mission Control Dashboard:**
   - Centralized flight status, mission day counters, crew telemetry summaries, and system integrity indicators derived from live database records.
4. **Astronaut Roster Directory:**
   - Real-time crew search by name, role, or astronaut ID.
   - Mission-level filtering (e.g., `AURORA-1`).
   - Detailed astronaut specification modal adhering to API Contract v1.0.
5. **Biometric Telemetry Teleplot:**
   - Interactive time-series charts powered by Recharts with dynamic Y-axis scaling.
   - High-fidelity hover tooltips showing UTC timestamps, data quality ratings, origin sensors, and operational context.
   - Raw telemetry packet inspector table with tabular audit capabilities.
6. **Data Provenance & Scientific Integrity:**
   - Prominent badges distinguishing between **Empirical Spaceflight Data** (`is_synthetic: false`) and **Algorithmic Synthetic Simulations** (`is_synthetic: true`).
   - Explicit disclaimer that the application provides observational analysis and does not deliver clinical diagnoses.
7. **3D Anatomy Viewport Prototype:**
   - Interactive anatomical zone selection (Cranial/SpO2, Cardiopulmonary/HR, Core/Temp, Respiratory) and rotational perspective controls.
   - Component boundary prepared for future Three.js / React Three Fiber `<Canvas />` integration.

---

## 2. Prerequisites & Technology Requirements

- **Node.js:** v18.0.0+ (Tested on Node.js v24.19.0)
- **Python:** v3.11+ (For running the local backend service)
- **Package Manager:** `npm` (v9.0.0+) or `pnpm`
- **Modern Browser:** Chrome, Edge, Firefox, or Safari with WebGL / CSS Grid support

---

## 3. Installation & Local Development

### 1. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
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
The client launches locally at `http://localhost:5173`.

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

### 6. Run Automated Integration Tests
```bash
npm run test:integration
```
Launches the local FastAPI backend and executes 13 automated integration tests verifying health checks, astronaut lookups, measurement pagination, metric filtering, error envelopes, and synthetic provenance flags.

---

## 4. Reconciled Measurement Types

The frontend presentation registry maps raw backend measurement records to human-readable labels and aerospace color tokens while strictly preserving raw types and units:

| Backend `measurement_type` | Backend `unit` | Display Label | Originating Sensor / Study |
|---|---|---|---|
| `heart_rate` | `bpm` | Heart Rate | BioHarness Telemetry Band |
| `spo2` | `%` | Blood Oxygen (SpO2) | Pulse Oximeter Optical Band |
| `body_temperature` | `celsius` | Body Temperature | Ingestible Thermal Core Sensor |
| `respiratory_rate` | `breaths/min` | Respiratory Rate | BioHarness Telemetry Band |
| `blood_pressure_systolic` | `mmHg` | Systolic Blood Pressure | Ambulatory Blood Pressure Cuff |
| `blood_pressure_diastolic` | `mmHg` | Diastolic Blood Pressure | Ambulatory Blood Pressure Cuff |
| `sleep_duration` | `hours` | Sleep Duration | Sleep Staging Algorithm |

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
4. **`GET /api/v1/health`** (or `/health`)  
   - Response Payload: `{ status: "healthy", app: string, version: string, environment: string }`

If the backend service is offline or unreachable, the client displays an explicit `BACKEND OFFLINE` status with options to re-attempt connection or launch an isolated **Offline Demo Mode** utilizing verified synthetic demonstration data without throwing unhandled exceptions.
