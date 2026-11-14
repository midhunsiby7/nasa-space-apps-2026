"""Tests for measurement endpoints according to API_CONTRACT.md."""

from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.astronaut import Astronaut


def test_get_measurements_for_astronaut_success(
    client: TestClient, sample_astronaut: Astronaut, sample_measurements
):
    """Test retrieving measurements for an existing astronaut."""
    response = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/measurements")
    assert response.status_code == 200
    data = response.json()
    assert data["astronaut_id"] == sample_astronaut.id
    assert data["total"] == 3
    assert len(data["data"]) == 3
    assert data["limit"] == 100
    assert data["offset"] == 0

    first_item = data["data"][0]
    assert "id" in first_item
    assert "measurement_type" in first_item
    assert "value" in first_item
    assert "unit" in first_item
    assert "measured_at" in first_item
    assert "source" in first_item
    assert "data_quality" in first_item
    assert first_item["is_synthetic"] is True


def test_get_measurements_empty_results(client: TestClient, sample_astronaut: Astronaut):
    """Test retrieving measurements when astronaut has zero records."""
    response = client.get(f"/api/v1/astronauts/{sample_astronaut.id}/measurements")
    assert response.status_code == 200
    data = response.json()
    assert data["astronaut_id"] == sample_astronaut.id
    assert data["total"] == 0
    assert data["data"] == []


def test_get_measurements_astronaut_not_found(client: TestClient):
    """Test 404 response when astronaut does not exist."""
    response = client.get("/api/v1/astronauts/astro-999/measurements")
    assert response.status_code == 404
    error_data = response.json()
    assert "error" in error_data
    assert error_data["error"]["code"] == "ASTRONAUT_NOT_FOUND"


def test_get_measurements_filter_type(
    client: TestClient, sample_astronaut: Astronaut, sample_measurements
):
    """Test filtering measurements by metric type."""
    response = client.get(
        f"/api/v1/astronauts/{sample_astronaut.id}/measurements?measurement_type=spo2"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["data"]) == 1
    assert data["data"][0]["measurement_type"] == "spo2"
    assert data["data"][0]["unit"] == "%"


def test_get_measurements_filter_time_range(
    client: TestClient, sample_astronaut: Astronaut, sample_measurements
):
    """Test filtering measurements by start_time and end_time."""
    now = datetime.now(timezone.utc)
    start_str = (now - timedelta(minutes=20)).isoformat().replace("+00:00", "Z")
    end_str = (now + timedelta(minutes=5)).isoformat().replace("+00:00", "Z")

    response = client.get(
        f"/api/v1/astronauts/{sample_astronaut.id}/measurements?start_time={start_str}&end_time={end_str}"
    )
    assert response.status_code == 200
    data = response.json()
    # meas-test-02 (T - 15m) and meas-test-03 (T) should match; meas-test-01 (T - 30m) excluded
    assert data["total"] == 2
    types = [m["measurement_type"] for m in data["data"]]
    assert "spo2" in types
    assert "heart_rate" in types


def test_get_measurements_invalid_start_time(
    client: TestClient, sample_astronaut: Astronaut
):
    """Test 400 response for invalid ISO timestamp format."""
    response = client.get(
        f"/api/v1/astronauts/{sample_astronaut.id}/measurements?start_time=2026-99-99"
    )
    assert response.status_code == 400
    error_data = response.json()
    assert "error" in error_data
    assert error_data["error"]["code"] == "INVALID_QUERY_PARAMETER"
    assert error_data["error"]["details"]["parameter"] == "start_time"


def test_get_measurements_pagination(
    client: TestClient, sample_astronaut: Astronaut, sample_measurements
):
    """Test pagination parameters on measurements."""
    response = client.get(
        f"/api/v1/astronauts/{sample_astronaut.id}/measurements?limit=1&offset=0"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert data["limit"] == 1
    assert data["offset"] == 0
    assert len(data["data"]) == 1


def test_measurement_association_isolation(
    client: TestClient, db_session: Session, sample_astronaut: Astronaut, sample_measurements
):
    """Ensure measurements for one astronaut are not returned for another."""
    other_astro = Astronaut(
        id="astro-other-99",
        name="Other Astronaut",
        crew_role="Pilot",
        mission_name="Artemis IX",
        mission_day=5,
    )
    db_session.add(other_astro)
    db_session.commit()

    response = client.get(f"/api/v1/astronauts/{other_astro.id}/measurements")
    assert response.status_code == 200
    data = response.json()
    assert data["astronaut_id"] == other_astro.id
    assert data["total"] == 0
    assert data["data"] == []
