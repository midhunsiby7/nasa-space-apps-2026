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
