"""Phase 2B Test Suite: Personal Baseline Calculation Engine, Operational Envelopes, and APIs."""

from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.astronaut import Astronaut
from app.models.measurement import Measurement
from app.models.baseline import AstronautBaseline
from app.core.exceptions import (
    AstronautNotFoundException,
    BaselineNotFoundException,
    IneligibleBaselineContextException,
    InsufficientMeasurementsException,
)
from app.services.baseline_service import (
    calculate_baseline_statistics,
    calculate_and_persist_baseline,
    get_baseline_for_astronaut,
    list_baselines_for_astronaut,
)


# ==============================================================================
# 1. PURE STATISTICAL ENGINE TESTS
# ==============================================================================

def test_statistical_calculations_median_and_quartiles():
    """Verify median, Q1 (q25), Q3 (q75), and IQR calculations on known distribution."""
    # 7 numbers: [60, 64, 68, 72, 76, 80, 84]
    data = [60.0, 64.0, 68.0, 72.0, 76.0, 80.0, 84.0]
    stats = calculate_baseline_statistics(data)

    assert stats["median"] == 72.0
    assert stats["q25"] == 66.0
    assert stats["q75"] == 78.0
    assert stats["iqr"] == 12.0
    assert stats["min_value"] == 60.0
    assert stats["max_value"] == 84.0


def test_statistical_calculations_mean_and_stdev():
    """Verify sample mean and sample standard deviation calculations."""
    data = [10.0, 20.0, 30.0, 40.0, 50.0]
    stats = calculate_baseline_statistics(data)

    assert stats["mean"] == 30.0
    # Standard deviation of [10, 20, 30, 40, 50] with ddof=1 is sqrt(250) ~ 15.8114
    assert pytest.approx(stats["std_dev"], 0.001) == 15.8114


def test_statistical_calculations_robust_scale_and_zero_iqr():
    """Verify Gaussian-equivalent scale estimate (IQR / 1.349) and safe zero-IQR handling."""
    # Constant data: IQR is 0.0
    data_constant = [70.0, 70.0, 70.0, 70.0]
    stats_const = calculate_baseline_statistics(data_constant)
    assert stats_const["iqr"] == 0.0
    assert stats_const["robust_scale_iqr"] == 0.0
    assert stats_const["std_dev"] == 0.0

    # Data with positive IQR: IQR = 13.49 -> scale estimate ~ 10.0
    data_spread = [50.0, 60.0, 70.0, 73.49, 80.0]
    stats_spread = calculate_baseline_statistics(data_spread)
    assert stats_spread["robust_scale_iqr"] == round(stats_spread["iqr"] / 1.349, 4)


def test_statistical_calculations_single_sample():
    """Verify single-sample edge case handles robustly without division by zero."""
    data_single = [74.5]
    stats = calculate_baseline_statistics(data_single)

    assert stats["median"] == 74.5
    assert stats["q25"] == 74.5
    assert stats["q75"] == 74.5
    assert stats["iqr"] == 0.0
    assert stats["robust_scale_iqr"] == 0.0
    assert stats["mean"] == 74.5
    assert stats["std_dev"] == 0.0
    assert stats["min_value"] == 74.5
    assert stats["max_value"] == 74.5


def test_statistical_calculations_empty_dataset():
    """Verify empty dataset raises ValueError."""
    with pytest.raises(ValueError, match="Cannot calculate statistics for empty dataset"):
        calculate_baseline_statistics([])


# ==============================================================================
# 2. BASELINE CALCULATION & DATA QUALITY TESTS
# ==============================================================================

def test_baseline_calculation_basic_nominal(db_session: Session, sample_astronaut: Astronaut):
    """Seed nominal measurements and verify baseline calculation and persistence."""
    now = datetime.now(timezone.utc)
    for i, hr in enumerate([68.0, 70.0, 72.0, 74.0, 76.0]):
        m = Measurement(
            id=f"meas-hr-{i}",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=hr,
            unit="bpm",
            measured_at=now - timedelta(hours=i),
            source="BioHarness",
            context="resting_cabin",
            data_quality="nominal",
            is_synthetic=True,
        )
        db_session.add(m)
    db_session.commit()

    baseline = calculate_and_persist_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        context="resting_cabin",
    )

    assert baseline.astronaut_id == sample_astronaut.id
    assert baseline.measurement_type == "heart_rate"
    assert baseline.context == "resting_cabin"
    assert baseline.unit == "bpm"
    assert baseline.sample_count == 5
    assert baseline.nominal_count == 5
    assert baseline.degraded_count == 0
    assert baseline.median == 72.0
    assert baseline.min_value == 68.0
    assert baseline.max_value == 76.0
    assert baseline.window_start is not None
    assert baseline.window_end is not None


