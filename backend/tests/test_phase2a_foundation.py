"""Phase 2A Test Suite: Measurement Catalog, Normalization, Context Metadata, and Validation."""

from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.astronaut import Astronaut
from app.models.measurement import Measurement
from app.catalog import (
    MEASUREMENT_CATALOG,
    ALIAS_MAP,
    BASELINE_ELIGIBLE_CONTEXTS,
    OPERATIONAL_TRACKING_CONTEXTS,
    EXCLUDED_CONTEXTS,
    ALL_EXERCISE_MODALITIES,
    ContextCategory,
    ExerciseModality,
    MetricCategory,
    get_canonical_type,
    get_catalog_entry,
    get_query_expansion_types,
    is_baseline_eligible,
    is_operational_context,
    is_excluded_context,
    normalize_context,
    normalize_exercise_modality,
    normalize_and_validate_measurement,
    are_measurements_comparable,
)


# ==============================================================================
# 1. CATALOG DEFINITION & LOOKUP TESTS
# ==============================================================================

def test_catalog_contains_all_canonical_metrics():
    """Verify all 9 canonical metrics and derived MAP are registered with required attributes."""
    expected_metrics = [
        "heart_rate",
        "spo2",
        "body_temperature",
        "core_temperature",
        "blood_pressure_systolic",
        "blood_pressure_diastolic",
        "respiratory_rate",
        "sleep_duration",
        "radiation_dose",
        "mean_arterial_pressure",
    ]
    for metric in expected_metrics:
        assert metric in MEASUREMENT_CATALOG
        entry = MEASUREMENT_CATALOG[metric]
        assert entry.canonical_identifier == metric
        assert entry.display_name
        assert entry.standard_unit
        assert entry.valid_range_min < entry.valid_range_max
        assert len(entry.applicable_contexts) > 0


def test_alias_resolution():
    """Test resolution of wire aliases to canonical metric identifiers."""
    assert get_canonical_type("blood_oxygen") == "spo2"
    assert get_canonical_type("spo2") == "spo2"
    assert get_canonical_type("hr") == "heart_rate"
    assert get_canonical_type("heart_rate") == "heart_rate"
    assert get_canonical_type("bp_systolic") == "blood_pressure_systolic"
    assert get_canonical_type("bp_diastolic") == "blood_pressure_diastolic"
    assert get_canonical_type("rr") == "respiratory_rate"
    assert get_canonical_type("map") == "mean_arterial_pressure"
    assert get_canonical_type("unknown_metric") is None
    assert get_canonical_type(None) is None


# ==============================================================================
# 2. TEMPERATURE INDEPENDENCE & STRICT SEPARATION TESTS
# ==============================================================================

def test_temperature_strict_independence():
    """Verify body_temperature and core_temperature have zero cross-aliasing."""
    # Canonical resolution must remain distinct
    assert get_canonical_type("body_temperature") == "body_temperature"
    assert get_canonical_type("core_temperature") == "core_temperature"

    # Accepted aliases must NOT cross-reference
    body_entry = MEASUREMENT_CATALOG["body_temperature"]
    core_entry = MEASUREMENT_CATALOG["core_temperature"]
    assert "core_temperature" not in body_entry.accepted_aliases
    assert "body_temperature" not in core_entry.accepted_aliases

    # Query expansion must be strictly isolated
    assert get_query_expansion_types("body_temperature") == ["body_temperature"]
    assert get_query_expansion_types("core_temperature") == ["core_temperature"]

    # Comparability between the two must fail
    m_body = {"measurement_type": "body_temperature", "context": "resting_cabin"}
    m_core = {"measurement_type": "core_temperature", "context": "resting_cabin"}
    comp = are_measurements_comparable(m_body, m_core)
    assert not comp.are_comparable
    assert "measurement_type" in comp.mismatched_dimensions
    assert "distinct physiological metrics" in comp.reason


# ==============================================================================
# 3. SPO2 COMPATIBLE ALIASING TESTS
# ==============================================================================

