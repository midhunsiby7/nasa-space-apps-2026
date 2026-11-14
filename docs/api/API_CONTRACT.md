# COSMOLOOKUP API Contract — Specification v1.0

> **Project:** COSMOLOOKUP (NASA Space Apps Challenge 2026)  
> **Status:** Agreed & Authoritative (Synchronized with Phase 8 Implementation)  
> **Base URL:** `/api/v1`  
> **Protocol:** HTTP/1.1 or HTTP/2  
> **Content-Type:** `application/json`  
> **Last Updated:** 2026-11-14  

This document serves as the binding contract between backend services and frontend clients for COSMOLOOKUP. All schemas derive directly from the Pydantic v2 models in `backend/app/schemas/` and the FastAPI routers in `backend/app/api/v1/endpoints/`.

---

## 1. Global Architectural Standards

### 1.1 Success Response Structure
- Single-entity endpoints deliver the resource object directly with an HTTP `200 OK`.
- Collection endpoints return an envelope containing:
  - `astronaut_id` (when scoped to a specific crew member)
  - `data` (an array of serialized resource models)
  - `total` (integer total count of matching records)
  - `limit` and `offset` (when paginated)

### 1.2 Error Response Envelope
Every error response returns an appropriate HTTP status code (`4xx` or `5xx`) and a consistent error envelope:

```json
{
  "error": {
    "code": "ASTRONAUT_NOT_FOUND",
    "message": "Astronaut with id 'astro-999' not found.",
    "details": {
      "astronaut_id": "astro-999"
    }
  }
}
```

Standard Status Codes:
- `200 OK`: Request succeeded.
- `400 Bad Request`: Validation failure or ineligible request (`INVALID_QUERY_PARAMETER`, `INELIGIBLE_BASELINE_CONTEXT`).
- `404 Not Found`: Requested resource does not exist (`ASTRONAUT_NOT_FOUND`, `BASELINE_NOT_FOUND`, `ASSESSMENT_NOT_FOUND`, `ALERT_NOT_FOUND`).
- `409 Conflict`: State conflict (`PREFLIGHT_BASELINE_FINALIZED`).
- `422 Unprocessable Entity`: Insufficient data for computation (`INSUFFICIENT_MEASUREMENTS`).
- `500 Internal Server Error`: Server exception (`INTERNAL_SERVER_ERROR`).

### 1.3 Scientific and Safety Guarantees
1. **Non-Diagnostic Tooling:** All health assessments, baseline calculations, and alerts are operational decision-support indicators. They do **not** constitute medical diagnoses or clinical prescriptions.
2. **Clinical Primacy:** In `POST /api/v1/astronauts/{id}/assessments`, subjective crew symptoms (via `reported_symptoms`) take strict precedence over normal statistical vitals.
3. **Data Provenance:** Every measurement, baseline, assessment, and alert carries an `is_synthetic` boolean flag.

---

## 2. System Endpoints

### 2.1 Health Check

Retrieves service operational readiness.

- **Method:** `GET`
- **Route:** `/api/v1/health` (also accessible at `/health`)
- **Status Code:** `200 OK`

```json
{
  "status": "healthy",
  "app": "COSMOLOOKUP",
  "version": "v1",
  "environment": "development"
}
```

---

## 3. Astronaut Endpoints

### 3.1 List Astronauts

Retrieves a paginated list of astronaut crew profiles, optionally filtered by mission name.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `mission_name` | `string` | No | `null` | Filter astronauts belonging to a specific mission (case-insensitive substring match). |
| `limit` | `integer` | No | `50` | Maximum number of records to return (min: `1`, max: `100`). |
| `offset` | `integer` | No | `0` | Number of records to skip for pagination (min: `0`). |

#### Response: `200 OK`

```json
{
  "data": [
    {
      "id": "astro-001",
      "name": "Dr. Sarah Connor",
      "crew_role": "Commander / Medical Officer",
      "mission_name": "Artemis VII",
      "mission_day": 42,
      "created_at": "2026-10-01T08:00:00Z"
    },
    {
      "id": "astro-002",
      "name": "Alex Chen",
      "crew_role": "Flight Engineer",
      "mission_name": "Artemis VII",
      "mission_day": 42,
      "created_at": "2026-10-01T08:00:00Z"
    }
  ],
  "total": 2,
  "limit": 50,
  "offset": 0
}
```

---

### 3.2 Get Astronaut by ID

