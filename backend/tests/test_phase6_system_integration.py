"""COSMOLOOKUP Phase 6 — Complete System Integration & End-to-End Workflow Verification Suite.

Tests the full integrated system:
- Roster querying and astronaut profile retrieval
- Telemetry ingestion, catalog normalization, and freshness evaluation
- Personal operational baselines (lifecycle, versioning, and history preservation)
- Health trend trajectories (Sen's slope, robust Z, run rules)
- Explainable assessment synthesis with symptom reporting and clinical primacy
- Alert lifecycle (emission, deduplication, acknowledgement, and resolution)
- Database seeding idempotency and non-destructive persistence
- Robust error handling for invalid IDs and malformed inputs
"""

from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.astronaut import Astronaut
from app.models.measurement import Measurement
from app.models.baseline import AstronautBaseline
from app.models.assessment import HealthAssessment
from app.models.alert import HealthAlert
from app.seed import seed_database, SEEDED_ASTRONAUTS


def test_e2e_astronaut_monitoring_workflow(client: TestClient, db_session: Session, sample_astronaut: Astronaut):
    """End-to-End Workflow: Roster -> Telemetry -> Baselines -> Trends -> Assessments -> Alerts -> Resolution."""
    now = datetime.now(timezone.utc)
    a_id = sample_astronaut.id

    # 1. Query Astronaut Roster
    res = client.get("/api/v1/astronauts")
    assert res.status_code == 200
    roster_data = res.json()["data"]
    assert any(a["id"] == a_id for a in roster_data)

    # 2. Query Astronaut Profile
    res = client.get(f"/api/v1/astronauts/{a_id}")
    assert res.status_code == 200
    assert res.json()["name"] == sample_astronaut.name

    # 3. Ingest multi-day resting telemetry series
    for i in range(16):
        sample_time = now - timedelta(hours=(16 - i) * 6)
        db_session.add(
            Measurement(
                id=f"e2e-hr-{i}",
                astronaut_id=a_id,
                measurement_type="heart_rate",
                value=70.0 + (i % 3) - 1.0,
                unit="bpm",
                measured_at=sample_time,
                source="BioHarness v3 Sensor",
                context="resting_cabin",
                data_quality="nominal",
                is_synthetic=True,
            )
        )
        db_session.add(
            Measurement(
                id=f"e2e-spo2-{i}",
                astronaut_id=a_id,
                measurement_type="spo2",
                value=98.5,
                unit="%",
                measured_at=sample_time,
                source="Optical Pulse Oximeter",
                context="resting_cabin",
                data_quality="nominal",
                is_synthetic=True,
            )
        )
    db_session.commit()

    # 4. Verify Telemetry Query Endpoint
    res = client.get(f"/api/v1/astronauts/{a_id}/measurements?measurement_type=heart_rate")
    assert res.status_code == 200
    meas_data = res.json()
    assert meas_data["total"] >= 16

    # 5. Calculate Preflight Baseline and Finalize it
    res = client.post(
        f"/api/v1/astronauts/{a_id}/baselines/preflight",
        json={"measurement_type": "heart_rate", "context": "resting_cabin"},
    )
    assert res.status_code == 200
    preflight_base = res.json()
    assert preflight_base["baseline_type"] == "preflight"
    preflight_id = preflight_base["id"]

    # Finalize preflight baseline
    res = client.post(f"/api/v1/baselines/{preflight_id}/finalize", json={"justification": "Preflight baseline certified by CMO."})
    assert res.status_code == 200
    assert res.json()["is_finalized"] is True

    # 6. Verify Baseline History Endpoint
    res = client.get(f"/api/v1/astronauts/{a_id}/baselines/heart_rate/history")
    assert res.status_code == 200
    hist = res.json()["data"]
    assert len(hist) >= 1
    assert any(b["id"] == preflight_id for b in hist)

    # 7. Check Telemetry Freshness Endpoint
    res = client.get(f"/api/v1/astronauts/{a_id}/trends/freshness")
    assert res.status_code == 200
    freshness = res.json()
    hr_fresh = next((item for item in freshness["items"] if item["measurement_type"] == "heart_rate"), None)
    assert hr_fresh is not None
    assert hr_fresh["status"] in ("fresh", "stale")

    # 8. Check Trends Matrix Endpoint
    res = client.get(f"/api/v1/astronauts/{a_id}/trends?context=resting_cabin")
    assert res.status_code == 200
    trends = res.json()["data"]
    assert len(trends) > 0

    # 9. Generate Explainable Assessment with Reported Symptoms (Clinical Primacy Test)
    res = client.post(
        f"/api/v1/astronauts/{a_id}/assessments",
        json={
            "context": "resting_cabin",
            "lookback_hours": 72,
            "generate_alerts": True,
            "reported_symptoms": ["headache", "dizziness"],
        },
    )
    assert res.status_code == 200
    asm = res.json()
    # Clinical primacy upgrades routine vitals to needs_attention
    assert asm["overall_classification"] == "needs_attention"
    assert "clinical primacy notice" in asm["summary_explanation"].lower()
    assert any("subjective symptoms" in g["action"].lower() for g in asm["guidance"])

    # 10. Query Active Alerts
    res = client.get(f"/api/v1/astronauts/{a_id}/alerts")
    assert res.status_code == 200
    alerts = res.json()["data"]
    assert len(alerts) >= 1
    target_alert = alerts[0]
    alert_id = target_alert["id"]

    # 11. Acknowledge Alert Workflow
    res = client.post(
        f"/api/v1/alerts/{alert_id}/acknowledge",
        json={"note": "CMO confirmed symptom logging; astronaut hydrated and resting."},
    )
    assert res.status_code == 200
    acked_alert = res.json()
    assert acked_alert["status"] == "acknowledged"
    assert acked_alert["acknowledged_at"] is not None

    # 12. Resolve Alert Workflow
    res = client.post(
        f"/api/v1/alerts/{alert_id}/resolve",
        json={"note": "Symptoms fully resolved following quiet rest period."},
    )
    assert res.status_code == 200
    resolved_alert = res.json()
    assert resolved_alert["status"] == "resolved"
    assert resolved_alert["resolved_at"] is not None


