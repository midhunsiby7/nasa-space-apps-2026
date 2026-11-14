"""Comprehensive test suite for Phase 2C + 2D + 2E:
Baseline Lifecycle, Trend Intelligence, Explainable Assessments, and Alerts.
"""

from datetime import datetime, timezone, timedelta
import json
from typing import Optional
import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.core.exceptions import (
    AlertNotFoundException,
    AssessmentNotFoundException,
    InvalidQueryParameterException,
    PreflightBaselineFinalizedException,
)
from app.models.alert import HealthAlert
from app.models.assessment import HealthAssessment
from app.models.astronaut import Astronaut
from app.models.baseline import AstronautBaseline
from app.models.measurement import Measurement
from app.schemas.trend import TrendObservation
from app.services.alert_service import (
    acknowledge_alert,
    create_or_update_alert,
    list_alerts_for_astronaut,
    resolve_alert,
)
from app.services.assessment_service import (
    evaluate_metric_finding,
    generate_safe_guidance,
    synthesize_health_assessment,
)
from app.services.baseline_lifecycle_service import (
    create_or_recalculate_lifecycle_baseline,
    evaluate_baseline_maturity,
    finalize_preflight_baseline,
    get_active_baseline,
    get_baseline_history,
)
from app.services.trend_service import (
    analyze_all_trends_for_astronaut,
    analyze_metric_trend,
    calculate_sens_slope,
    evaluate_telemetry_freshness,
    get_astronaut_telemetry_freshness,
)


def _make_meas(
    id: str,
    astronaut_id: str,
    measurement_type: str,
    value: float,
    unit: str,
    measured_at: datetime,
    context: str = "resting_cabin",
    data_quality: str = "nominal",
    source: str = "BioHarness Sensor",
    is_synthetic: bool = True,
    exercise_modality: Optional[str] = None,
    measurement_site: Optional[str] = None,
    measurement_method: Optional[str] = None,
) -> Measurement:
    return Measurement(
        id=id,
        astronaut_id=astronaut_id,
        measurement_type=measurement_type,
        value=value,
        unit=unit,
        measured_at=measured_at,
        context=context,
        data_quality=data_quality,
        source=source,
        is_synthetic=is_synthetic,
        exercise_modality=exercise_modality,
        measurement_site=measurement_site,
        measurement_method=measurement_method,
    )


# ==============================================================================
# SECTION 1: PHASE 2C — BASELINE LIFECYCLE & MATURITY
# ==============================================================================

def test_maturity_evaluation_rules():
    """Verify maturity classification follows transparent engineering criteria."""
    now = datetime.now(timezone.utc)

    # 1. Insufficient: N < 10 or days < 3
    mat_insuf, snap_insuf = evaluate_baseline_maturity(
        sample_count=8,
        window_start=now - timedelta(days=5),
        window_end=now,
        nominal_count=8,
        degraded_count=0,
    )
    assert mat_insuf == "insufficient"
    assert snap_insuf["sample_count"] == 8

    # 2. Insufficient due to duration (< 3 days despite N >= 10)
    mat_insuf2, _ = evaluate_baseline_maturity(
        sample_count=15,
        window_start=now - timedelta(days=2),
        window_end=now,
        nominal_count=15,
        degraded_count=0,
    )
    assert mat_insuf2 == "insufficient"

    # 3. Provisional: N >= 10 and days >= 3
    mat_prov, snap_prov = evaluate_baseline_maturity(
        sample_count=12,
        window_start=now - timedelta(days=4),
        window_end=now,
        nominal_count=10,
        degraded_count=2,
    )
    assert mat_prov == "provisional"
    assert snap_prov["sample_count"] == 12

    # 4. Provisional due to nominal percentage < 90% (even if N >= 30, days >= 7)
    mat_prov2, snap_prov2 = evaluate_baseline_maturity(
        sample_count=35,
        window_start=now - timedelta(days=10),
        window_end=now,
        nominal_count=25,
        degraded_count=10,  # 71.4% nominal
    )
    assert mat_prov2 == "provisional"
    assert snap_prov2["nominal_percentage"] < 90.0

    # 5. Established: N >= 30, days >= 7, nominal_pct >= 90%
    mat_est, snap_est = evaluate_baseline_maturity(
        sample_count=32,
        window_start=now - timedelta(days=8),
        window_end=now,
        nominal_count=30,
        degraded_count=2,  # 93.8% nominal
    )
    assert mat_est == "established"
    assert snap_est["sample_count"] == 32
    assert snap_est["observation_days"] >= 7.0