Retrieves detailed profile information for an individual astronaut.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}`

#### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `astronaut_id` | `string` | Yes | Unique identifier of the astronaut (e.g. `"astro-001"`). |

#### Response: `200 OK`

```json
{
  "id": "astro-001",
  "name": "Dr. Sarah Connor",
  "crew_role": "Commander / Medical Officer",
  "mission_name": "Artemis VII",
  "mission_day": 42,
  "created_at": "2026-10-01T08:00:00Z"
}
```

#### Response: `404 Not Found`

```json
{
  "error": {
    "code": "ASTRONAUT_NOT_FOUND",
    "message": "Astronaut with id 'astro-999' not found.",
    "details": {
      "astronaut_id": "astro-999"
    }
  }
}
```

---

## 4. Measurement & Catalog Endpoints

### 4.1 Get Measurement Catalog

Retrieves the canonical catalog of physiological and environmental metrics, context taxonomies, and countermeasure modalities.

- **Method:** `GET`
- **Route:** `/api/v1/measurements/catalog`

#### Response: `200 OK`

```json
{
  "metrics": [
    {
      "canonical_identifier": "heart_rate",
      "display_name": "Heart Rate",
      "category": "cardiovascular",
      "standard_unit": "bpm",
      "description": "Resting cardiac beat frequency per minute.",
      "accepted_aliases": ["hr", "pulse", "heartrate"],
      "applicable_contexts": ["resting_cabin", "sleep_cycle", "exercise_active", "exercise_recovery"],
      "sensor_sanity_min": 30.0,
      "sensor_sanity_max": 220.0,
      "is_derived": false
    },
    {
      "canonical_identifier": "spo2",
      "display_name": "Blood Oxygen Saturation (SpO2)",
      "category": "respiratory",
      "standard_unit": "%",
      "description": "Peripheral capillary functional arterial hemoglobin oxygen saturation.",
      "accepted_aliases": ["blood_oxygen", "o2_sat", "pulse_ox"],
      "applicable_contexts": ["resting_cabin", "sleep_cycle", "exercise_active"],
      "sensor_sanity_min": 50.0,
      "sensor_sanity_max": 100.0,
      "is_derived": false
    }
  ],
  "contexts": {
    "baseline_eligible": [
      "exercise_active",
      "exercise_recovery",
      "resting_cabin",
      "sleep_cycle"
    ],
    "operational_tracking": [
      "eva_operational"
    ],
    "excluded": [
      "other",
      "unknown"
    ]
  },
  "exercise_modalities": [
    "ared_resistive",
    "cevis_aerobic",
    "other",
    "t2_treadmill",
    "unknown"
  ]
}
```

---

### 4.2 List Astronaut Measurements

Retrieves time-series telemetry observations for a specific astronaut with multi-parameter filtering and query expansion.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/measurements`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `measurement_type` | `string` | No | `null` | Filter by metric type (supports aliases, e.g. `blood_oxygen` $\leftrightarrow$ `spo2`). |
| `context` | `string` | No | `null` | Filter by operational context (e.g. `resting_cabin`, `exercise_active`). |
| `exercise_modality`| `string` | No | `null` | Filter by exercise countermeasure modality (e.g. `ared_resistive`, `cevis_aerobic`). |
| `start_time` | `string` (ISO 8601) | No | `null` | Filter measurements on or after this timestamp. |
| `end_time` | `string` (ISO 8601) | No | `null` | Filter measurements on or before this timestamp. |
| `limit` | `integer` | No | `100` | Max records to return (min: `1`, max: `1000`). |
| `offset` | `integer` | No | `0` | Number of records to skip. |

#### Response: `200 OK`

```json
{
  "astronaut_id": "astro-001",
  "data": [
    {
      "id": "meas-00101",
      "astronaut_id": "astro-001",
      "measurement_type": "heart_rate",
      "value": 72.0,
      "unit": "bpm",
      "measured_at": "2026-11-14T11:45:00Z",
      "source": "BioHarness v3 Telemetry",
      "context": "resting_cabin",
      "data_quality": "nominal",
      "is_synthetic": true,
      "exercise_modality": null,
      "measurement_site": "chest",
      "measurement_method": "ecg_lead_ii",
      "sensor_model": "BioHarness v3",
      "mission_day": 42
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

---

## 5. Personal Baseline & Lifecycle Endpoints

### 5.1 Calculate or Refresh Personal Baseline

Calculates and persists an astronaut's intra-individual baseline envelope using non-parametric statistics.

- **Method:** `POST`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines/calculate`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `create_version` | `boolean` | No | `false` | When true, increments baseline version and archives previous active reference. |

