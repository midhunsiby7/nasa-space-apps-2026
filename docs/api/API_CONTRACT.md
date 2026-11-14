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
