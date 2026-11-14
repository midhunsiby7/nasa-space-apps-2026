# COSMOLOOKUP — Backend Service API

> **Service:** COSMOLOOKUP REST API  
> **Framework:** FastAPI / SQLAlchemy 2.0 / Pydantic v2  
> **Database:** SQLite (local development) / PostgreSQL compatible  
> **Author:** Senior Backend Developer  

---

## 1. Overview

The COSMOLOOKUP backend service delivers the telemetry, observational health analytics, and astronaut directory APIs for the NASA Space Apps Challenge 2026. Built on FastAPI and SQLAlchemy 2.0, the service enforces strict schema typing, lightweight resource usage, and comprehensive data provenance tracking (`is_synthetic`).

---

## 2. Prerequisites

- **Python:** `3.11` or higher (verified on Python `3.12.3`)
- **Git:** `2.30+`
- **Virtual environment tool:** Standard Python `venv`

---

## 3. Environment Setup & Dependency Installation

### Step 1: Navigate to the backend directory
```bash
cd backend
```

### Step 2: Create a local virtual environment
```bash
# Windows
python -m venv .venv
.\.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

---

## 4. Configuration

The application uses Pydantic Settings for centralized environment-based configuration.

1. Copy the example environment template:
   ```bash
   cp .env.example .env
   # Or on Windows PowerShell:
   Copy-Item .env.example .env
   ```
2. Available Configuration Keys:
   | Variable | Default Value | Description |
   |---|---|---|
   | `PROJECT_NAME` | `"COSMOLOOKUP API"` | Application title in OpenAPI docs |
   | `API_V1_STR` | `"/api/v1"` | URL prefix for version 1 API endpoints |
   | `ENVIRONMENT` | `"development"` | Runtime environment indicator |
   | `DATABASE_URL` | `"sqlite:///./cosmolookup.db"` | SQLAlchemy database connection URI |
   | `CORS_ORIGINS` | `"http://localhost:3000,http://localhost:5173"` | Comma-separated list of allowed web client origins |

> [!NOTE]
> Database files (`*.db`, `*.sqlite`) and local `.env` files are ignored by `.gitignore` and must never be committed.

---

## 5. Database Initialization & Seeding

### Automatic Initialization
The application automatically creates required SQLite tables when the FastAPI server starts up or when the seed script runs.

### Running the Seed Script
To populate the database with a fictional astronaut profile (`Alex Morgan`, `astro-001`) and 25 representative synthetic telemetry observations (heart rate, blood pressure, body temperature, SpO2, respiratory rate, sleep duration):

```bash
# From the backend directory with .venv active:
python -m app.seed
```

> [!IMPORTANT]
> The seed script is completely **idempotent**. Re-running it will not generate duplicate records. All seeded telemetry points strictly maintain `is_synthetic = True` for clinical transparency.

---

## 6. Running the Server

Start the development server with live reload:

```bash
# From the backend directory:
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`.

---

## 7. Interactive API Documentation

FastAPI provides interactive API exploration interfaces:

- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Raw OpenAPI Schema:** [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

---

## 8. Running Automated Tests

The test suite runs against an isolated in-memory SQLite database (`sqlite:///:memory:`) using Pytest and FastAPI's `TestClient`. Tests never write to or modify your local development database.

Execute all tests:
```bash
# From the backend directory with .venv active:
pytest tests -v
```

Test coverage includes:
- System health checks (`/health` and `/api/v1/health`)
- Astronaut directory listing, mission filtering, and pagination
- Individual astronaut lookup by ID and HTTP 404 error handling
- Astronaut telemetry retrieval, metric type filtering, and ISO 8601 timestamp range filtering
- Isolation of measurements across astronauts
- Preservation of synthetic provenance (`is_synthetic = True`)
- Rejection of invalid query parameters with standard error envelopes

---

## 9. API Endpoints Reference

Base Path: `/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health and operational status |
| `GET` | `/api/v1/astronauts` | Paginated list of astronauts, filterable by `mission_name` |
| `GET` | `/api/v1/astronauts/{astronaut_id}` | Detailed profile of an astronaut by ID |
| `GET` | `/api/v1/astronauts/{astronaut_id}/measurements` | Time-series telemetry readings filterable by metric and timestamp |

Refer to [docs/api/API_CONTRACT.md](../docs/api/API_CONTRACT.md) for full request/response schemas.