#### Request Body (`application/json`)

```json
{
  "measurement_type": "heart_rate",
  "context": "resting_cabin",
  "baseline_type": "inflight",
  "exercise_modality": null,
  "measurement_site": null,
  "measurement_method": null,
  "include_degraded": false,
  "start_time": null,
  "end_time": null
}
```

#### Response: `200 OK`

```json
{
  "id": "base-4f18a2bc",
  "astronaut_id": "astro-001",
  "measurement_type": "heart_rate",
  "context": "resting_cabin",
  "exercise_modality": null,
  "measurement_site": null,
  "measurement_method": null,
  "sensor_model": "BioHarness chest band",
  "unit": "bpm",
  "baseline_type": "inflight",
  "maturity": "established",
  "version": 1,
  "is_active": true,
  "is_finalized": false,
  "supersedes_baseline_id": null,
  "maturity_evaluated_at": "2026-11-14T12:00:00Z",
  "maturity_criteria_snapshot": "established: n=25 >= 20; span=44.0d >= 14d",
  "envelope": {
    "median": 72.0,
    "q25": 68.0,
    "q75": 76.0,
    "iqr": 8.0,
    "robust_scale_iqr": 5.9303,
    "mean": 72.4,
    "std_dev": 5.8992,
    "min_value": 62.0,
    "max_value": 82.0,
    "sample_count": 25,
    "window_start": "2026-10-01T08:00:00Z",
    "window_end": "2026-11-14T08:00:00Z",
    "disclaimer": "Statistical reference values only. NOT medical diagnostic thresholds or clinical flight rules."
  },
  "quality_summary": {
    "nominal": 25,
    "degraded": 2,
    "total_evaluated": 27
  },
  "algorithm_version": "v2c-lifecycle",
  "is_synthetic": true,
  "calculated_at": "2026-11-14T12:00:00Z"
}
```

#### Error Responses
- `400 Bad Request`: Context is not baseline-eligible (e.g. `eva_operational`).
- `422 Unprocessable Entity`: Insufficient qualifying telemetry records (`INSUFFICIENT_MEASUREMENTS`).

---

### 5.2 Calculate Preflight Baseline

Calculates and registers a preflight benchmark baseline with `baseline_type = 'preflight'`.

- **Method:** `POST`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines/preflight`
- **Payload:** Same as `POST /api/v1/astronauts/{astronaut_id}/baselines/calculate`

#### Response: `200 OK`
Returns `BaselineResponse` with `baseline_type: "preflight"` and `is_finalized: false`.

#### Response: `409 Conflict`
Returned if preflight baseline is already finalized:
```json
{
  "error": {
    "code": "PREFLIGHT_BASELINE_FINALIZED",
    "message": "Preflight baseline 'base-123' for metric 'heart_rate' has been finalized and is immutable.",
    "details": {
      "baseline_id": "base-123"
    }
  }
}
```

---

### 5.3 Finalize Preflight Baseline

Locks an existing preflight baseline against future modifications.

- **Method:** `POST`
- **Route:** `/api/v1/baselines/{baseline_id}/finalize`

#### Request Body (`application/json`)

```json
{
  "reason": "Flight Surgeon approved baseline dataset."
}
```

#### Response: `200 OK`
Returns `BaselineResponse` with `is_finalized: true`.

---

### 5.4 Get Active Baselines

Retrieves all currently active baseline references for an astronaut.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines/active`

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `baseline_type` | `string` | No | Filter by cohort (`preflight` or `inflight`). |
| `context` | `string` | No | Filter by operational context. |

#### Response: `200 OK`

```json
{
  "astronaut_id": "astro-001",
  "data": [
    {
      "id": "base-4f18a2bc",
      "astronaut_id": "astro-001",
      "measurement_type": "heart_rate",
      "context": "resting_cabin",
      "baseline_type": "inflight",
      "maturity": "established",
      "version": 1,
      "is_active": true,
      "is_finalized": false
    }
  ],
  "total": 1
}
```

---

### 5.5 Get Baseline by Metric

