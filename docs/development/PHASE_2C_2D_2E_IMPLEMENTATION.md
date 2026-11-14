# COSMOLOOKUP — Combined Backend Intelligence Implementation
## Phase 2C + Phase 2D + Phase 2E: Baseline Lifecycle, Health Trend Intelligence & Explainable Assessment Engine

> **Project:** COSMOLOOKUP (NASA Space Apps Challenge 2026)  
> **Milestone:** Combined Phase 2C + 2D + 2E  
> **Branch:** `feature/backend-health-intelligence`  
> **Base Target:** `develop`  
> **Status:** Completed & Validated (85/85 Tests Passing)  
> **Date:** 2026-11-14  

---

## 1. Executive Summary

This milestone consolidates the remaining backend intelligence and clinical decision-support foundations into a unified, high-integrity release for COSMOLOOKUP:
1. **Phase 2C (Baseline Lifecycle & Maturity Management):** Differentiates pre-flight baseline cohorts from in-flight adaptive baselines, enforces strict immutability on finalized pre-flight references, formalizes maturity classifications (`insufficient`, `provisional`, `established`) backed by verifiable criteria snapshots, and maintains an auditable version lineage.
2. **Phase 2D (Intra-Individual Trend Intelligence & Telemetry Freshness):** Implements non-parametric Sen's slope rate-of-change estimation (units/24h), standardized robust deviation scores ($Z_{\text{IQR}} = (x - \text{median}) / \text{robust\_scale\_iqr}$), consecutive-observation run-rules to filter acute noise from sustained shifts, and telemetry currency intervals with transparent staleness tracking.
3. **Phase 2E (Explainable Multi-Tier Health Assessment & Alert Lifecycle):** Delivers deterministic 4-tier workflow attention routing (`routine`, `needs_attention`, `medical_review_recommended`, `emergency`), transparent observational explanations, deterministic safe operational guidance (strictly non-diagnostic and non-prescriptive), automated alert generation with duplicate fatigue suppression, and alert lifecycle management (`active`, `acknowledged`, `resolved`).

---

## 2. Architecture & Design Principles

### 2.1. Baseline Lifecycle & Immutability (Phase 2C)

* **Cohort Separation:** Baselines are partitioned into `preflight` (ground test reference) and `inflight` (adaptive spaceflight reference).
* **Preflight Immutability:** Preflight baselines can be recalculated during ground training. Once validated and locked via `POST /api/v1/baselines/{id}/finalize`, they become permanently immutable. Any subsequent attempt to mutate or recalculate raises `409 Conflict` (`PreflightBaselineFinalizedException`).
* **In-Flight Versioning & Supersession:** Recalculations of in-flight baselines under lifecycle management increment the `version` counter, deactivate the predecessor (`is_active = False`), and link the new row via `supersedes_baseline_id`.
* **Maturity Classification:**
  - `insufficient`: $N < 10$ valid measurements OR observation duration $< 3.0$ days.
  - `provisional`: $N \ge 10$ valid measurements AND observation duration $\ge 3.0$ days.
  - `established`: $N \ge 30$ valid measurements AND observation duration $\ge 7.0$ days AND nominal-quality percentage $\ge 90.0\%$.
  - Criteria snapshots are captured as JSON in `maturity_criteria_snapshot` to provide historical auditability.

### 2.2. Trend Intelligence & Freshness (Phase 2D)

* **Non-Parametric Sen's Slope Rate-of-Change:** Robust against transient telemetry outliers, calculated as the median of pairwise slopes:
  $$\text{Slope}_{ij} = \frac{y_j - y_i}{\Delta t_{\text{days}}} \quad \forall \; i < j$$
  Scaled to units per 24 hours.
* **Standardized Robust Deviation ($Z_{\text{IQR}}$):**
  $$Z_{\text{IQR}} = \frac{x_{\text{current}} - \text{Median}}{\text{Robust Scale}_{\text{IQR}}}$$
  Where $\text{Robust Scale}_{\text{IQR}} = \text{IQR} / 1.349$. Safe zero-division handling guarantees that if $\text{IQR} = 0$ and $x_{\text{current}} == \text{Median}$, $Z_{\text{IQR}} = 0.0$.
* **Run Rules for Sustained Deviation:**
  Isolated outliers ($|Z_{\text{IQR}}| > 1.5$) are treated cautiously to prevent false alarms. If 3 or more consecutive readings in the lookback window exceed the deviation threshold, the trajectory is flagged as `sustained_deviation`.