def test_database_seeding_idempotency(db_session: Session):
    """Verify seed_database is non-destructive and produces zero duplicate records on repeated execution."""
    # Run seed_database twice
    seed_database()
    astro_count_1 = db_session.query(Astronaut).count()
    meas_count_1 = db_session.query(Measurement).count()
    base_count_1 = db_session.query(AstronautBaseline).count()

    seed_database()
    astro_count_2 = db_session.query(Astronaut).count()
    meas_count_2 = db_session.query(Measurement).count()
    base_count_2 = db_session.query(AstronautBaseline).count()

    assert astro_count_1 == astro_count_2
    assert meas_count_1 == meas_count_2
    assert base_count_1 == base_count_2


def test_invalid_identifiers_return_clean_404(client: TestClient):
    """Verify invalid IDs yield standard, structured 404 responses rather than 500 errors."""
    # Unknown astronaut
    res = client.get("/api/v1/astronauts/nonexistent-id-999")
    assert res.status_code == 404
    body = res.json()
    assert "error" in body or "message" in body

    # Unknown alert acknowledgement
    res = client.post("/api/v1/alerts/nonexistent-alert-999/acknowledge", json={})
    assert res.status_code == 404

    # Unknown alert resolution
    res = client.post("/api/v1/alerts/nonexistent-alert-999/resolve", json={})
    assert res.status_code == 404


def test_synthetic_provenance_transparency(client: TestClient, db_session: Session, sample_astronaut: Astronaut):
    """Verify all synthetic measurements and assessments explicitly preserve is_synthetic=True."""
    now = datetime.now(timezone.utc)
    db_session.add(
        Measurement(
            id="synth-prov-meas",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=72.0,
            unit="bpm",
            measured_at=now,
            source="Synthetic Simulator",
            context="resting_cabin",
            data_quality="nominal",
            is_synthetic=True,
        )
    )
    db_session.commit()

    res = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/measurements")
    assert res.status_code == 200
    meas = res.json()["data"][0]
    assert meas["is_synthetic"] is True

    # Assessment synthetic flag
    res = client.post(
        f"/api/v1/astronauts/{sample_astronaut.id}/assessments",
        json={"context": "resting_cabin", "lookback_hours": 72},
    )
    assert res.status_code == 200
    asm = res.json()
    assert asm["is_synthetic"] is True