Retrieves a specific baseline envelope for an astronaut and metric identifier.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines/{measurement_type}`

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `context` | `string` | No | Context partition (e.g. `resting_cabin`). |
| `exercise_modality`| `string` | No | Exercise equipment modality if applicable. |

#### Response: `200 OK`
Returns `BaselineResponse`.

#### Response: `404 Not Found`

```json
{
  "error": {
    "code": "BASELINE_NOT_FOUND",
    "message": "Baseline for astronaut 'astro-001' with metric 'radiation_dose' in context 'resting_cabin' not found.",
    "details": {
      "astronaut_id": "astro-001",
      "measurement_type": "radiation_dose",
      "context": "resting_cabin"
    }
  }
}
```

---

### 5.6 Get Baseline Version History

Retrieves historical baseline versions for auditability and evolution tracking.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines/{measurement_type}/history`

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `baseline_type` | `string` | No | Cohort filter (`preflight` or `inflight`). |
| `context` | `string` | No | Context filter. |

#### Response: `200 OK`
Returns `BaselineListResponse` ordered in descending version sequence.

---

### 5.7 List All Calculated Baselines

Retrieves all calculated baselines for an astronaut.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines`
- **Query Parameters:** `context` (optional)

#### Response: `200 OK`
Returns `BaselineListResponse`.

---

## 6. Trend Intelligence & Freshness Endpoints

### 6.1 Astronaut Telemetry Trends

Retrieves intra-individual trend analysis across all monitored metrics for an astronaut.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/trends`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `context` | `string` | No | `resting_cabin` | Context partition to evaluate. |
| `lookback_hours` | `integer` | No | `72` | Sliding lookback window in hours (min: `1`, max: `720`). |

#### Response: `200 OK`

```json
{
  "astronaut_id": "astro-001",
  "evaluated_at": "2026-11-14T12:00:00Z",
  "data": [
    {
      "measurement_type": "heart_rate",
      "canonical_identifier": "heart_rate",
      "context": "resting_cabin",
      "exercise_modality": null,
      "unit": "bpm",
      "current_value": 72.0,
      "current_measured_at": "2026-11-14T11:45:00Z",
      "baseline_id": "base-4f18a2bc",
      "baseline_version": 1,
      "baseline_type": "inflight",
      "baseline_maturity": "established",
      "baseline_median": 70.0,
      "baseline_iqr": 4.0,
      "robust_scale_iqr": 2.9652,
      "robust_z": 0.67,
      "sample_count": 24,
      "sens_slope": 0.45,
      "trend_direction": "stable",
      "consecutive_deviations": 0,
      "is_sustained": false,
      "freshness_status": "fresh",
      "hours_since_last_observation": 0.25,
      "expected_interval_hours": 6.0,
      "data_quality_status": "nominal",
      "explanation": "Stable physiological trajectory within expected operational variation (|Z| <= 1.5, Sen's slope ~ 0.0)."
    }
  ],
  "total": 1
}
```

---

### 6.2 Telemetry Freshness Report

Evaluates telemetry currency and staleness across all monitored metrics.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/trends/freshness`

#### Response: `200 OK`

```json
{
  "astronaut_id": "astro-001",
  "evaluated_at": "2026-11-14T12:00:00Z",
  "items": [
    {
      "measurement_type": "heart_rate",
      "last_measured_at": "2026-11-14T11:45:00Z",
      "hours_since_last": 0.25,
      "expected_interval_hours": 6.0,
      "status": "fresh",
      "message": "Telemetry is current (updated 0.2h ago; expected <= 6.0h)."
    }
  ],
  "stale_count": 0,
  "total_metrics": 9
}
```

---

### 6.3 Single Metric Trend

Evaluates trajectory, Sen's slope, and deviation for an individual metric.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/trends/{measurement_type}`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `context` | `string` | No | `resting_cabin` | Context partition. |
| `exercise_modality`| `string` | No | `null` | Exercise modality if context is exercise. |
| `lookback_hours` | `integer` | No | `72` | Lookback window in hours (1-720). |

#### Response: `200 OK`
Returns `TrendObservation`.

---

## 7. Explainable Health Assessment Endpoints

### 7.1 Generate Explainable Health Assessment

Synthesizes multi-metric trend analysis, concordance rules, and deterministic safe operational guidance.

- **Method:** `POST`
- **Route:** `/api/v1/astronauts/{astronaut_id}/assessments`

#### Request Body (`application/json`)

```json
{
  "context": "resting_cabin",
  "lookback_hours": 72,
  "generate_alerts": true,
  "emergency_protocol_config": null,
  "reported_symptoms": ["headache", "dizziness"]
}
```