* **Telemetry Currency Intervals:**
  Each metric is evaluated against nominal expected frequencies (e.g. 6 hours for HR/SpO2/temp; 12 hours for BP/radiation; 24 hours for sleep). Exceeding the interval yields a `stale` status accompanied by a clear notice that staleness does not imply a clinical emergency.

### 2.3. Explainable Health Assessment & Alerts (Phase 2E)

* **Attention Classification Tiers:**
  - `routine`: All telemetry within nominal intra-individual operational envelopes; isolated transient excursions without consecutive deviations.
  - `needs_attention`: Single sustained shift ($k \ge 3$ consecutive deviations) OR $\ge 2$ significant outliers OR stale telemetry requiring sensor check.
  - `medical_review_recommended`: Multi-parameter concordant physiological shift across related vitals (e.g. concurrent sustained heart rate and body temperature deviations).
  - `emergency`: Configurable and disabled by default. Evaluated ONLY when an explicit protocol configuration is provided. Unvalidated demonstration thresholds (e.g., SpO2 < 85%, resting HR > 180 bpm, SBP > 200 mmHg) are labeled as illustrative test rules and never presented as genuine medical emergency determinations.
* **Safe Guidance Engine:**
  Deterministic operational recommendations focusing on sensor verification, countermeasure adherence, clinical primacy (never dismiss symptoms based on normal telemetry), and flight surgeon consultation. Explicitly marked with `is_medical_prescription = false`.
* **Alert Deduplication & Fatigue Suppression:**
  `create_or_update_alert` verifies if an active or acknowledged alert already exists for `(astronaut_id, measurement_type)`. If so, the existing alert record is updated in-place with latest context, upgrading severity if necessary, suppressing duplicate notification spam.
* **Alert Lifecycle:**
  `active` $\to$ `acknowledged` (via `POST /alerts/{id}/acknowledge`) $\to$ `resolved` (via `POST /alerts/{id}/resolve`).

---

## 3. Database Schema Extensions

### 3.1. Extended `astronaut_baseline`
Added lifecycle management columns:
- `baseline_type VARCHAR(32) DEFAULT 'inflight' NOT NULL`
- `maturity VARCHAR(32) DEFAULT 'insufficient' NOT NULL`
- `version INTEGER DEFAULT 1 NOT NULL`
- `is_active BOOLEAN DEFAULT TRUE NOT NULL`
- `is_finalized BOOLEAN DEFAULT FALSE NOT NULL`
- `supersedes_baseline_id VARCHAR(64) NULL`
- `maturity_evaluated_at TIMESTAMP NULL`
- `maturity_criteria_snapshot TEXT NULL`

### 3.2. New Table `health_assessment`
- `id VARCHAR(64) PRIMARY KEY`
- `astronaut_id VARCHAR(64) FOREIGN KEY -> astronaut.id`
- `assessment_date TIMESTAMP NOT NULL`
- `overall_classification VARCHAR(32) NOT NULL` (`routine`, `needs_attention`, `medical_review_recommended`, `emergency`)
- `summary_explanation TEXT NOT NULL`
- `findings_json TEXT NOT NULL`
- `guidance_json TEXT NOT NULL`
- `baseline_versions_json TEXT NOT NULL`
- `data_quality_status VARCHAR(32) DEFAULT 'nominal' NOT NULL`
- `is_synthetic BOOLEAN DEFAULT TRUE NOT NULL`
- `created_at TIMESTAMP NOT NULL`

### 3.3. New Table `health_alert`
- `id VARCHAR(64) PRIMARY KEY`
- `astronaut_id VARCHAR(64) FOREIGN KEY -> astronaut.id`
- `assessment_id VARCHAR(64) NULL FOREIGN KEY -> health_assessment.id`
- `measurement_type VARCHAR(64) NOT NULL`
- `category VARCHAR(64) NOT NULL`
- `severity VARCHAR(32) NOT NULL` (`low`, `medium`, `high`, `critical`)
- `title VARCHAR(255) NOT NULL`
- `explanation TEXT NOT NULL`
- `status VARCHAR(32) DEFAULT 'active' NOT NULL` (`active`, `acknowledged`, `resolved`)
- `created_at TIMESTAMP NOT NULL`
- `acknowledged_at TIMESTAMP NULL`
- `resolved_at TIMESTAMP NULL`
- `is_synthetic BOOLEAN DEFAULT TRUE NOT NULL`

