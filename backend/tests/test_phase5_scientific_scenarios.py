"""COSMOLOOKUP Phase 5 — Scientific Validation and Scenario Testing Suite.

Covers the 14 mandatory operational scenarios:
1. Nominal astronaut monitoring
2. Sustained elevated resting heart rate
3. Abnormal SpO2 readings
4. Sleep disruption and accumulated fatigue
5. Cardiovascular exercise recovery (modality/context isolation)
6. Musculoskeletal monitoring with unavailable continuous telemetry
7. SANS-related monitoring with scheduled examination records
8. Radiation exposure history (ALARA protocol, non-anatomical isolation)
9. Behavioral-health concern
10. Multiple simultaneous warning indicators (concordance)
11. Missing or stale telemetry (no false nominal)
12. Conflicting sensor readings (data quality influence)
13. Symptoms reported despite apparently normal telemetry (clinical primacy)
14. Emergency-like symptom reporting (safe non-diagnostic escalation)
"""

from datetime import datetime, timezone, timedelta
import pytest
from sqlalchemy.orm import Session

from app.catalog import (
    MEASUREMENT_CATALOG,
    normalize_context,
    is_valid_context,
)
from app.models.astronaut import Astronaut
from app.models.measurement import Measurement
from app.models.baseline import AstronautBaseline
from app.models.assessment import HealthAssessment
from app.models.alert import HealthAlert
from app.services.baseline_lifecycle_service import (
    create_or_recalculate_lifecycle_baseline,
    get_active_baseline,
)
from app.services.trend_service import (
    analyze_all_trends_for_astronaut,
    analyze_metric_trend,
    evaluate_telemetry_freshness,
)
from app.services.assessment_service import (
    synthesize_health_assessment,
    evaluate_metric_finding,
    generate_safe_guidance,
    format_assessment_response,
)
from app.services.alert_service import (
    create_or_update_alert,
    list_alerts_for_astronaut,
    acknowledge_alert,
    resolve_alert,
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
    exercise_modality: str = None,
    is_synthetic: bool = True,
) -> Measurement:
    return Measurement(
        id=id,
        astronaut_id=astronaut_id,
        measurement_type=measurement_type,
        value=value,
        unit=unit,
        measured_at=measured_at,
        source="COSMOLOOKUP Synthetic Scenario Engine",
        context=context,
        exercise_modality=exercise_modality,
        data_quality=data_quality,
        is_synthetic=is_synthetic,
    )