> **Clinical Primacy Notice:** Subjective crew symptoms (`reported_symptoms`) take clinical precedence over normal statistical vitals. High-acuity symptoms escalate the overall classification (`emergency` or `medical_review_recommended`) regardless of normal telemetry.

#### Response: `200 OK`

```json
{
  "id": "asm-81f72a",
  "astronaut_id": "astro-001",
  "assessment_date": "2026-11-14T12:00:00Z",
  "overall_classification": "needs_attention",
  "summary_explanation": "Crew-reported subjective symptoms ('headache', 'dizziness') noted alongside nominal resting vitals. Clinical primacy safeguards applied.",
  "findings": [
    {
      "measurement_type": "heart_rate",
      "status": "nominal",
      "summary": "heart_rate: Operating within nominal intra-individual variation.",
      "current_value": 72.0,
      "baseline_median": 70.0,
      "robust_z": 0.67,
      "trend": "stable",
      "baseline_version": 1
    }
  ],
  "guidance": [
    {
      "category": "clinical_consultation",
      "action": "Schedule Flight Surgeon clinical evaluation based on crew-reported symptoms.",
      "rationale": "Reported symptoms require clinical review under NASA-STD-3001 clinical primacy protocol.",
      "is_medical_prescription": false
    }
  ],
  "baseline_versions_used": {
    "heart_rate": "base-4f18a2bc (v1)"
  },
  "data_quality_status": "nominal",
  "is_synthetic": true,
  "created_at": "2026-11-14T12:00:00Z"
}
```

---

### 7.2 Get Latest Health Assessment

Retrieves the most recently generated explainable health assessment for an astronaut.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/assessments/latest`

#### Response: `200 OK`
Returns `AssessmentResponse`.

#### Response: `404 Not Found`
Returned when no assessments have been generated for the astronaut.

---

### 7.3 List Historical Assessments

Retrieves historical assessments for an astronaut.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/assessments`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `limit` | `integer` | No | `50` | Max assessments to return (min: `1`, max: `100`). |

#### Response: `200 OK`
Returns `AssessmentListResponse`.

---

### 7.4 Get Assessment by ID

Retrieves a single assessment by its identifier.

- **Method:** `GET`
- **Route:** `/api/v1/assessments/{assessment_id}`

#### Response: `200 OK`
Returns `AssessmentResponse`.

---

## 8. Operational Alert Endpoints

### 8.1 List Health Alerts

Retrieves operational health alerts for an astronaut with optional status and severity filtering.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/alerts`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `status` | `string` | No | `null` | Filter by status (`active`, `acknowledged`, `resolved`). |
| `severity` | `string` | No | `null` | Filter by severity (`low`, `medium`, `high`, `critical`). |

#### Response: `200 OK`

```json
{
  "astronaut_id": "astro-001",
  "data": [
    {
      "id": "alt-b901fc",
      "astronaut_id": "astro-001",
      "assessment_id": "asm-81f72a",
      "measurement_type": "heart_rate",
      "category": "physiological_shift",
      "severity": "medium",
      "title": "Heart Rate Needs Attention",
      "explanation": "Sustained baseline shift detected in heart_rate relative to personal resting_cabin operational baseline.",
      "status": "active",
      "created_at": "2026-11-14T12:00:00Z",
      "acknowledged_at": null,
      "resolved_at": null,
      "is_synthetic": true
    }
  ],
  "total": 1
}
```

---

### 8.2 Get Alert by ID

Retrieves details for a single health alert.

- **Method:** `GET`
- **Route:** `/api/v1/alerts/{alert_id}`

#### Response: `200 OK`
Returns `AlertResponse`.

---

### 8.3 Acknowledge Alert

Records operator review of an active health alert.

- **Method:** `POST`
- **Route:** `/api/v1/alerts/{alert_id}/acknowledge`

#### Request Body (`application/json`, optional)

```json
{
  "note": "Operator acknowledged telemetry excursion; observing next collection cycle."
}
```

#### Response: `200 OK`
Returns `AlertResponse` with `status: "acknowledged"` and populated `acknowledged_at`.

---

### 8.4 Resolve Alert

Marks an alert as resolved.

- **Method:** `POST`
- **Route:** `/api/v1/alerts/{alert_id}/resolve`

#### Request Body (`application/json`, optional)

```json
{
  "note": "Follow-up measurement returned to nominal envelope."
}
```

#### Response: `200 OK`
Returns `AlertResponse` with `status: "resolved"` and populated `resolved_at`.