def test_baseline_data_quality_handling_and_transparency(
    db_session: Session, sample_astronaut: Astronaut
):
    """Verify degraded telemetry is segregated and transparently reported."""
    now = datetime.now(timezone.utc)
    # 3 nominal measurements (values 70, 72, 74)
    for i, hr in enumerate([70.0, 72.0, 74.0]):
        m = Measurement(
            id=f"meas-nom-{i}",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=hr,
            unit="bpm",
            measured_at=now - timedelta(hours=i + 5),
            source="BioHarness",
            context="resting_cabin",
            data_quality="nominal",
            is_synthetic=True,
        )
        db_session.add(m)

    # 2 degraded/noisy measurements (values 100, 110)
    for i, hr in enumerate([100.0, 110.0]):
        m = Measurement(
            id=f"meas-deg-{i}",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=hr,
            unit="bpm",
            measured_at=now - timedelta(hours=i),
            source="BioHarness",
            context="resting_cabin",
            data_quality="noisy",
            is_synthetic=True,
        )
        db_session.add(m)
    db_session.commit()

    # Default: include_degraded=False -> only 3 nominal measurements included
    base_nominal = calculate_and_persist_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        context="resting_cabin",
        include_degraded=False,
    )
    assert base_nominal.sample_count == 3
    assert base_nominal.nominal_count == 3
    assert base_nominal.degraded_count == 2
    assert base_nominal.median == 72.0

    # Explicit: include_degraded=True -> all 5 measurements included
    base_all = calculate_and_persist_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        context="resting_cabin",
        include_degraded=True,
    )
    assert base_all.sample_count == 5
    assert base_all.nominal_count == 3
    assert base_all.degraded_count == 2


def test_invalid_measurement_exclusion(db_session: Session, sample_astronaut: Astronaut):
    """Verify physically impossible measurements are excluded by catalog validation."""
    now = datetime.now(timezone.utc)
    # 3 valid HR (70, 72, 74)
    for i, hr in enumerate([70.0, 72.0, 74.0]):
        m = Measurement(
            id=f"meas-val-{i}",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=hr,
            unit="bpm",
            measured_at=now - timedelta(hours=i),
            source="BioHarness",
            context="resting_cabin",
            data_quality="nominal",
            is_synthetic=True,
        )
        db_session.add(m)

    # 1 invalid HR (300.0 bpm, exceeds valid_range_max 220)
    m_invalid = Measurement(
        id="meas-inv-01",
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        value=300.0,
        unit="bpm",
        measured_at=now - timedelta(minutes=10),
        source="BioHarness",
        context="resting_cabin",
        data_quality="nominal",
        is_synthetic=True,
    )
    db_session.add(m_invalid)
    db_session.commit()

    baseline = calculate_and_persist_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        context="resting_cabin",
    )
    # The invalid reading must be excluded
    assert baseline.sample_count == 3
    assert baseline.max_value == 74.0


# ==============================================================================
# 3. ALIASING & TEMPERATURE INDEPENDENCE TESTS
# ==============================================================================

def test_alias_normalization_in_baseline(db_session: Session, sample_astronaut: Astronaut):
    """Verify blood_oxygen measurements formulate canonical spo2 baselines."""
    now = datetime.now(timezone.utc)
    for i, bo in enumerate([97.0, 98.0, 99.0]):
        m = Measurement(
            id=f"meas-bo-{i}",
            astronaut_id=sample_astronaut.id,
            measurement_type="blood_oxygen",  # wire alias
            value=bo,
            unit="%",
            measured_at=now - timedelta(hours=i),
            source="PulseOx",
            context="resting_cabin",
            data_quality="nominal",
            is_synthetic=True,
        )
        db_session.add(m)
    db_session.commit()

    # Calculate requesting alias blood_oxygen
    baseline = calculate_and_persist_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="blood_oxygen",
        context="resting_cabin",
    )
    assert baseline.measurement_type == "spo2"  # canonical identifier persisted
    assert baseline.sample_count == 3
    assert baseline.median == 98.0