def test_spo2_compatible_aliasing():
    """Verify spo2 and blood_oxygen expand bi-directionally and are comparable."""
    spo2_exp = get_query_expansion_types("spo2")
    bo_exp = get_query_expansion_types("blood_oxygen")

    assert "spo2" in spo2_exp and "blood_oxygen" in spo2_exp
    assert "spo2" in bo_exp and "blood_oxygen" in bo_exp

    m_spo2 = {"measurement_type": "spo2", "context": "resting_cabin"}
    m_bo = {"measurement_type": "blood_oxygen", "context": "resting_cabin"}
    comp = are_measurements_comparable(m_spo2, m_bo)
    assert comp.are_comparable


# ==============================================================================
# 4. NORMALIZATION & UNIT CONVERSION TESTS
# ==============================================================================

def test_unit_normalization_and_temperature_conversion():
    """Test unit conversions, notably Fahrenheit to Celsius."""
    # 98.6°F should convert to 37.0°C
    res_f = normalize_and_validate_measurement(
        measurement_type="body_temperature",
        value=98.6,
        unit="fahrenheit",
    )
    assert res_f.is_valid
    assert res_f.normalized_unit == "celsius"
    assert pytest.approx(res_f.normalized_value, 0.1) == 37.0

    # 36.8°C remains Celsius
    res_c = normalize_and_validate_measurement(
        measurement_type="body_temperature",
        value=36.8,
        unit="celsius",
    )
    assert res_c.is_valid
    assert res_c.normalized_unit == "celsius"
    assert res_c.normalized_value == 36.8

    # Invalid unit rejected
    res_inv = normalize_and_validate_measurement(
        measurement_type="body_temperature",
        value=37.0,
        unit="kelvin",
    )
    assert not res_inv.is_valid
    assert any("Invalid unit" in err for err in res_inv.errors)


def test_unit_normalization_other_metrics():
    """Verify unit normalization for heart rate and SpO2."""
    res_hr = normalize_and_validate_measurement("hr", 72, "beats/min")
    assert res_hr.is_valid
    assert res_hr.normalized_type == "heart_rate"
    assert res_hr.normalized_unit == "bpm"

    res_spo2 = normalize_and_validate_measurement("blood_oxygen", 98, "percent")
    assert res_spo2.is_valid
    assert res_spo2.normalized_type == "spo2"
    assert res_spo2.normalized_unit == "%"


# ==============================================================================
# 5. PHYSICAL RANGE SANITY VALIDATION TESTS
# ==============================================================================

@pytest.mark.parametrize(
    "metric, valid_val, invalid_low, invalid_high, unit",
    [
        ("heart_rate", 75.0, 25.0, 230.0, "bpm"),
        ("spo2", 98.0, 65.0, 105.0, "%"),
        ("body_temperature", 36.8, 33.0, 43.0, "celsius"),
        ("core_temperature", 37.2, 34.0, 43.0, "celsius"),
        ("blood_pressure_systolic", 120.0, 50.0, 240.0, "mmHg"),
        ("blood_pressure_diastolic", 80.0, 30.0, 140.0, "mmHg"),
        ("respiratory_rate", 14.0, 2.0, 50.0, "breaths/min"),
        ("sleep_duration", 8.0, -1.0, 20.0, "hours"),
        ("radiation_dose", 1.5, -0.5, 600.0, "mSv"),
    ],
)
def test_physical_range_boundaries(metric, valid_val, invalid_low, invalid_high, unit):
    """Verify values inside boundaries pass, and out-of-boundary values fail."""
    # Valid
    val_ok = normalize_and_validate_measurement(metric, valid_val, unit)
    assert val_ok.is_valid

    # Too low
    val_low = normalize_and_validate_measurement(metric, invalid_low, unit)
    assert not val_low.is_valid
    assert any("physically plausible range" in err for err in val_low.errors)

    # Too high
    val_high = normalize_and_validate_measurement(metric, invalid_high, unit)
    assert not val_high.is_valid
    assert any("physically plausible range" in err for err in val_high.errors)


# ==============================================================================
# 6. CORE TEMPERATURE SITE RESTRICTION TESTS
# ==============================================================================

def test_core_temperature_superficial_site_rejection():
    """Verify that core_temperature rejects superficial measurement sites."""
    # Superficial site like skin must fail for core_temperature
    res_bad = normalize_and_validate_measurement(
        measurement_type="core_temperature",
        value=37.2,
        unit="celsius",
        measurement_site="skin",
    )
    assert not res_bad.is_valid
    assert any("Superficial measurement site" in err for err in res_bad.errors)

    # Deep visceral source passes
    res_good = normalize_and_validate_measurement(
        measurement_type="core_temperature",
        value=37.2,
        unit="celsius",
        measurement_site="gastrointestinal_pill",
    )
    assert res_good.is_valid