---

## 4. Implemented API Endpoints

| Milestone | Method | Endpoint | Description |
|---|---|---|---|
| Phase 2C | `POST` | `/api/v1/astronauts/{astronaut_id}/baselines/preflight` | Calculate and register a preflight benchmark baseline |
| Phase 2C | `POST` | `/api/v1/baselines/{baseline_id}/finalize` | Finalize preflight baseline; locks record permanently |
| Phase 2C | `GET` | `/api/v1/astronauts/{astronaut_id}/baselines/active` | Retrieve all active baselines for astronaut |
| Phase 2C | `GET` | `/api/v1/astronauts/{astronaut_id}/baselines/{measurement_type}/history` | Retrieve full historical baseline version lineage |
| Phase 2D | `GET` | `/api/v1/astronauts/{astronaut_id}/trends` | Retrieve intra-individual trends across all vitals |
| Phase 2D | `GET` | `/api/v1/astronauts/{astronaut_id}/trends/freshness` | Telemetry currency and staleness report |
| Phase 2D | `GET` | `/api/v1/astronauts/{astronaut_id}/trends/{measurement_type}` | Trend analysis and Sen's slope for specific metric |
| Phase 2E | `POST` | `/api/v1/astronauts/{astronaut_id}/assessments` | Synthesize explainable health assessment & emit alerts |
| Phase 2E | `GET` | `/api/v1/astronauts/{astronaut_id}/assessments/latest` | Retrieve latest generated health assessment |
| Phase 2E | `GET` | `/api/v1/astronauts/{astronaut_id}/assessments` | List assessment history for astronaut |
| Phase 2E | `GET` | `/api/v1/assessments/{assessment_id}` | Retrieve individual assessment by ID |
| Phase 2E | `GET` | `/api/v1/astronauts/{astronaut_id}/alerts` | List health alerts with status/severity filters |
| Phase 2E | `GET` | `/api/v1/alerts/{alert_id}` | Retrieve individual alert by ID |
| Phase 2E | `POST` | `/api/v1/alerts/{alert_id}/acknowledge` | Acknowledge active alert |
| Phase 2E | `POST` | `/api/v1/alerts/{alert_id}/resolve` | Resolve health alert |

---

## 5. Verification & Test Suite Results

The comprehensive test suite in `backend/tests/test_phase2c_2d_2e_intelligence.py` along with all previous test suites (`test_astronauts.py`, `test_measurements.py`, `test_health.py`, `test_phase2a_foundation.py`, and `test_phase2b_baseline_engine.py`) executed with 100% success:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.3, pytest-8.4.2, pluggy-1.7.0
rootdir: D:\nasa2026
plugins: anyio-4.16.0
collected 85 items

backend/tests/test_astronauts.py .................................. [ 9%]
backend/tests/test_health.py ..                                     [10%]
backend/tests/test_measurements.py ........                         [20%]
backend/tests/test_phase2a_foundation.py .......................... [51%]
backend/tests/test_phase2b_baseline_engine.py .................... [74%]
backend/tests/test_phase2c_2d_2e_intelligence.py ...................... [100%]

======================== 85 passed, 1 warning in 1.36s ========================
```

---

## 6. Safety & Governance Disclaimers

> [!IMPORTANT]
> **DECISION-SUPPORT NOTICE & SCIENTIFIC BOUNDARIES:**
> 1. All baseline references, trend directions, Sen's slope rates of change, and assessment tiers are **non-diagnostic statistical decision-support aids**.
> 2. They **DO NOT** constitute automated medical diagnoses, clinical prescriptions, or binding NASA flight surgeon flight rules.
> 3. An emergency classification is **configurable and disabled by default**. It triggers only when an explicit operational protocol configuration is supplied; illustrative demo thresholds are explicitly marked as unvalidated engineering test rules and never presented as genuine medical emergency determinations.
> 4. **Clinical Primacy:** Normal telemetry readings must never override or dismiss reported physical symptoms. Direct crew symptom reports take precedence over statistical envelopes.
> 5. Telemetry staleness notifications reflect transmission currency and **do not** denote an acute physiological emergency.
> 6. All synthetic records and derived baselines/assessments remain strictly identified via `is_synthetic = True`.
