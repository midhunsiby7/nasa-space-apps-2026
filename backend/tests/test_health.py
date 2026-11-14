"""Tests for application health and status endpoints."""

from fastapi.testclient import TestClient


def test_health_check_root(client: TestClient):
    """Verify root health check endpoint returns 200 and expected payload."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app" in data
    assert data["version"] == "v1"


def test_health_check_v1(client: TestClient):
    """Verify v1 health check endpoint returns 200 and expected payload."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "COSMOLOOKUP API"