# ==============================================================================
# 7. CONTEXT TAXONOMY & BASELINE ELIGIBILITY TESTS
# ==============================================================================

def test_context_taxonomy_tiers():
    """Verify 3-tier functional taxonomy and baseline eligibility rules."""
    # Tier A: Physiological Baseline-Eligible
    for ctx in ["resting_cabin", "sleep_cycle", "exercise_active", "exercise_recovery"]:
        assert is_baseline_eligible(ctx)
        assert not is_operational_context(ctx)
        assert not is_excluded_context(ctx)

    # Tier B: Operational Tracking Context
    assert not is_baseline_eligible("eva_operational")
    assert is_operational_context("eva_operational")
    assert not is_excluded_context("eva_operational")

    # Tier C: Excluded Ingestion Catch-Alls
    for ctx in ["unknown", "other", None, ""]:
        assert not is_baseline_eligible(ctx)
        assert not is_operational_context(ctx)
        assert is_excluded_context(ctx)


def test_context_normalization():
    """Test whitespace and casing tolerance during context normalization."""
    assert normalize_context("  RESTING_CABIN  ") == "resting_cabin"
    assert normalize_context("EVA_OPERATIONAL") == "eva_operational"
    assert normalize_context("invalid_context_name") == "unknown"


# ==============================================================================
# 8. EXERCISE MODALITY TAXONOMY & ISOLATION TESTS
# ==============================================================================

def test_exercise_modality_taxonomy():
    """Verify recognized modalities and normalization."""
    expected = {"ared_resistive", "cevis_aerobic", "t2_treadmill", "other", "unknown"}
    assert set(ALL_EXERCISE_MODALITIES) == expected

    assert normalize_exercise_modality(" ARED_RESISTIVE ") == "ared_resistive"
    assert normalize_exercise_modality("unknown_gadget") == "unknown"


def test_exercise_modality_isolation_rule():
    """Verify telemetry from different exercise equipment is NEVER comparable."""
    m_ared = {
        "measurement_type": "heart_rate",
        "context": "exercise_active",
        "exercise_modality": "ared_resistive",
    }
    m_cevis = {
        "measurement_type": "heart_rate",
        "context": "exercise_active",
        "exercise_modality": "cevis_aerobic",
    }
    m_t2 = {
        "measurement_type": "heart_rate",
        "context": "exercise_active",
        "exercise_modality": "t2_treadmill",
    }

    # ARED vs CEVIS mismatch
    comp1 = are_measurements_comparable(m_ared, m_cevis)
    assert not comp1.are_comparable
    assert "exercise_modality" in comp1.mismatched_dimensions

    # ARED vs T2 mismatch
    comp2 = are_measurements_comparable(m_ared, m_t2)
    assert not comp2.are_comparable
    assert "exercise_modality" in comp2.mismatched_dimensions

    # Same modality matches
    m_ared_2 = dict(m_ared)
    comp3 = are_measurements_comparable(m_ared, m_ared_2)
    assert comp3.are_comparable


# ==============================================================================
# 9. GENERAL COMPARABILITY ENGINE TESTS
# ==============================================================================

def test_comparability_context_isolation():
    """Verify measurements from different physiological contexts are not comparable."""
    m_rest = {"measurement_type": "heart_rate", "context": "resting_cabin"}
    m_sleep = {"measurement_type": "heart_rate", "context": "sleep_cycle"}
    m_eva = {"measurement_type": "heart_rate", "context": "eva_operational"}

    # Resting vs Sleep
    comp_rs = are_measurements_comparable(m_rest, m_sleep)
    assert not comp_rs.are_comparable
    assert "context" in comp_rs.mismatched_dimensions

    # Resting vs EVA
    comp_re = are_measurements_comparable(m_rest, m_eva)
    assert not comp_re.are_comparable
    assert "context" in comp_re.mismatched_dimensions
    assert "EVA" in comp_re.reason


