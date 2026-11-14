# COSMOLOOKUP — Frontend Client Application

> **Project:** COSMOLOOKUP (NASA Space Apps Challenge 2026)  
> **Role:** Member 1 — Frontend Developer & UI/UX Lead  
> **Branch:** `feature/frontend-3d-anatomy`  
> **Target Integration Branch:** `develop`  
> **Stack:** React 18+, TypeScript, Vite, Tailwind CSS, Three.js, React Three Fiber, React Three Drei, Recharts, Lucide Icons  

---

## 1. Overview & Phase 3A 3D Anatomy Explorer

The **COSMOLOOKUP** frontend is a high-reliability, web-based astronaut health telemetry observation and analysis platform. Inspired by professional aerospace mission control consoles and human research telemetry systems, it offers flight surgeons and biomedical researchers visibility into astronaut vitals, mission timelines, and data provenance across long-duration spaceflight.

In **Phase 3A (Interactive 3D Human Anatomy & Contextual Telemetry Explorer)**, the application advances from the initial 2D wireframe mockup into a genuine, interactive 3D human anatomy visualization powered by **Three.js** and **React Three Fiber (R3F)**. The 3D model operates as a primary contextual navigation anchor, dynamically connecting real-time astronaut physiological telemetry to biological systems.

### Key Capabilities

1. **Interactive 3D Biomechanical Viewport:**
   - Full 3D rendering using hardware-accelerated WebGL through `@react-three/fiber` and `@react-three/drei`.
   - Procedural, scientifically proportioned human anatomical mesh components: Cranium, Cervical Spine, Thoracic Rib Cage, Mediastinal Heart & Aorta, Bilateral Pulmonary Lobes, Core Abdominal Viscera, Pelvic Girdle, and Upper/Lower Extremities.
   - Orbit controls enabling free 360° yaw/pitch orbital rotation, smooth zooming, panning, and instant camera re-centering.
   - Smooth `CameraController` interpolating camera position and focus targets when switching anatomical regions.
   - Dual visual modes: Shaded biomechanical cyber-mesh vs. holographic wireframe matrix.
   - Dynamic real-time micro-animations (cardiac systole/diastole pulse rate and respiratory diaphragm cadence).
   - Raycasting pointer interaction (`pointerover`, `pointerout`, `click`) directly on 3D anatomical meshes.
   - `WebGLErrorBoundary` with graceful fallback for environments lacking hardware acceleration.

2. **Authoritative Anatomical Region Registry:**
   - 6 standardized anatomical regions defined in `src/components/anatomy/anatomyRegistry.ts`:
     - **Cardiovascular System** (`heart_rate`, `blood_pressure_systolic`, `blood_pressure_diastolic`)
     - **Pulmonary / Respiratory System** (`respiratory_rate`, `spo2`)
     - **Core Thermoregulation** (`body_temperature`)
     - **Head / Cranial Neuro-System** (`sleep_duration`, `spo2`)
     - **Musculoskeletal & Axial Spine** (No active sensor feeds; transparent empty state)
     - **Lower Extremities & Venous Reservoir** (No active sensor feeds; transparent empty state)
   - Adheres strictly to scientific provenance: peripheral sensors (e.g. pulse oximetry for SpO2) are clearly documented as peripheral proxies rather than direct intracranial parenchymal tissue sensors.
   - Regions with no active telemetry channels display clear, transparent status without fabricating speculative data or synthetic health scores.

3. **Contextual Region Telemetry Inspector:**
   - Positioned alongside the 3D viewport, allowing flight surgeons to inspect all mapped telemetry channels for the active body region.
   - Displays latest measured values, units, UTC timestamps, originating hardware sensor sources, data quality flags, and provenance badges (`Empirical Spaceflight` vs. `Algorithmic Synthetic`).
   - One-click navigation button ("Plot Historical Telemetry Chart") that automatically selects the metric and switches directly to the historical time-series chart view.
   - Extensibility slot for the future Personal Baseline & Trend Engine (`docs/architecture/PHASE_2_BASELINE_DESIGN.md`) without invoking unimplemented endpoints.