def test_temperature_strict_independence_in_baseline(
    db_session: Session, sample_astronaut: Astronaut
):
    """Verify body_temperature and core_temperature calculate completely independent baselines."""
    now = datetime.now(timezone.utc)
    # Body temp (skin probe): 36.6, 36.7, 36.8
    for i, bt in enumerate([36.6, 36.7, 36.8]):
        m = Measurement(
            id=f"meas-bt-{i}",
            astronaut_id=sample_astronaut.id,
            measurement_type="body_temperature",
            value=bt,
            unit="celsius",
            measured_at=now - timedelta(hours=i + 5),
            source="Skin Sensor",
            context="resting_cabin",
            data_quality="nominal",
            is_synthetic=True,
        )
        db_session.add(m)

    # Core temp (deep visceral ingestible pill): 37.3, 37.4, 37.5
    for i, ct in enumerate([37.3, 37.4, 37.5]):
        m = Measurement(
            id=f"meas-ct-{i}",
            astronaut_id=sample_astronaut.id,
            measurement_type="core_temperature",
            value=ct,
            unit="celsius",
            measured_at=now - timedelta(hours=i),
            source="LSDA Ingestible Core Pill",
            context="resting_cabin",
            data_quality="nominal",
            is_synthetic=True,
        )
        db_session.add(m)
    db_session.commit()

    # Calculate body temp baseline
    b_body = calculate_and_persist_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="body_temperature",
        context="resting_cabin",
    )
    assert b_body.sample_count == 3
    assert b_body.median == 36.7
    assert b_body.max_value == 36.8  # No 37.x from core temp!

    # Calculate core temp baseline
    b_core = calculate_and_persist_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="core_temperature",
        context="resting_cabin",
    )
    assert b_core.sample_count == 3
    assert b_core.median == 37.4
    assert b_core.min_value == 37.3  # No 36.x from body temp!


# ==============================================================================
# 4. CONTEXT & EXERCISE MODALITY ISOLATION TESTS
# ==============================================================================

def test_exercise_modality_isolation_in_baseline(
    db_session: Session, sample_astronaut: Astronaut
):
    """Verify ARED resistive exercise is strictly isolated from CEVIS aerobic cycling."""
    now = datetime.now(timezone.utc)
    # ARED resistive HR (high strain): 150, 155, 160
    for i, hr in enumerate([150.0, 155.0, 160.0]):
        m = Measurement(
            id=f"meas-ared-{i}",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=hr,
            unit="bpm",
            measured_at=now - timedelta(hours=i + 5),
            source="BioHarness",
            context="exercise_active",
            exercise_modality="ared_resistive",
            data_quality="nominal",
            is_synthetic=True,
        )
        db_session.add(m)

    # CEVIS aerobic HR (cadence aerobic): 120, 125, 130
    for i, hr in enumerate([120.0, 125.0, 130.0]):
        m = Measurement(
            id=f"meas-cevis-{i}",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=hr,
            unit="bpm",
            measured_at=now - timedelta(hours=i),
            source="BioHarness",
            context="exercise_active",
            exercise_modality="cevis_aerobic",
            data_quality="nominal",
            is_synthetic=True,
        )
        db_session.add(m)
    db_session.commit()

    # Calculate ARED baseline
    base_ared = calculate_and_persist_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        context="exercise_active",
        exercise_modality="ared_resistive",
    )
    assert base_ared.exercise_modality == "ared_resistive"
    assert base_ared.sample_count == 3
    assert base_ared.median == 155.0

    # Calculate CEVIS baseline
    base_cevis = calculate_and_persist_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        context="exercise_active",
        exercise_modality="cevis_aerobic",
    )
    assert base_cevis.exercise_modality == "cevis_aerobic"
    assert base_cevis.sample_count == 3
    assert base_cevis.median == 125.0


def test_eva_operational_context_exclusion(db_session: Session, sample_astronaut: Astronaut):
    """Verify calculating a baseline with context=eva_operational is strictly rejected."""
    with pytest.raises(IneligibleBaselineContextException, match="EVA context vitals must not be pooled"):
        calculate_and_persist_baseline(
            db=db_session,
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            context="eva_operational",
        )


def test_unclassified_context_exclusion(db_session: Session, sample_astronaut: Astronaut):
    """Verify unknown or unclassified contexts are rejected from baseline formulation."""
    with pytest.raises(IneligibleBaselineContextException):
        calculate_and_persist_baseline(
            db=db_session,
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            context="unknown",
        )