def test_core_temperature_site_comparability():
    """Verify core temperature measurements with disparate sites are not comparable."""
    m_pill = {
        "measurement_type": "core_temperature",
        "context": "resting_cabin",
        "measurement_site": "ingestible_telemetric_pill",
    }
    m_tympanic = {
        "measurement_type": "core_temperature",
        "context": "resting_cabin",
        "measurement_site": "tympanic",
    }
    comp = are_measurements_comparable(m_pill, m_tympanic)
    assert not comp.are_comparable
    assert "measurement_site" in comp.mismatched_dimensions


# ==============================================================================
# 10. API ENDPOINTS & BACKWARD COMPATIBILITY INTEGRATION TESTS
# ==============================================================================

def test_api_catalog_discovery_endpoint(client: TestClient):
    """Test GET /api/v1/measurements/catalog returns catalog, context, and modality metadata."""
    res = client.get("/api/v1/measurements/catalog")
    assert res.status_code == 200
    data = res.json()

    assert "metrics" in data
    assert "contexts" in data
    assert "exercise_modalities" in data

    metrics = {m["canonical_identifier"]: m for m in data["metrics"]}
    assert "spo2" in metrics
    assert "body_temperature" in metrics
    assert "core_temperature" in metrics

    assert "resting_cabin" in data["contexts"]["baseline_eligible"]
    assert "eva_operational" in data["contexts"]["operational_tracking"]
    assert "unknown" in data["contexts"]["excluded"]


def test_api_spo2_alias_expansion(
    client: TestClient, db_session: Session, sample_astronaut: Astronaut
):
    """Verify querying ?measurement_type=blood_oxygen or ?measurement_type=spo2 returns both records."""
    now = datetime.now(timezone.utc)
    # Seed both a 'spo2' record and a 'blood_oxygen' record
    m1 = Measurement(
        id="meas-spo2-01",
        astronaut_id=sample_astronaut.id,
        measurement_type="spo2",
        value=98.0,
        unit="%",
        measured_at=now - timedelta(minutes=10),
        source="Pulse Oximeter",
        context="resting_cabin",
    )
    m2 = Measurement(
        id="meas-spo2-02",
        astronaut_id=sample_astronaut.id,
        measurement_type="blood_oxygen",
        value=97.5,
        unit="%",
        measured_at=now - timedelta(minutes=5),
        source="Pulse Oximeter",
        context="resting_cabin",
    )
    db_session.add_all([m1, m2])
    db_session.commit()

    # Query with alias blood_oxygen -> returns both
    res_bo = client.get(
        f"/api/v1/astronauts/{sample_astronaut.id}/measurements?measurement_type=blood_oxygen"
    )
    assert res_bo.status_code == 200
    data_bo = res_bo.json()["data"]
    ret_types_bo = {r["measurement_type"] for r in data_bo}
    assert "spo2" in ret_types_bo
    assert "blood_oxygen" in ret_types_bo

    # Query with canonical spo2 -> returns both
    res_sp = client.get(
        f"/api/v1/astronauts/{sample_astronaut.id}/measurements?measurement_type=spo2"
    )
    assert res_sp.status_code == 200
    data_sp = res_sp.json()["data"]
    ret_types_sp = {r["measurement_type"] for r in data_sp}
    assert "spo2" in ret_types_sp
    assert "blood_oxygen" in ret_types_sp


def test_api_temperature_strict_filtering(
    client: TestClient, db_session: Session, sample_astronaut: Astronaut
):
    """Verify querying body_temperature NEVER returns core_temperature, and vice versa."""
    now = datetime.now(timezone.utc)
    m_body = Measurement(
        id="meas-temp-body",
        astronaut_id=sample_astronaut.id,
        measurement_type="body_temperature",
        value=36.7,
        unit="celsius",
        measured_at=now - timedelta(minutes=10),
        source="Skin Sensor",
        context="resting_cabin",
    )
    m_core = Measurement(
        id="meas-temp-core",
        astronaut_id=sample_astronaut.id,
        measurement_type="core_temperature",
        value=37.3,
        unit="celsius",
        measured_at=now - timedelta(minutes=5),
        source="Ingestible Pill",
        context="resting_cabin",
    )
    db_session.add_all([m_body, m_core])
    db_session.commit()

    # Query body_temperature -> returns ONLY body_temperature
    res_body = client.get(
        f"/api/v1/astronauts/{sample_astronaut.id}/measurements?measurement_type=body_temperature"
    )
    assert res_body.status_code == 200
    data_body = res_body.json()["data"]
    assert len(data_body) == 1
    assert data_body[0]["measurement_type"] == "body_temperature"

    # Query core_temperature -> returns ONLY core_temperature
    res_core = client.get(
        f"/api/v1/astronauts/{sample_astronaut.id}/measurements?measurement_type=core_temperature"
    )
    assert res_core.status_code == 200
    data_core = res_core.json()["data"]
    assert len(data_core) == 1
    assert data_core[0]["measurement_type"] == "core_temperature"