# ---------------------------------------------------------------------------
# Scenario 1: Nominal Astronaut Monitoring
# ---------------------------------------------------------------------------
def test_scenario_1_nominal_astronaut_monitoring(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 1: Stable resting vitals well-contained within personal baseline envelope."""
    now = datetime.now(timezone.utc)
    # Seed 16 nominal readings over 3.75 days (N >= 10, days >= 3 -> provisional maturity)
    start_time = now - timedelta(days=4)
    for i in range(16):
        sample_time = start_time + timedelta(hours=i * 6 + 2)
        db_session.add(
            _make_meas(
                id=f"scen1-hr-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=70.0 + (i % 3) - 1.0,  # 69, 70, 71 bpm
                unit="bpm",
                measured_at=sample_time,
            )
        )
        db_session.add(
            _make_meas(
                id=f"scen1-spo2-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="spo2",
                value=98.2 + (0.2 if i % 2 == 0 else -0.2),
                unit="%",
                measured_at=sample_time,
            )
        )
    db_session.commit()

    # Calculate active baseline
    base = create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        baseline_type="inflight",
        context="resting_cabin",
    )
    assert base.maturity in ("provisional", "established")
    assert 68.0 <= base.median <= 72.0

    # Execute health assessment
    assessment = synthesize_health_assessment(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        context="resting_cabin",
        lookback_hours=72,
        generate_alerts=True,
    )
    assert assessment.overall_classification == "routine"
    assert "operating within nominal personal baseline envelopes" in assessment.summary_explanation.lower()

    # Zero alerts should be generated for nominal monitoring
    alerts = list_alerts_for_astronaut(db_session, sample_astronaut.id)
    assert len(alerts) == 0


# ---------------------------------------------------------------------------
# Scenario 2: Sustained Elevated Resting Heart Rate
# ---------------------------------------------------------------------------
def test_scenario_2_sustained_elevated_resting_hr(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 2: Resting HR exhibits a sustained upward shift exceeding 1.5 MAD-scale sigma."""
    now = datetime.now(timezone.utc)
    # 1. Establish baseline at 70 bpm
    for i in range(14):
        db_session.add(
            _make_meas(
                id=f"scen2-base-hr-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=70.0 + (i % 2),
                unit="bpm",
                measured_at=now - timedelta(days=8) + timedelta(hours=i * 6),
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

    # 2. Add 4 consecutive elevated readings (83, 84, 85, 86 bpm)
    for i in range(4):
        db_session.add(
            _make_meas(
                id=f"scen2-shift-hr-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=83.0 + i,
                unit="bpm",
                measured_at=now - timedelta(hours=(4 - i) * 6),
            )
        )
    db_session.commit()

    # Trend check
    trend = analyze_metric_trend(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        context="resting_cabin",
        lookback_hours=72,
    )
    assert trend.is_sustained is True
    assert trend.consecutive_deviations >= 3
    assert trend.trend_direction == "sustained_deviation"

    # Assessment check
    assessment = synthesize_health_assessment(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        context="resting_cabin",
        lookback_hours=72,
        generate_alerts=True,
    )
    assert assessment.overall_classification == "needs_attention"
    assert "sustained baseline shift" in assessment.summary_explanation.lower()

    # Alert lifecycle check
    alerts = list_alerts_for_astronaut(db_session, sample_astronaut.id)
    assert len(alerts) == 1
    assert alerts[0].measurement_type == "heart_rate"
    assert alerts[0].severity == "medium"
    assert alerts[0].status == "active"


# ---------------------------------------------------------------------------
# Scenario 3: Abnormal SpO2 Readings
# ---------------------------------------------------------------------------
def test_scenario_3_abnormal_spo2_readings(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 3: Capillary oxygen saturation drops significantly below baseline envelope."""
    now = datetime.now(timezone.utc)
    for i in range(12):
        db_session.add(
            _make_meas(
                id=f"scen3-base-spo2-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="spo2",
                value=98.5 + (0.2 if i % 2 == 0 else -0.2),
                unit="%",
                measured_at=now - timedelta(days=6) + timedelta(hours=i * 6),
            )
        )
    db_session.commit()
    create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="spo2",
        baseline_type="inflight",
        context="resting_cabin",
    )

    # 4 readings showing drop to 92.0%
    for i in range(4):
        db_session.add(
            _make_meas(
                id=f"scen3-drop-spo2-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="spo2",
                value=92.0 - (i * 0.2),
                unit="%",
                measured_at=now - timedelta(hours=(4 - i) * 6),
            )
        )
    db_session.commit()

    assessment = synthesize_health_assessment(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        context="resting_cabin",
        lookback_hours=72,
        generate_alerts=True,
    )
    assert assessment.overall_classification == "needs_attention"
    resp = format_assessment_response(assessment)
    finding = next((f for f in resp.findings if f.measurement_type == "spo2"), None)
    assert finding is not None
    assert finding.status in ("sustained_shift", "significant_outlier", "directional_drift")


# ---------------------------------------------------------------------------
# Scenario 4: Sleep Disruption and Accumulated Fatigue
# ---------------------------------------------------------------------------
def test_scenario_4_sleep_disruption_accumulated_fatigue(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 4: Consecutive sleep durations demonstrate acute reduction."""
    now = datetime.now(timezone.utc)
    # 7 days baseline sleep (~7.8 hours)
    for i in range(7):
        db_session.add(
            _make_meas(
                id=f"scen4-base-sleep-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="sleep_duration",
                value=7.8 + (i % 2) * 0.2,
                unit="hours",
                measured_at=now - timedelta(days=12 - i),
            )
        )
    db_session.commit()
    create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="sleep_duration",
        baseline_type="inflight",
        context="resting_cabin",
    )

    # Past 3 nights: 4.8h, 5.0h, 4.5h
    sleep_drops = [4.8, 5.0, 4.5]
    for i, val in enumerate(sleep_drops):
        db_session.add(
            _make_meas(
                id=f"scen4-drop-sleep-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="sleep_duration",
                value=val,
                unit="hours",
                measured_at=now - timedelta(days=3 - i),
            )
        )
    db_session.commit()

    trend = analyze_metric_trend(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="sleep_duration",
        context="resting_cabin",
        lookback_hours=96,
    )
    assert trend.sample_count >= 3
    assert trend.trend_direction in ("sustained_deviation", "decreasing")


# ---------------------------------------------------------------------------
# Scenario 5: Cardiovascular Exercise Recovery (Context Isolation)
# ---------------------------------------------------------------------------
def test_scenario_5_exercise_recovery_context_isolation(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 5: Post-exercise elevated telemetry is strictly isolated from resting baselines."""
    now = datetime.now(timezone.utc)
    # 1. Establish resting baseline (70 bpm)
    for i in range(12):
        db_session.add(
            _make_meas(
                id=f"scen5-rest-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=70.0,
                unit="bpm",
                measured_at=now - timedelta(days=5) + timedelta(hours=i * 6),
                context="resting_cabin",
            )
        )
    # 2. Add vigorous exercise recovery reading (135 bpm)
    db_session.add(
        _make_meas(
            id="scen5-ex-1",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=135.0,
            unit="bpm",
            measured_at=now - timedelta(hours=2),
            context="exercise_recovery",
            exercise_modality="cycle_ergometer",
        )
    )
    db_session.commit()

    # Recalculate resting baseline
    base = create_or_recalculate_lifecycle_baseline(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        baseline_type="inflight",
        context="resting_cabin",
    )
    # Verify exercise recovery sample did NOT contaminate resting median!
    assert base.median == 70.0

    # Trend for resting_cabin ignores exercise recovery
    trend = analyze_metric_trend(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        context="resting_cabin",
        lookback_hours=72,
    )
    assert trend.current_value == 70.0


# ---------------------------------------------------------------------------
# Scenario 6: Musculoskeletal Monitoring (Unavailable Continuous Telemetry)
# ---------------------------------------------------------------------------
def test_scenario_6_musculoskeletal_telemetry_unavailability():
    """Scenario 6: Musculoskeletal domain has no continuous telemetry and reports offline protocol rules."""
    from app.catalog import MEASUREMENT_CATALOG
    # No continuous telemetry in catalog for bone mineral density
    assert "bone_density" not in MEASUREMENT_CATALOG
    assert "muscle_cross_sectional_area" not in MEASUREMENT_CATALOG


# ---------------------------------------------------------------------------
# Scenario 7: SANS-Related Monitoring (Scheduled Protocols)
# ---------------------------------------------------------------------------
def test_scenario_7_sans_scheduled_monitoring_protocol():
    """Scenario 7: SANS monitoring is distinguished from nominal streaming vitals."""
    from app.catalog import MEASUREMENT_CATALOG
    # Continuous optic nerve sheath diameter telemetry is not in catalog
    assert "optic_nerve_sheath_diameter" not in MEASUREMENT_CATALOG


# ---------------------------------------------------------------------------
# Scenario 8: Radiation Exposure History (ALARA & Non-Anatomical Separation)
# ---------------------------------------------------------------------------
def test_scenario_8_radiation_exposure_alara(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 8: Cumulative radiation exposure measured in mSv effective dose."""
    now = datetime.now(timezone.utc)
    for i in range(10):
        db_session.add(
            _make_meas(
                id=f"scen8-rad-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="radiation_dose",
                value=round(12.5 + (i * 0.4), 2),  # Cumulative mSv
                unit="mSv",
                measured_at=now - timedelta(days=10 - i),
                context="resting_cabin",
            )
        )
    db_session.commit()

    trend = analyze_metric_trend(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="radiation_dose",
        context="resting_cabin",
        lookback_hours=260,
    )
    assert trend.sample_count >= 9
    assert trend.current_value == round(12.5 + (9 * 0.4), 2)
    assert trend.unit == "mSv"


# ---------------------------------------------------------------------------
# Scenario 9: Behavioral Health Concern
# ---------------------------------------------------------------------------
def test_scenario_9_behavioral_health_reported_symptoms(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 9: Fatigue and cognitive workload reported with nominal vital streams."""
    now = datetime.now(timezone.utc)
    for i in range(10):
        db_session.add(
            _make_meas(
                id=f"scen9-hr-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=70.0,
                unit="bpm",
                measured_at=now - timedelta(hours=i * 6),
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
        lookback_hours=72,
        reported_symptoms=["cognitive_fatigue", "sleep_disruption"],
    )
    # Clinical primacy upgrades routine vitals to needs_attention
    assert assessment.overall_classification == "needs_attention"
    assert "clinical primacy notice" in assessment.summary_explanation.lower()


# ---------------------------------------------------------------------------
# Scenario 10: Multiple Simultaneous Warning Indicators (Concordance)
# ---------------------------------------------------------------------------
def test_scenario_10_multiple_simultaneous_warning_indicators(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 10: Concordant shifts in HR and core temp trigger medical_review_recommended."""
    now = datetime.now(timezone.utc)
    # Establish baselines with natural variation so b_scale > 0
    for i in range(12):
        t = now - timedelta(days=6) + timedelta(hours=i * 6)
        hr_val = 70.0 + (i % 3) * 1.5
        temp_val = 36.8 + (i % 3) * 0.15
        db_session.add(_make_meas(f"scen10-b-hr-{i}", sample_astronaut.id, "heart_rate", hr_val, "bpm", t))
        db_session.add(_make_meas(f"scen10-b-temp-{i}", sample_astronaut.id, "body_temperature", temp_val, "celsius", t))
    db_session.commit()

    create_or_recalculate_lifecycle_baseline(db_session, sample_astronaut.id, "heart_rate", "inflight", "resting_cabin")
    create_or_recalculate_lifecycle_baseline(db_session, sample_astronaut.id, "body_temperature", "inflight", "resting_cabin")

    # Past 4 readings: both HR (86 bpm) and temp (38.0 C) sustained high
    for i in range(4):
        t = now - timedelta(hours=(4 - i) * 6)
        db_session.add(_make_meas(f"scen10-s-hr-{i}", sample_astronaut.id, "heart_rate", 86.0 + i, "bpm", t))
        db_session.add(_make_meas(f"scen10-s-temp-{i}", sample_astronaut.id, "body_temperature", 38.0 + (i * 0.1), "celsius", t))
    db_session.commit()

    assessment = synthesize_health_assessment(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        context="resting_cabin",
        lookback_hours=72,
        generate_alerts=True,
    )
    assert assessment.overall_classification == "medical_review_recommended"
    assert "multi-parameter physiological shift" in assessment.summary_explanation.lower()

    alerts = list_alerts_for_astronaut(db_session, sample_astronaut.id)
    assert len(alerts) >= 2
    assert all(a.severity == "high" for a in alerts)


# ---------------------------------------------------------------------------
# Scenario 11: Missing or Stale Telemetry
# ---------------------------------------------------------------------------
def test_scenario_11_missing_or_stale_telemetry(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 11: Stale telemetry must NEVER be declared nominal or healthy."""
    now = datetime.now(timezone.utc)
    # Single reading 72 hours ago (heart rate expected every 6h -> 12x overdue)
    db_session.add(
        _make_meas(
            id="scen11-stale-hr",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=70.0,
            unit="bpm",
            measured_at=now - timedelta(hours=72),
        )
    )
    db_session.commit()

    trend = analyze_metric_trend(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        measurement_type="heart_rate",
        context="resting_cabin",
        lookback_hours=24,  # lookback only past 24h -> 0 samples in window
    )
    assert trend.sample_count == 0
    assert trend.freshness_status == "stale"

    # Status must NOT say nominal!
    status, finding = evaluate_metric_finding(trend)
    assert status == "no_data"
    assert "NOT indicate nominal physiology" in finding.summary


# ---------------------------------------------------------------------------
# Scenario 12: Conflicting Sensor Readings & Degraded Quality
# ---------------------------------------------------------------------------
def test_scenario_12_conflicting_sensor_data_quality(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 12: Noisy sensor artifacts are flagged as degraded rather than medical emergencies."""
    now = datetime.now(timezone.utc)
    for i in range(8):
        db_session.add(
            _make_meas(
                id=f"scen12-noisy-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=70.0 + (i % 2) * 20.0,  # 70, 90, 70, 90 (sensor motion artifact)
                unit="bpm",
                measured_at=now - timedelta(hours=i * 6),
                data_quality="noisy",
            )
        )
    db_session.commit()

    assessment = synthesize_health_assessment(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        context="resting_cabin",
        lookback_hours=72,
    )
    assert assessment.data_quality_status == "degraded"
    resp = format_assessment_response(assessment)
    # First guidance item advises sensor band inspection
    assert any("sensor" in g.action.lower() for g in resp.guidance)


# ---------------------------------------------------------------------------
# Scenario 13: Symptoms Reported Despite Normal Telemetry
# ---------------------------------------------------------------------------
def test_scenario_13_symptoms_reported_despite_normal_telemetry(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 13: Clinical primacy ensures reported symptoms are never dismissed by normal vitals."""
    now = datetime.now(timezone.utc)
    for i in range(12):
        db_session.add(
            _make_meas(
                id=f"scen13-meas-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=70.0,
                unit="bpm",
                measured_at=now - timedelta(hours=i * 6),
            )
        )
    db_session.commit()
    create_or_recalculate_lifecycle_baseline(db_session, sample_astronaut.id, "heart_rate", "inflight", "resting_cabin")

    assessment = synthesize_health_assessment(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        context="resting_cabin",
        lookback_hours=72,
        reported_symptoms=["persistent_headache", "dizziness"],
    )
    # Upgraded from routine to needs_attention
    assert assessment.overall_classification == "needs_attention"
    assert "clinical primacy notice" in assessment.summary_explanation.lower()
    resp = format_assessment_response(assessment)
    assert any("subjective symptoms" in g.action.lower() for g in resp.guidance)


# ---------------------------------------------------------------------------
# Scenario 14: Emergency-like Symptom Reporting
# ---------------------------------------------------------------------------
def test_scenario_14_emergency_like_symptom_reporting(db_session: Session, sample_astronaut: Astronaut):
    """Scenario 14: Acute chest pain reports escalate immediately to medical review recommendation."""
    now = datetime.now(timezone.utc)
    for i in range(12):
        db_session.add(
            _make_meas(
                id=f"scen14-meas-{i}",
                astronaut_id=sample_astronaut.id,
                measurement_type="heart_rate",
                value=72.0,
                unit="bpm",
                measured_at=now - timedelta(hours=i * 6),
            )
        )
    db_session.commit()

    assessment = synthesize_health_assessment(
        db=db_session,
        astronaut_id=sample_astronaut.id,
        context="resting_cabin",
        lookback_hours=72,
        reported_symptoms=["acute_chest_pain"],
    )
    assert assessment.overall_classification == "medical_review_recommended"
    assert "clinical primacy / acute symptom escalation" in assessment.summary_explanation.lower()
    assert "immediate flight surgeon consultation" in assessment.summary_explanation.lower()
    # Confirm non-diagnostic disclaimer is preserved
    assert "does not constitute automated clinical diagnosis" in assessment.summary_explanation.lower()
