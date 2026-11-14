# COSMOLOOKUP API Contract — Specification v1.0

> **Status:** Agreed & Authoritative  
> **Base URL:** `/api/v1`  
> **Protocol:** HTTP/1.1 or HTTP/2  
> **Content-Type:** `application/json`  
> **Date:** 2026-11-14  

This document serves as the binding contract between backend development and frontend consumption for the initial COSMOLOOKUP release. No additional endpoints or schema alterations may be introduced without mutual team consent and documentation revisions.

---

## Standard Response Standards

### Success Responses
All successful responses return standard HTTP status codes (`200 OK`) and deliver JSON payloads. Collection endpoints wrap items in a `data` array alongside pagination metadata (`total`, `limit`, `offset`).

### Error Responses
Error responses return appropriate 4xx or 5xx status codes and a consistent JSON payload:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Astronaut with id 'astro-404' was not found.",
    "details": null
  }
}
```

Standard Status Codes:
- `200 OK`: Successful retrieval.
- `400 Bad Request`: Invalid query parameters or malformed request.
- `404 Not Found`: Target resource does not exist.
- `500 Internal Server Error`: Unhandled server exception.

---

## Endpoints

### 1. List Astronauts

Retrieves a paginated collection of astronaut records, optionally filterable by mission name.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts`
- **Description:** Returns a list of astronauts with their basic profile and mission assignment details.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `mission_name` | `string` | No | `null` | Filter astronauts belonging to a specific mission (case-insensitive substring or exact match). |
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

#### Response: `400 Bad Request`

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "Parameter 'limit' must be an integer between 1 and 100.",
    "details": {
      "parameter": "limit",
      "value": "invalid_number"
    }
  }
}
```

---

### 2. Get Astronaut by ID

Retrieves detailed profile information for an individual astronaut by their unique identifier.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}`
- **Description:** Returns the complete astronaut entity corresponding to the supplied `astronaut_id`.

#### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `astronaut_id` | `string` | Yes | Unique identifier of the astronaut (e.g., `"astro-001"`). |

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

### 3. Get Astronaut Measurements

Retrieves physiological vitals, telemetry, and environmental measurements associated with a specific astronaut.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/measurements`
- **Description:** Fetches time-series biometric and environmental measurements recorded for the given astronaut, supporting filtering by measurement type and timestamp ranges.

#### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `astronaut_id` | `string` | Yes | Unique identifier of the astronaut. |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `measurement_type` | `string` | No | `null` | Filter by metric type (e.g., `heart_rate`, `core_temperature`, `blood_oxygen`, `radiation_dose`). |
| `start_time` | `string` (ISO 8601) | No | `null` | Filter measurements taken on or after this timestamp (e.g., `2026-11-14T00:00:00Z`). |
| `end_time` | `string` (ISO 8601) | No | `null` | Filter measurements taken on or before this timestamp (e.g., `2026-11-14T23:59:59Z`). |
| `limit` | `integer` | No | `100` | Maximum number of measurement records to return (min: `1`, max: `1000`). |
| `offset` | `integer` | No | `0` | Number of records to skip for pagination (min: `0`). |

#### Response: `200 OK`

```json
{
  "astronaut_id": "astro-001",
  "data": [
    {
      "id": "meas-00101",
      "astronaut_id": "astro-001",
      "measurement_type": "heart_rate",
      "value": 74.0,
      "unit": "bpm",
      "measured_at": "2026-11-14T06:30:00Z",
      "source": "BioHarness v3 Telemetry",
      "context": "Post-EVA recovery period",
      "data_quality": "nominal",
      "is_synthetic": true
    },
    {
      "id": "meas-00102",
      "astronaut_id": "astro-001",
      "measurement_type": "blood_oxygen",
      "value": 98.2,
      "unit": "%",
      "measured_at": "2026-11-14T06:30:00Z",
      "source": "Pulse Oximeter Optical Band",
      "context": "Post-EVA recovery period",
      "data_quality": "nominal",
      "is_synthetic": true
    },
    {
      "id": "meas-00103",
      "astronaut_id": "astro-001",
      "measurement_type": "core_temperature",
      "value": 37.1,
      "unit": "celsius",
      "measured_at": "2026-11-14T06:30:00Z",
      "source": "Ingestible Thermal Sensor",
      "context": "Post-EVA recovery period",
      "data_quality": "nominal",
      "is_synthetic": false
    }
  ],
  "total": 3,
  "limit": 100,
  "offset": 0
}
```

#### Response: `404 Not Found` (Astronaut does not exist)

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

#### Response: `400 Bad Request` (Invalid query parameter or date format)

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "Parameter 'start_time' must be a valid ISO 8601 formatted timestamp.",
    "details": {
      "parameter": "start_time",
      "value": "2026-99-99"
    }
  }
}
```

---

### 4. Calculate or Refresh Personal Baseline

Calculates and persists an astronaut's personal baseline envelope for a given canonical metric and context using comparable historical telemetry.

- **Method:** `POST`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines/calculate`
- **Description:** Formulates robust non-parametric (median, IQR) and secondary parametric (mean, standard deviation) operational reference values.

#### Request Body: `application/json`

```json
{
  "measurement_type": "heart_rate",
  "context": "resting_cabin",
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
  "algorithm_version": "v2b-iqr",
  "is_synthetic": true,
  "calculated_at": "2026-11-14T12:00:00Z"
}
```

---

### 5. List Astronaut Baselines

Retrieves all calculated baseline envelopes for an astronaut, with optional context filtering.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines`
- **Query Parameters:** `context` (optional, e.g. `resting_cabin`)

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
      "exercise_modality": null,
      "measurement_site": null,
      "measurement_method": null,
      "sensor_model": "BioHarness chest band",
      "unit": "bpm",
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
      "algorithm_version": "v2b-iqr",
      "is_synthetic": true,
      "calculated_at": "2026-11-14T12:00:00Z"
    }
  ],
  "total": 1
}
```

---

### 6. Get Baseline by Metric

Retrieves a specific baseline envelope for an astronaut and metric identifier (supports aliases such as `blood_oxygen` mapping to `spo2`).

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines/{measurement_type}`
- **Query Parameters:** `context` (optional), `exercise_modality` (optional)