def test_api_context_and_modality_filters(
    client: TestClient, db_session: Session, sample_astronaut: Astronaut
):
    """Verify new query filters for context and exercise_modality."""
    now = datetime.now(timezone.utc)
    m_cabin = Measurement(
        id="meas-flt-01",
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        value=68.0,
        unit="bpm",
        measured_at=now - timedelta(hours=2),
        source="BioHarness",
        context="resting_cabin",
    )
    m_ared = Measurement(
        id="meas-flt-02",
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        value=150.0,
        unit="bpm",
        measured_at=now - timedelta(hours=1),
        source="BioHarness",
        context="exercise_active",
        exercise_modality="ared_resistive",
    )
    m_cevis = Measurement(
        id="meas-flt-03",
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        value=140.0,
        unit="bpm",
        measured_at=now,
        source="BioHarness",
        context="exercise_active",
        exercise_modality="cevis_aerobic",
    )
    db_session.add_all([m_cabin, m_ared, m_cevis])
    db_session.commit()

    # Filter by context
    res_ctx = client.get(
        f"/api/v1/astronauts/{sample_astronaut.id}/measurements?context=exercise_active"
    )
    assert res_ctx.status_code == 200
    data_ctx = res_ctx.json()["data"]
    assert len(data_ctx) == 2
    for item in data_ctx:
        assert item["context"] == "exercise_active"

    # Filter by exercise_modality
    res_mod = client.get(
        f"/api/v1/astronauts/{sample_astronaut.id}/measurements?exercise_modality=ared_resistive"
    )
    assert res_mod.status_code == 200
    data_mod = res_mod.json()["data"]
    assert len(data_mod) == 1
    assert data_mod[0]["id"] == "meas-flt-02"
    assert data_mod[0]["exercise_modality"] == "ared_resistive"


def test_phase2a_metadata_persistence_and_serialization(
    client: TestClient, db_session: Session, sample_astronaut: Astronaut
):
    """Verify that Phase 2A metadata fields persist and serialize without breaking Phase 1 contract."""
    now = datetime.now(timezone.utc)
    meas = Measurement(
        id="meas-meta-01",
        astronaut_id=sample_astronaut.id,
        measurement_type="core_temperature",
        value=37.4,
        unit="celsius",
        measured_at=now,
        source="LSDA Ingestible Core Pill",
        context="resting_cabin",
        data_quality="nominal",
        is_synthetic=True,
        exercise_modality=None,
        measurement_site="gastrointestinal_tract",
        measurement_method="telemetric_radiometry",
        sensor_model="CorTemp-Sensor-100",
        mission_day=14,
    )
    db_session.add(meas)
    db_session.commit()

    res = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/measurements")
    assert res.status_code == 200
    records = res.json()["data"]
    item = next(r for r in records if r["id"] == "meas-meta-01")

    # Phase 1 required fields
    assert item["id"] == "meas-meta-01"
    assert item["astronaut_id"] == sample_astronaut.id
    assert item["measurement_type"] == "core_temperature"
    assert item["value"] == 37.4
    assert item["unit"] == "celsius"
    assert item["source"] == "LSDA Ingestible Core Pill"
    assert item["context"] == "resting_cabin"
    assert item["data_quality"] == "nominal"
    assert item["is_synthetic"] is True

    # Phase 2A optional metadata fields
    assert item["measurement_site"] == "gastrointestinal_tract"
    assert item["measurement_method"] == "telemetric_radiometry"
    assert item["sensor_model"] == "CorTemp-Sensor-100"
    assert item["mission_day"] == 14
    assert item["exercise_modality"] is None
