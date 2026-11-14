"""Tests for astronaut endpoints according to API_CONTRACT.md."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.astronaut import Astronaut


def test_list_astronauts_empty(client: TestClient):
    """Test retrieving astronauts when the database has no records."""
    response = client.get("/api/v1/astronauts")
    assert response.status_code == 200
    data = response.json()
    assert data["data"] == []
    assert data["total"] == 0
    assert data["limit"] == 50
    assert data["offset"] == 0


def test_list_astronauts_with_data(client: TestClient, sample_astronaut: Astronaut):
    """Test retrieving astronauts when records exist."""
    response = client.get("/api/v1/astronauts")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["data"]) == 1
    record = data["data"][0]
    assert record["id"] == sample_astronaut.id
    assert record["name"] == sample_astronaut.name
    assert record["crew_role"] == sample_astronaut.crew_role
    assert record["mission_name"] == sample_astronaut.mission_name
    assert record["mission_day"] == sample_astronaut.mission_day
    assert "created_at" in record


def test_list_astronauts_mission_filter(
    client: TestClient, db_session: Session, sample_astronaut: Astronaut
):
    """Test filtering astronauts by mission name."""
    # Add a second astronaut on a different mission
    other_astro = Astronaut(
        id="astro-other-02",
        name="Mark Watney",
        crew_role="Botanist",
        mission_name="Ares III",
        mission_day=18,
    )
    db_session.add(other_astro)
    db_session.commit()

    # Filter by 'Artemis'
    res_artemis = client.get("/api/v1/astronauts?mission_name=Artemis")
    assert res_artemis.status_code == 200
    data_artemis = res_artemis.json()
    assert data_artemis["total"] == 1
    assert data_artemis["data"][0]["mission_name"] == "Artemis IX"

    # Filter by 'Ares'
    res_ares = client.get("/api/v1/astronauts?mission_name=Ares")
    assert res_ares.status_code == 200
    data_ares = res_ares.json()
    assert data_ares["total"] == 1
    assert data_ares["data"][0]["name"] == "Mark Watney"

    # Filter by non-existent mission
    res_none = client.get("/api/v1/astronauts?mission_name=NonExistentMission")
    assert res_none.status_code == 200
    assert res_none.json()["total"] == 0
    assert res_none.json()["data"] == []


def test_list_astronauts_pagination(
    client: TestClient, db_session: Session, sample_astronaut: Astronaut
):
    """Test limit and offset pagination parameters."""
    for i in range(5):
        db_session.add(
            Astronaut(
                id=f"astro-page-{i}",
                name=f"Astronaut {i}",
                crew_role="Specialist",
                mission_name="Test Mission",
                mission_day=i,
            )
        )
    db_session.commit()

    # Total should now be 6 (sample_astronaut + 5)
    res_page1 = client.get("/api/v1/astronauts?limit=2&offset=0")
    assert res_page1.status_code == 200
    data1 = res_page1.json()
    assert data1["total"] == 6
    assert data1["limit"] == 2
    assert data1["offset"] == 0
    assert len(data1["data"]) == 2

    res_page2 = client.get("/api/v1/astronauts?limit=2&offset=2")
    assert res_page2.status_code == 200
    data2 = res_page2.json()
    assert len(data2["data"]) == 2
    assert data2["data"][0]["id"] != data1["data"][0]["id"]


def test_list_astronauts_invalid_limit(client: TestClient):
    """Test validation rejection for invalid limit (exceeds max 100)."""
    response = client.get("/api/v1/astronauts?limit=999")
    assert response.status_code == 400
    error_data = response.json()
    assert "error" in error_data
    assert error_data["error"]["code"] == "INVALID_QUERY_PARAMETER"


def test_get_astronaut_by_id_success(client: TestClient, sample_astronaut: Astronaut):
    """Test retrieving an existing astronaut by ID."""
    response = client.get(f"/api/v1/astronauts/{sample_astronaut.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_astronaut.id
    assert data["name"] == sample_astronaut.name
    assert data["crew_role"] == sample_astronaut.crew_role
    assert data["mission_name"] == sample_astronaut.mission_name
    assert data["mission_day"] == sample_astronaut.mission_day


def test_get_astronaut_by_id_not_found(client: TestClient):
    """Test 404 response for non-existent astronaut ID."""
    response = client.get("/api/v1/astronauts/astro-999")
    assert response.status_code == 404
    error_data = response.json()
    assert "error" in error_data
    assert error_data["error"]["code"] == "ASTRONAUT_NOT_FOUND"
    assert "astro-999" in error_data["error"]["message"]
    assert error_data["error"]["details"]["astronaut_id"] == "astro-999"