# ==============================================================================
# 5. MULTI-ASTRONAUT ISOLATION & PERSISTENCE REFRESH
# ==============================================================================

def test_multi_astronaut_baseline_isolation(db_session: Session):
    """Verify baselines for separate astronauts remain completely isolated."""
    now = datetime.now(timezone.utc)
    # Astronaut A
    astro_a = Astronaut(
        id="astro-alpha",
        name="Commander Alpha",
        crew_role="Commander",
        mission_name="Artemis X",
        mission_day=10,
    )
    # Astronaut B
    astro_b = Astronaut(
        id="astro-bravo",
        name="Pilot Bravo",
        crew_role="Pilot",
        mission_name="Artemis X",
        mission_day=10,
    )
    db_session.add_all([astro_a, astro_b])
    db_session.commit()

    # Astro A has resting HR ~ 60 bpm
    for i, hr in enumerate([58.0, 60.0, 62.0]):
        db_session.add(
            Measurement(
                id=f"meas-a-{i}",
                astronaut_id=astro_a.id,
                measurement_type="heart_rate",
                value=hr,
                unit="bpm",
                measured_at=now - timedelta(hours=i),
                source="BioHarness",
                context="resting_cabin",
                data_quality="nominal",
            )
        )

    # Astro B has resting HR ~ 80 bpm
    for i, hr in enumerate([78.0, 80.0, 82.0]):
        db_session.add(
            Measurement(
                id=f"meas-b-{i}",
                astronaut_id=astro_b.id,
                measurement_type="heart_rate",
                value=hr,
                unit="bpm",
                measured_at=now - timedelta(hours=i),
                source="BioHarness",
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    base_a = calculate_and_persist_baseline(db_session, astro_a.id, "heart_rate", "resting_cabin")
    base_b = calculate_and_persist_baseline(db_session, astro_b.id, "heart_rate", "resting_cabin")

    assert base_a.median == 60.0
    assert base_a.sample_count == 3
    assert base_b.median == 80.0
    assert base_b.sample_count == 3


def test_baseline_idempotent_refresh(db_session: Session, sample_astronaut: Astronaut):
    """Verify recalculating an existing baseline updates the record instead of duplicating it."""
    now = datetime.now(timezone.utc)
    for i, hr in enumerate([70.0, 72.0]):
        db_session.add(
            Measurement(
                id=f"meas-ref-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=hr,
                unit="bpm",
                measured_at=now - timedelta(hours=i + 5),
                source="BioHarness",
                context="resting_cabin",
            )
        )
    db_session.commit()

    base1 = calculate_and_persist_baseline(db_session, sample_astronaut.id, "heart_rate", "resting_cabin")
    orig_id = base1.id
    assert base1.sample_count == 2
    assert base1.median == 71.0

    # Add a third measurement
    db_session.add(
        Measurement(
            id="meas-ref-2",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=74.0,
            unit="bpm",
            measured_at=now,
            source="BioHarness",
            context="resting_cabin",
        )
    )
    db_session.commit()

    base2 = calculate_and_persist_baseline(db_session, sample_astronaut.id, "heart_rate", "resting_cabin")
    assert base2.id == orig_id  # Reused same baseline row
    assert base2.sample_count == 3
    assert base2.median == 72.0


def test_insufficient_measurements_exception(db_session: Session, sample_astronaut: Astronaut):
    """Verify empty measurement history raises InsufficientMeasurementsException."""
    with pytest.raises(InsufficientMeasurementsException):
        calculate_and_persist_baseline(
            db=db_session,
            astronaut_id=sample_astronaut.id,
            measurement_type="respiratory_rate",
            context="resting_cabin",
        )


# ==============================================================================
# 6. API ENDPOINT INTEGRATION TESTS
# ==============================================================================

def test_api_calculate_baseline_success(
    client: TestClient, db_session: Session, sample_astronaut: Astronaut
):
    """Verify POST /api/v1/astronauts/{id}/baselines/calculate returns structured envelope."""
    now = datetime.now(timezone.utc)
    for i, hr in enumerate([65.0, 70.0, 75.0, 80.0]):
        db_session.add(
            Measurement(
                id=f"meas-api-calc-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=hr,
                unit="bpm",
                measured_at=now - timedelta(hours=i),
                source="BioHarness",
                context="resting_cabin",
            )
        )
    db_session.commit()

    payload = {
        "measurement_type": "heart_rate",
        "context": "resting_cabin",
    }
    res = client.post(
        f"/api/v1/astronauts/{sample_astronaut.id}/baselines/calculate",
        json=payload,
    )
    assert res.status_code == 200
    data = res.json()

    assert data["astronaut_id"] == sample_astronaut.id
    assert data["measurement_type"] == "heart_rate"
    assert data["context"] == "resting_cabin"
    assert data["unit"] == "bpm"

    # Personal Operational Envelope assertions
    env = data["envelope"]
    assert env["median"] == 72.5
    assert env["sample_count"] == 4
    assert env["iqr"] > 0
    assert env["robust_scale_iqr"] > 0
    assert "Statistical reference values only" in env["disclaimer"]

    # Quality summary
    qs = data["quality_summary"]
    assert qs["nominal"] == 4
    assert qs["degraded"] == 0


def test_api_list_and_get_baselines(
    client: TestClient, db_session: Session, sample_astronaut: Astronaut
):
    """Verify listing and retrieving calculated baselines."""
    now = datetime.now(timezone.utc)
    # Seed HR and SpO2 measurements
    for i, val in enumerate([70.0, 72.0, 74.0]):
        db_session.add(
            Measurement(
                id=f"meas-api-hr-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=val,
                unit="bpm",
                measured_at=now - timedelta(hours=i),
                source="BioHarness",
                context="resting_cabin",
            )
        )
        db_session.add(
            Measurement(
                id=f"meas-api-sp-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="spo2",
                value=98.0 + (i * 0.5),
                unit="%",
                measured_at=now - timedelta(hours=i),
                source="PulseOx",
                context="resting_cabin",
            )
        )
    db_session.commit()

    # Calculate both
    client.post(
        f"/api/v1/astronauts/{sample_astronaut.id}/baselines/calculate",
        json={"measurement_type": "heart_rate", "context": "resting_cabin"},
    )
    client.post(
        f"/api/v1/astronauts/{sample_astronaut.id}/baselines/calculate",
        json={"measurement_type": "spo2", "context": "resting_cabin"},
    )

    # 1. List baselines
    res_list = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/baselines")
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] == 2
    types = {b["measurement_type"] for b in list_data["data"]}
    assert "heart_rate" in types and "spo2" in types

    # 2. Get specific baseline by canonical name
    res_hr = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/baselines/heart_rate")
    assert res_hr.status_code == 200
    assert res_hr.json()["measurement_type"] == "heart_rate"

    # 3. Get specific baseline by alias (blood_oxygen -> spo2)
    res_bo = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/baselines/blood_oxygen")
    assert res_bo.status_code == 200
    assert res_bo.json()["measurement_type"] == "spo2"


def test_api_error_responses(
    client: TestClient, db_session: Session, sample_astronaut: Astronaut
):
    """Verify standard error envelopes for edge conditions."""
    # 1. Non-existent astronaut (404)
    res_404 = client.post(
        "/api/v1/astronauts/astro-nonexistent/baselines/calculate",
        json={"measurement_type": "heart_rate"},
    )
    assert res_404.status_code == 404
    assert res_404.json()["error"]["code"] == "ASTRONAUT_NOT_FOUND"

    # 2. Ineligible EVA context (400)
    res_eva = client.post(
        f"/api/v1/astronauts/{sample_astronaut.id}/baselines/calculate",
        json={"measurement_type": "heart_rate", "context": "eva_operational"},
    )
    assert res_eva.status_code == 400
    assert res_eva.json()["error"]["code"] == "INELIGIBLE_BASELINE_CONTEXT"

    # 3. Insufficient measurements (422)
    res_empty = client.post(
        f"/api/v1/astronauts/{sample_astronaut.id}/baselines/calculate",
        json={"measurement_type": "radiation_dose", "context": "resting_cabin"},
    )
    assert res_empty.status_code == 422
    assert res_empty.json()["error"]["code"] == "INSUFFICIENT_MEASUREMENTS"

    # 4. Non-existent baseline lookup (404)
    res_no_base = client.get(
        f"/api/v1/astronauts/{sample_astronaut.id}/baselines/radiation_dose"
    )
    assert res_no_base.status_code == 404
    assert res_no_base.json()["error"]["code"] == "BASELINE_NOT_FOUND"