#### Response: `200 OK`

Returns the individual `BaselineResponse` JSON object matching the specification above.

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

### 7. Calculate Preflight Baseline

Calculates and registers a preflight benchmark baseline for an astronaut. Sets `baseline_type = 'preflight'`.

- **Method:** `POST`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines/preflight`
- **Payload:** Same as `POST /api/v1/astronauts/{astronaut_id}/baselines/calculate`

#### Response: `200 OK`
Returns `BaselineResponse` with `baseline_type: "preflight"` and `is_finalized: false`.

#### Response: `409 Conflict`
If preflight baseline is already finalized:
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

### 8. Finalize Preflight Baseline

Locks an existing preflight baseline against future modifications.

- **Method:** `POST`
- **Route:** `/api/v1/baselines/{baseline_id}/finalize`
- **Payload:**
```json
{
  "reason": "Flight Surgeon approved baseline dataset."
}
```

#### Response: `200 OK`
Returns `BaselineResponse` with `is_finalized: true`.

---

### 9. Get Active Baselines

Retrieves all currently active baseline references for an astronaut.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines/active`
- **Query Parameters:** `baseline_type` (optional), `context` (optional)

#### Response: `200 OK`
Returns `BaselineListResponse` containing active records.

---

### 10. Get Baseline Version History

Retrieves historical baseline versions for auditability and evolution tracking.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/baselines/{measurement_type}/history`
- **Query Parameters:** `baseline_type` (optional), `context` (optional)

#### Response: `200 OK`
Returns `BaselineListResponse` in descending version order.

---

### 11. Astronaut Telemetry Trends

Retrieves intra-individual trend analysis across all monitored metrics for an astronaut.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/trends`
- **Query Parameters:** `context` (default: `resting_cabin`), `lookback_hours` (default: `72`)

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
  "total": 9
}
```

---

### 12. Telemetry Freshness Report

Evaluates telemetry currency and staleness report across all monitored metrics.

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

### 13. Single Metric Trend

Evaluates trajectory, Sen's slope rate-of-change, and deviation for an individual metric.

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/trends/{measurement_type}`
- **Query Parameters:** `context` (default: `resting_cabin`), `exercise_modality` (optional), `lookback_hours` (default: `72`)

#### Response: `200 OK`
Returns `TrendObservation` JSON schema.

---

### 14. Generate Explainable Health Assessment

Synthesizes multi-metric trend analysis, concordance rules, and deterministic safe guidance.

- **Method:** `POST`
- **Route:** `/api/v1/astronauts/{astronaut_id}/assessments`
- **Payload:**
```json
{
  "context": "resting_cabin",
  "lookback_hours": 72,
  "generate_alerts": true
}
```

#### Response: `200 OK`
```json
{
  "id": "asm-81f72a",
  "astronaut_id": "astro-001",
  "assessment_date": "2026-11-14T12:00:00Z",
  "overall_classification": "routine",
  "summary_explanation": "Astronaut physiological telemetry is operating within nominal personal baseline envelopes for context 'resting_cabin'. No sustained deviations or multi-parameter shifts detected across lookback window.",
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
      "category": "telemetry_schedule",
      "action": "Maintain scheduled routine telemetry collection intervals.",
      "rationale": "All monitored vitals are operating within established intra-individual baselines.",
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

### 15. Get Latest Health Assessment

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/assessments/latest`

#### Response: `200 OK`
Returns the most recent `AssessmentResponse`.

---

### 16. List Historical Health Assessments

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/assessments`
- **Query Parameters:** `limit` (default: `50`, max: `100`)

#### Response: `200 OK`
Returns `AssessmentListResponse`.

---

### 17. Get Single Assessment

- **Method:** `GET`
- **Route:** `/api/v1/assessments/{assessment_id}`

#### Response: `200 OK`
Returns `AssessmentResponse`.

---

### 18. List Health Alerts

- **Method:** `GET`
- **Route:** `/api/v1/astronauts/{astronaut_id}/alerts`
- **Query Parameters:** `status` (`active`, `acknowledged`, `resolved`), `severity` (`low`, `medium`, `high`, `critical`)

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

### 19. Get Single Alert

- **Method:** `GET`
- **Route:** `/api/v1/alerts/{alert_id}`

#### Response: `200 OK`
Returns `AlertResponse`.

---

### 20. Acknowledge Alert

- **Method:** `POST`
- **Route:** `/api/v1/alerts/{alert_id}/acknowledge`
- **Payload:**
```json
{
  "note": "Operator acknowledged telemetry excursion; observing next collection cycle."
}
```

#### Response: `200 OK`
Returns updated `AlertResponse` with `status: "acknowledged"` and timestamp.

---

### 21. Resolve Alert

- **Method:** `POST`
- **Route:** `/api/v1/alerts/{alert_id}/resolve`
- **Payload:**
```json
{
  "note": "Follow-up measurement returned to nominal envelope."
}
```

#### Response: `200 OK`
Returns updated `AlertResponse` with `status: "resolved"` and timestamp.