4. **Inclusive Accessibility & Mission Control HUD:**
   - Accessible button selector panel located outside the 3D canvas, enabling full keyboard navigation and screen-reader accessibility for all 6 anatomical regions.
   - Real-time HUD telemetry overlays showing mission subject, target coordinates, active region, and mapped channel counts.

5. **Live Backend Integration & Health Surveillance:**
   - Centralized API client consuming `/api/v1/astronauts`, `/api/v1/astronauts/{id}`, `/api/v1/astronauts/{id}/measurements`, and `/api/v1/health`.
   - Dynamic connection state tracker (`CONNECTED`, `CONNECTING`, `OFFLINE`, `ERROR`, `OFFLINE_DEMO`).
   - Standard error envelope parsing (`{ error: { code, message, details } }`).

6. **Biometric Telemetry Teleplot:**
   - Interactive time-series charts powered by Recharts with dynamic Y-axis scaling.
   - High-fidelity hover tooltips showing UTC timestamps, data quality ratings, origin sensors, and operational context.
   - Tabular raw telemetry packet inspector table with pagination and audit capabilities.

---

## 2. Prerequisites & Technology Requirements

- **Node.js:** v18.0.0+ (Tested on Node.js v24.19.0)
- **Python:** v3.11+ (For running the local FastAPI backend service)
- **Package Manager:** `npm` (v9.0.0+) or `pnpm`
- **Modern Browser:** Chrome, Edge, Firefox, or Safari with WebGL 2.0 / OpenGL ES 3.0 support

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
Compiles TypeScript and bundles production assets into `frontend/dist/` with optimized chunk splitting (`vendor`, `three`, `charts`, `icons`).

### 5. Strict Type & Quality Checks
```bash
npm run lint
```
Executes strict TypeScript compilation (`tsc --noEmit`) with 0 type errors.

### 6. Run Automated Integration Tests
```bash
npm run test:integration
```
Executes 13 automated end-to-end integration tests verifying backend connectivity, schema compliance, telemetry reconciliation, pagination, error envelopes, and synthetic provenance flags.

---

## 4. 3D Anatomy Architecture & Component Structure

```
frontend/src/components/anatomy/
├── anatomyRegistry.ts           # Authoritative definitions of the 6 anatomical regions, camera vectors, colors, and telemetry bindings
├── Human3DModel.tsx             # Procedural 3D anatomical model (Three.js & R3F meshes, raycasting pointer events, micro-animations)
├── AnatomyScene.tsx             # 3D Canvas container with lighting, grid floor, OrbitControls, CameraController, and WebGL error boundary
├── RegionTelemetryInspector.tsx # Side inspection panel with channel switching, latest values, provenance, empty states, and chart navigation
└── AnatomyViewport.tsx          # Main view orchestrator uniting HUD toolbar, 3D viewport, accessible region buttons, and telemetry inspector
```

### Anatomical Region Mapping Summary

| Anatomical Region | Target Mesh Group | Mapped Telemetry Metrics | Primary Hardware Sensor | Notes |
|---|---|---|---|---|
| **Cardiovascular System** | Mediastinal Heart, Aorta, Thoracic Cavity | `heart_rate`, `blood_pressure_systolic`, `blood_pressure_diastolic` | BioHarness Band & Ambulatory Cuff | Ventricular rate & systemic hemodynamic load |
| **Pulmonary / Respiratory** | Bilateral Lung Lobes, Trachea | `respiratory_rate`, `spo2` | BioHarness Band & Pulse Oximeter | SpO2 documented as peripheral capillary proxy |
| **Core Thermoregulation** | Abdominal Viscera, Sensor Capsule | `body_temperature` | Ingestible Thermal Core Pill | Deep visceral temperature in GI tract |
| **Cranial Neuro-System** | Cranium, Cerebrum, Cervical | `sleep_duration`, `spo2` | Sleep Staging & Actigraphy | Circadian rest duration; SpO2 proxy |
| **Musculoskeletal & Spine** | Axial Spine, Pelvic Girdle, Ribs | *(None)* | *(None)* | Transparent empty state; 0 fake metrics |
| **Lower Extremities** | Femur, Tibia, Calves, Feet | *(None)* | *(None)* | Microgravity cephalad shift zone; 0 fake metrics |

---

## 5. Reconciled Measurement Types

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

## 6. Strict API Contract Adherence

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