def test_preflight_baseline_creation_and_finalization(db_session: Session, sample_astronaut: Astronaut):
    """Verify creating and finalizing a preflight baseline locks it against mutations."""
    now = datetime.now(timezone.utc)
    for i in range(15):
        db_session.add(
            _make_meas(
                id=f"meas-preflight-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=68.0 + (i % 5),
                unit="bpm",
                measured_at=now - timedelta(days=5 - (i * 0.3)),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    # Create preflight baseline
    base = create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        baseline_type="preflight",
        context="resting_cabin",
    )
    assert base.baseline_type == "preflight"
    assert base.is_finalized is False
    assert base.version == 1
    assert base.maturity == "provisional"

    # Finalize preflight baseline
    finalized = finalize_preflight_baseline(db_session, base.id)
    assert finalized.id == base.id
    assert finalized.is_finalized is True
    assert finalized.is_active is True

    # Attempting to recalculate after finalization must raise PreflightBaselineFinalizedException
    with pytest.raises(PreflightBaselineFinalizedException):
        create_or_recalculate_lifecycle_baseline(
            db=db_session,
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            baseline_type="preflight",
            context="resting_cabin",
        )


def test_finalizing_non_preflight_raises_error(db_session: Session, sample_astronaut: Astronaut):
    """Verify in-flight baselines cannot be finalized via preflight finalization."""
    base = AstronautBaseline(
        id="base-inflight-test",
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        context="resting_cabin",
        unit="bpm",
        baseline_type="inflight",
        version=1,
        is_active=True,
        is_finalized=False,
        median=70.0,
        q25=68.0,
        q75=72.0,
        iqr=4.0,
        robust_scale_iqr=2.965,
        mean=70.0,
        std_dev=2.0,
        min_value=65.0,
        max_value=75.0,
        sample_count=10,
        nominal_count=10,
        degraded_count=0,
        calculated_at=datetime.now(timezone.utc),
    )
    db_session.add(base)
    db_session.commit()

    with pytest.raises(InvalidQueryParameterException):
        finalize_preflight_baseline(db_session, base.id)


def test_inflight_baseline_versioning_and_supersession(db_session: Session, sample_astronaut: Astronaut):
    """Verify recalculating in-flight baselines creates version history and supersedes previous versions."""
    now = datetime.now(timezone.utc)
    for i in range(12):
        db_session.add(
            _make_meas(
                id=f"meas-inflight-v1-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=70.0 + (i % 3),
                unit="bpm",
                measured_at=now - timedelta(days=4 - (i * 0.2)),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    # First in-flight baseline (Version 1)
    base_v1 = create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        baseline_type="inflight",
        context="resting_cabin",
    )
    assert base_v1.version == 1
    assert base_v1.is_active is True
    assert base_v1.supersedes_baseline_id is None

    # Add further measurements
    for i in range(15):
        db_session.add(
            _make_meas(
                id=f"meas-inflight-v2-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=75.0,
                unit="bpm",
                measured_at=now - timedelta(hours=i),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    # Recalculate (Version 2)
    base_v2 = create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        baseline_type="inflight",
        context="resting_cabin",
    )
    assert base_v2.version == 2
    assert base_v2.is_active is True
    assert base_v2.supersedes_baseline_id == base_v1.id

    # Verify previous version 1 was deactivated
    db_session.refresh(base_v1)
    assert base_v1.is_active is False

    # Check active lookup
    active = get_active_baseline(db_session, sample_astronaut.id, "heart_rate", "inflight", "resting_cabin")
    assert active is not None
    assert active.id == base_v2.id
    assert active.version == 2

    # Check history
    history = get_baseline_history(db_session, sample_astronaut.id, "heart_rate")
    assert len(history) == 2
    assert history[0].version == 2
    assert history[1].version == 1


def test_api_baseline_lifecycle_endpoints(client: TestClient, db_session: Session, sample_astronaut: Astronaut):
    """Test API endpoints for preflight calculation, finalization, active lookup, and history."""
    now = datetime.now(timezone.utc)
    for i in range(12):
        db_session.add(
            _make_meas(
                id=f"meas-api-life-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=70.0 + (i % 4),
                unit="bpm",
                measured_at=now - timedelta(days=4 - (i * 0.3)),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    # 1. POST /astronauts/{id}/baselines/preflight
    resp_pf = client.post(
        f"/api/v1/astronauts/{sample_astronaut.id}/baselines/preflight",
        json={"measurement_type": "heart_rate", "context": "resting_cabin"},
    )
    assert resp_pf.status_code == 200
    pf_data = resp_pf.json()
    assert pf_data["baseline_type"] == "preflight"
    assert pf_data["is_finalized"] is False
    pf_id = pf_data["id"]

    # 2. POST /baselines/{id}/finalize
    resp_fin = client.post(
        f"/api/v1/baselines/{pf_id}/finalize",
        json={"reason": "Flight Surgeon validated pre-flight ground testing."},
    )
    assert resp_fin.status_code == 200
    fin_data = resp_fin.json()
    assert fin_data["is_finalized"] is True

    # 3. Repeat preflight POST should yield 409 Conflict
    resp_conflict = client.post(
        f"/api/v1/astronauts/{sample_astronaut.id}/baselines/preflight",
        json={"measurement_type": "heart_rate", "context": "resting_cabin"},
    )
    assert resp_conflict.status_code == 409

    # 4. GET /astronauts/{id}/baselines/active
    resp_active = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/baselines/active")
    assert resp_active.status_code == 200
    active_data = resp_active.json()
    assert active_data["total"] >= 1
    assert any(b["id"] == pf_id for b in active_data["data"])

    # 5. GET /astronauts/{id}/baselines/{measurement_type}/history
    resp_hist = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/baselines/heart_rate/history")
    assert resp_hist.status_code == 200
    hist_data = resp_hist.json()
    assert hist_data["total"] >= 1


# ==============================================================================
# SECTION 2: PHASE 2D — TREND INTELLIGENCE & TELEMETRY FRESHNESS
# ==============================================================================

def test_sens_slope_calculations():
    """Verify non-parametric Sen's slope rate-of-change estimation and outlier resilience."""
    now = datetime.now(timezone.utc)

    # 1. Perfect linear progression (+2.0 units per day)
    times = [now - timedelta(days=3), now - timedelta(days=2), now - timedelta(days=1), now]
    vals = [70.0, 72.0, 74.0, 76.0]
    slope = calculate_sens_slope(times, vals)
    assert slope == pytest.approx(2.0, abs=0.01)

    # 2. Perfect decrease (-1.5 units per day)
    vals_dec = [80.0, 78.5, 77.0, 75.5]
    slope_dec = calculate_sens_slope(times, vals_dec)
    assert slope_dec == pytest.approx(-1.5, abs=0.01)

    # 3. Flat baseline (0.0 slope)
    vals_flat = [70.0, 70.0, 70.0, 70.0]
    assert calculate_sens_slope(times, vals_flat) == 0.0

    # 4. Outlier resilience: one transient artifact doesn't skew Sen's slope
    vals_noisy = [70.0, 110.0, 74.0, 76.0]  # transient spike at day 2
    slope_noisy = calculate_sens_slope(times, vals_noisy)
    # Median slope among pairwise pairs remains close to 2.0
    assert 1.0 <= slope_noisy <= 3.5

    # 5. Less than 2 data points
    assert calculate_sens_slope([now], [70.0]) is None


def test_robust_deviation_score_and_zero_iqr(db_session: Session, sample_astronaut: Astronaut):
    """Verify robust standardized deviation score and zero-IQR safety."""
    # Seed identical measurements where IQR = 0.0
    now = datetime.now(timezone.utc)
    for i in range(12):
        db_session.add(
            _make_meas(
                id=f"meas-flat-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="spo2",
                value=98.0,
                unit="%",
                measured_at=now - timedelta(hours=i * 6),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    # Calculate baseline
    base = create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="spo2",
        baseline_type="inflight",
        context="resting_cabin",
    )
    assert base.iqr == 0.0
    assert base.robust_scale_iqr == 0.0

    # Analyze trend for current value equal to baseline
    trend = analyze_metric_trend(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="spo2",
        context="resting_cabin",
    )
    assert trend.robust_scale_iqr == 0.0
    assert trend.robust_z == 0.0  # Safe zero division handling
    assert trend.trend_direction == "stable"


def test_consecutive_deviations_and_sustained_trajectory(db_session: Session, sample_astronaut: Astronaut):
    """Verify run-rules detect consecutive deviations and flag sustained shifts."""
    now = datetime.now(timezone.utc)

    # Establish baseline with HR ~ 70 bpm, IQR ~ 4.0, scale ~ 2.965
    for i in range(15):
        db_session.add(
            _make_meas(
                id=f"meas-run-base-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=68.0 + (i % 5),  # values in [68, 72]
                unit="bpm",
                measured_at=now - timedelta(days=6 - (i * 0.3)),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        baseline_type="inflight",
        context="resting_cabin",
    )

    # Add 4 consecutive recent measurements with significant deviation (HR = 85 bpm, Z > 3.0)
    for i in range(4):
        db_session.add(
            _make_meas(
                id=f"meas-run-dev-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=85.0,
                unit="bpm",
                measured_at=now - timedelta(hours=i * 2),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    trend = analyze_metric_trend(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        context="resting_cabin",
        lookback_hours=72,
    )
    assert trend.consecutive_deviations >= 3
    assert trend.is_sustained is True
    assert trend.trend_direction == "sustained_deviation"
    assert "Sustained" in trend.explanation


def test_telemetry_freshness_evaluation():
    """Verify telemetry currency classification across freshness intervals."""
    now = datetime.now(timezone.utc)

    # Fresh observation (heart_rate expected <= 6h)
    fresh_item = evaluate_telemetry_freshness(
        last_measured_at=now - timedelta(hours=2.5),
        measurement_type="heart_rate",
        now=now,
    )
    assert fresh_item.status == "fresh"
    assert fresh_item.hours_since_last == pytest.approx(2.5, abs=0.1)

    # Stale observation (heart_rate with 9h elapsed)
    stale_item = evaluate_telemetry_freshness(
        last_measured_at=now - timedelta(hours=9.0),
        measurement_type="heart_rate",
        now=now,
    )
    assert stale_item.status == "stale"
    assert stale_item.hours_since_last == pytest.approx(9.0, abs=0.1)
    assert "Does not imply a clinical emergency" in stale_item.message

    # Unknown observation
    unknown_item = evaluate_telemetry_freshness(
        last_measured_at=None,
        measurement_type="heart_rate",
        now=now,
    )
    assert unknown_item.status == "unknown"


def test_api_trend_endpoints(client: TestClient, db_session: Session, sample_astronaut: Astronaut):
    """Test API endpoints for trends collection, metric trend, and freshness report."""
    now = datetime.now(timezone.utc)
    for i in range(10):
        db_session.add(
            _make_meas(
                id=f"meas-trend-api-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=72.0,
                unit="bpm",
                measured_at=now - timedelta(hours=i * 3),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    # 1. GET /astronauts/{id}/trends
    resp_all = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/trends")
    assert resp_all.status_code == 200
    all_data = resp_all.json()
    assert all_data["astronaut_id"] == sample_astronaut.id
    assert all_data["total"] > 0

    # 2. GET /astronauts/{id}/trends/freshness
    resp_fresh = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/trends/freshness")
    assert resp_fresh.status_code == 200
    fresh_data = resp_fresh.json()
    assert "items" in fresh_data
    assert fresh_data["total_metrics"] >= 5

    # 3. GET /astronauts/{id}/trends/{measurement_type}
    resp_metric = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/trends/heart_rate")
    assert resp_metric.status_code == 200
    metric_data = resp_metric.json()
    assert metric_data["measurement_type"] == "heart_rate"
    assert metric_data["freshness_status"] == "fresh"


# ==============================================================================
# SECTION 3: PHASE 2E — HEALTH ASSESSMENT & ALERTS
# ==============================================================================

def test_assessment_routine_classification(db_session: Session, sample_astronaut: Astronaut):
    """Verify nominal vitals yield routine attention tier and reassuring guidance."""
    now = datetime.now(timezone.utc)
    for i in range(12):
        db_session.add(
            _make_meas(
                id=f"meas-nom-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=70.0 + (i % 2),
                unit="bpm",
                measured_at=now - timedelta(hours=i * 3),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        baseline_type="inflight",
        context="resting_cabin",
    )

    assessment = synthesize_health_assessment(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        context="resting_cabin",
        generate_alerts=True,
    )
    assert assessment.overall_classification == "routine"
    assert "nominal personal baseline envelopes" in assessment.summary_explanation

    # No alert generated for routine
    alerts = list_alerts_for_astronaut(db_session, sample_astronaut.id)
    assert len(alerts) == 0


def test_assessment_needs_attention_single_shift(db_session: Session, sample_astronaut: Astronaut):
    """Verify single sustained shift evaluates to needs_attention tier with medium severity alert."""
    now = datetime.now(timezone.utc)
    for i in range(12):
        db_session.add(
            _make_meas(
                id=f"meas-na-base-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=68.0 + (i % 4),
                unit="bpm",
                measured_at=now - timedelta(days=5 - (i * 0.3)),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        baseline_type="inflight",
        context="resting_cabin",
    )

    # Add 4 consecutive elevated readings (HR = 88 bpm)
    for i in range(4):
        db_session.add(
            _make_meas(
                id=f"meas-na-shift-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=88.0,
                unit="bpm",
                measured_at=now - timedelta(hours=i * 2),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    assessment = synthesize_health_assessment(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        context="resting_cabin",
        generate_alerts=True,
    )
    assert assessment.overall_classification == "needs_attention"

    # Verify medium-severity alert created
    alerts = list_alerts_for_astronaut(db_session, sample_astronaut.id)
    assert len(alerts) == 1
    assert alerts[0].severity == "medium"
    assert alerts[0].measurement_type == "heart_rate"
    assert alerts[0].status == "active"


def test_assessment_medical_review_recommended(db_session: Session, sample_astronaut: Astronaut):
    """Verify multi-parameter concordance (HR + temp) escalates to medical_review_recommended."""
    now = datetime.now(timezone.utc)
    # Establish HR and Temp baselines
    for i in range(12):
        db_session.add(
            _make_meas(
                id=f"meas-mr-hr-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=68.0 + (i % 4),
                unit="bpm",
                measured_at=now - timedelta(days=5 - (i * 0.3)),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
        db_session.add(
            _make_meas(
                id=f"meas-mr-tmp-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="body_temperature",
                value=36.7 + (i % 3) * 0.1,
                unit="celsius",
                measured_at=now - timedelta(days=5 - (i * 0.3)),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        baseline_type="inflight",
        context="resting_cabin",
    )
    create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="body_temperature",
        baseline_type="inflight",
        context="resting_cabin",
    )

    # Add concordant sustained shifts for both HR and Temp
    for i in range(4):
        db_session.add(
            _make_meas(
                id=f"meas-mr-hr-shift-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=88.0,
                unit="bpm",
                measured_at=now - timedelta(hours=i * 2),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
        db_session.add(
            _make_meas(
                id=f"meas-mr-tmp-shift-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="body_temperature",
                value=38.4,
                unit="celsius",
                measured_at=now - timedelta(hours=i * 2),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    assessment = synthesize_health_assessment(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        context="resting_cabin",
        generate_alerts=True,
    )
    assert assessment.overall_classification == "medical_review_recommended"
    assert "Multi-parameter" in assessment.summary_explanation

    # Verify high-severity alert created
    alerts = list_alerts_for_astronaut(db_session, sample_astronaut.id)
    assert len(alerts) >= 1
    assert any(a.severity == "high" for a in alerts)


def test_assessment_emergency_redline_enforcement(db_session: Session, sample_astronaut: Astronaut):
    """Verify emergency classification triggers ONLY when explicit protocol redline is breached."""
    now = datetime.now(timezone.utc)
    # Critical SpO2 violation (82% < 85% emergency redline)
    db_session.add(
        _make_meas(
            id="meas-crit-spo2",
            astronaut_id=sample_astronaut.id,
            measurement_type="spo2",
            value=82.0,
            unit="%",
            measured_at=now,
            context="resting_cabin",
            data_quality="nominal",
        )
    )
    db_session.commit()

    assessment = synthesize_health_assessment(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        context="resting_cabin",
        generate_alerts=True,
    )
    assert assessment.overall_classification == "emergency"
    assert "CRITICAL ALERT" in assessment.summary_explanation

    alerts = list_alerts_for_astronaut(db_session, sample_astronaut.id)
    assert len(alerts) >= 1
    crit_alert = next((a for a in alerts if a.severity == "critical"), None)
    assert crit_alert is not None
    assert crit_alert.measurement_type == "spo2"


def test_assessment_safe_guidance_non_diagnostic():
    """Verify guidance generator maintains strict non-diagnostic and non-prescriptive boundaries."""
    sample_trend = TrendObservation(
        measurement_type="heart_rate",
        canonical_identifier="heart_rate",
        context="resting_cabin",
        unit="bpm",
        current_value=72.0,
        current_measured_at="2026-11-14T00:00:00Z",
        sample_count=10,
        trend_direction="stable",
        freshness_status="fresh",
        expected_interval_hours=6.0,
        data_quality_status="nominal",
        explanation="Operating within nominal intra-individual variation.",
    )
    status, finding = evaluate_metric_finding(trend=sample_trend)
    assert status == "nominal"
    assert finding.measurement_type == "heart_rate"

    guidance = generate_safe_guidance(classification="medical_review_recommended", findings=[finding])
    assert len(guidance) > 0
    for g in guidance:
        assert g.is_medical_prescription is False
        assert "diagnose" not in g.action.lower()
        assert "prescribe" not in g.action.lower()


def test_alert_deduplication_and_fatigue_suppression(db_session: Session, sample_astronaut: Astronaut):
    """Verify subsequent assessments update existing active alert rather than duplicating rows."""
    alert1 = create_or_update_alert(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        title="Elevated Heart Rate",
        explanation="Heart rate sustained shift.",
        severity="medium",
    )
    orig_id = alert1.id
    assert alert1.status == "active"

    # Second alert for same astronaut & metric with higher severity
    alert2 = create_or_update_alert(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        title="Critical Heart Rate Deviation",
        explanation="Heart rate exceeded upper bounds.",
        severity="high",
    )
    assert alert2.id == orig_id  # Reused same alert record
    assert alert2.severity == "high"  # Upgraded severity
    assert alert2.title == "Critical Heart Rate Deviation"

    all_alerts = list_alerts_for_astronaut(db_session, sample_astronaut.id)
    assert len(all_alerts) == 1  # No duplicate rows


def test_alert_lifecycle_acknowledgement_and_resolution(db_session: Session, sample_astronaut: Astronaut):
    """Verify alert transitions from active -> acknowledged -> resolved."""
    alert = create_or_update_alert(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="spo2",
        title="Telemetry Stale",
        explanation="SpO2 readings missing.",
        severity="low",
    )
    assert alert.status == "active"
    assert alert.acknowledged_at is None
    assert alert.resolved_at is None

    # Acknowledge
    ack = acknowledge_alert(db_session, alert.id)
    assert ack.status == "acknowledged"
    assert ack.acknowledged_at is not None
    assert ack.resolved_at is None

    # Resolve
    res = resolve_alert(db_session, alert.id)
    assert res.status == "resolved"
    assert res.resolved_at is not None


def test_api_assessment_and_alert_endpoints(client: TestClient, db_session: Session, sample_astronaut: Astronaut):
    """Test API integration for assessments generation and alert resolution."""
    now = datetime.now(timezone.utc)
    for i in range(12):
        db_session.add(
            _make_meas(
                id=f"meas-api-ass-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=71.0,
                unit="bpm",
                measured_at=now - timedelta(hours=i * 2),
                context="resting_cabin",
                data_quality="nominal",
            )
        )
    db_session.commit()

    # 1. POST /astronauts/{id}/assessments
    resp_gen = client.post(
        f"/api/v1/astronauts/{sample_astronaut.id}/assessments",
        json={"context": "resting_cabin", "lookback_hours": 48},
    )
    assert resp_gen.status_code == 200
    gen_data = resp_gen.json()
    assert gen_data["astronaut_id"] == sample_astronaut.id
    assert "findings" in gen_data
    assert "guidance" in gen_data
    assessment_id = gen_data["id"]

    # 2. GET /astronauts/{id}/assessments/latest
    resp_latest = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/assessments/latest")
    assert resp_latest.status_code == 200
    latest_data = resp_latest.json()
    assert latest_data["id"] == assessment_id

    # 3. GET /assessments/{id}
    resp_single = client.get(f"/api/v1/assessments/{assessment_id}")
    assert resp_single.status_code == 200
    assert resp_single.json()["id"] == assessment_id

    # 4. Create an alert directly and test /acknowledge & /resolve via API
    alert = create_or_update_alert(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="respiratory_rate",
        title="Elevated Breathing Rate",
        explanation="Consecutive elevated respiration readings.",
        severity="medium",
    )
    alert_id = alert.id

    # GET /astronauts/{id}/alerts
    resp_alerts = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/alerts?status=active")
    assert resp_alerts.status_code == 200
    assert resp_alerts.json()["total"] >= 1

    # POST /alerts/{id}/acknowledge
    resp_ack = client.post(
        f"/api/v1/alerts/{alert_id}/acknowledge",
        json={"note": "Flight Surgeon acknowledged telemetrically."},
    )
    assert resp_ack.status_code == 200
    assert resp_ack.json()["status"] == "acknowledged"

    # POST /alerts/{id}/resolve
    resp_res = client.post(
        f"/api/v1/alerts/{alert_id}/resolve",
        json={"note": "Follow-up reading normalized. Alert resolved."},
    )
    assert resp_res.status_code == 200
    assert resp_res.json()["status"] == "resolved"
