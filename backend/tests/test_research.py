"""Automated tests for NASA OSDR research catalogue integration.

Validates catalogue loading, strict schema enforcement, lifecycle availability,
filtering, search, summary metrics, dependency overrides, and operational measurement isolation.
"""

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repository.research_repo import (
    ResearchRepository,
    get_research_repository,
    set_research_repository,
)
from app.schemas.research import (
    EvidenceCategory,
    ResearchRelevance,
    ResearchStudy,
)
from app.core.exceptions import (
    ResearchCatalogueCorruptException,
    ResearchCatalogueUnavailableException,
    ResearchStudyNotFoundException,
)


@pytest.fixture(autouse=True)
def reset_repo_override():
    """Ensure clean dependency overrides and reset singleton state before and after each test."""
    app.dependency_overrides.clear()
    set_research_repository(None)
    yield
    app.dependency_overrides.clear()
    set_research_repository(None)


@pytest.fixture
def client():
    """TestClient instance for FastAPI application."""
    return TestClient(app)


# --- 1. Valid Catalogue Loading ---
def test_valid_catalogue_loading():
    """Scenario 1: Verifies the curated catalogue file loads cleanly with verified NASA studies."""
    repo = ResearchRepository(auto_load=True)
    assert repo.is_available is True
    assert repo.unavailable_reason is None
    studies, total = repo.list_studies()
    assert total >= 15
    assert len(studies) == total

    # Check key verified accession presence
    study = repo.get_study_by_accession("OSD-575")
    assert study.accession == "OSD-575"
    assert study.evidence_category == EvidenceCategory.HUMAN_SPACEFLIGHT
    assert study.relevance == ResearchRelevance.HIGH
    assert study.is_synthetic is False


# --- 2. Missing Catalogue Handling ---
def test_missing_catalogue_handling_without_breaking_existing_endpoints(client, tmp_path):
    """Scenario 2: Missing catalogue enters documented unavailable state (503) without breaking existing endpoints."""
    non_existent = tmp_path / "does_not_exist.json"
    repo = ResearchRepository(catalogue_path=non_existent, auto_load=True)
    assert repo.is_available is False
    assert "not found" in (repo.unavailable_reason or "").lower()

    # Override repository dependency
    app.dependency_overrides[get_research_repository] = lambda: repo

    # Existing endpoints must continue to work normally
    health_resp = client.get("/api/v1/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"

    astronauts_resp = client.get("/api/v1/astronauts")
    assert astronauts_resp.status_code == 200

    # Research endpoints must return 503 Service Unavailable with standard error envelope
    studies_resp = client.get("/api/v1/research/studies")
    assert studies_resp.status_code == 503
    err = studies_resp.json()["error"]
    assert err["code"] == "RESEARCH_CATALOGUE_UNAVAILABLE"
    assert "unavailable" in err["message"].lower()

    summary_resp = client.get("/api/v1/research/summary")
    assert summary_resp.status_code == 503

    item_resp = client.get("/api/v1/research/studies/OSD-575")
    assert item_resp.status_code == 503


# --- 3. Malformed Catalogue Rejection ---
def test_malformed_catalogue_rejection(tmp_path):
    """Scenario 3: Corrupt JSON or invalid structure fails loudly with actionable validation info."""
    corrupt_file = tmp_path / "corrupt.json"
    corrupt_file.write_text("{ this is invalid json content }", encoding="utf-8")

    with pytest.raises(ResearchCatalogueCorruptException) as exc_info:
        ResearchRepository(catalogue_path=corrupt_file, auto_load=True)
    assert "Failed to parse research catalogue JSON" in str(exc_info.value)


# --- 4. Duplicate Accession Rejection ---
def test_duplicate_accession_rejection(tmp_path):
    """Scenario 4: Duplicate accessions in curated catalogue are rejected loudly."""
    dup_file = tmp_path / "duplicate.json"
    data = {
        "catalogue_version": "1.0.0",
        "studies": [
            {
                "accession": "OSD-100",
                "title": "Study Alpha",
                "description": "First study description",
                "evidence_category": "ANIMAL_MODEL",
                "relevance": "HIGH",
                "organism": "Mus musculus",
                "mission_context": "ISS",
                "measurements_summary": "Summary",
            },
            {
                "accession": "OSD-100",
                "title": "Study Duplicate",
                "description": "Second duplicate study description",
                "evidence_category": "HUMAN_SPACEFLIGHT",
                "relevance": "MODERATE",
                "organism": "Homo sapiens",
                "mission_context": "ISS",
                "measurements_summary": "Summary",
            },
        ],
    }
    dup_file.write_text(json.dumps(data), encoding="utf-8")

    with pytest.raises(ResearchCatalogueCorruptException) as exc_info:
        ResearchRepository(catalogue_path=dup_file, auto_load=True)
    assert "Duplicate accession 'OSD-100'" in str(exc_info.value)


# --- 5. Strict Schema Validation ---
def test_strict_schema_validation(tmp_path):
    """Scenario 5: Extra unexpected fields, invalid accession format, or invalid enums are rejected."""
    # Test extra fields forbidden (extra='forbid')
    bad_extra = tmp_path / "bad_extra.json"
    bad_extra.write_text(json.dumps({
        "studies": [
            {
                "accession": "OSD-101",
                "title": "Study Extra",
                "description": "Testing extra fields",
                "evidence_category": "HUMAN_SPACEFLIGHT",
                "relevance": "HIGH",
                "organism": "Homo sapiens",
                "mission_context": "LEO",
                "measurements_summary": "Summary",
                "unrecognized_field": "disallowed value",
            }
        ]
    }), encoding="utf-8")

    with pytest.raises(ResearchCatalogueCorruptException) as exc_info:
        ResearchRepository(catalogue_path=bad_extra, auto_load=True)
    assert "Validation failed" in str(exc_info.value)

    # Test invalid evidence category (e.g. 'omics' instead of exact enum)
    bad_cat = tmp_path / "bad_cat.json"
    bad_cat.write_text(json.dumps({
        "studies": [
            {
                "accession": "OSD-102",
                "title": "Study Cat",
                "description": "Testing invalid category",
                "evidence_category": "omics",
                "relevance": "HIGH",
                "organism": "Homo sapiens",
                "mission_context": "LEO",
                "measurements_summary": "Summary",
            }
        ]
    }), encoding="utf-8")

    with pytest.raises(ResearchCatalogueCorruptException):
        ResearchRepository(catalogue_path=bad_cat, auto_load=True)

    # Test invalid relevance (e.g. 'MEDIUM' instead of 'MODERATE')
    bad_rel = tmp_path / "bad_rel.json"
    bad_rel.write_text(json.dumps({
        "studies": [
            {
                "accession": "OSD-103",
                "title": "Study Rel",
                "description": "Testing invalid relevance",
                "evidence_category": "ANIMAL_MODEL",
                "relevance": "MEDIUM",
                "organism": "Mus musculus",
                "mission_context": "ISS",
                "measurements_summary": "Summary",
            }
        ]
    }), encoding="utf-8")

    with pytest.raises(ResearchCatalogueCorruptException):
        ResearchRepository(catalogue_path=bad_rel, auto_load=True)

    # Test invalid accession format
    bad_acc = tmp_path / "bad_acc.json"
    bad_acc.write_text(json.dumps({
        "studies": [
            {
                "accession": "invalid_accession_no_dash",
                "title": "Study Acc",
                "description": "Testing invalid accession format",
                "evidence_category": "ANIMAL_MODEL",
                "relevance": "LOW",
                "organism": "Mus musculus",
                "mission_context": "ISS",
                "measurements_summary": "Summary",
            }
        ]
    }), encoding="utf-8")

    with pytest.raises(ResearchCatalogueCorruptException):
        ResearchRepository(catalogue_path=bad_acc, auto_load=True)


# --- 6. Valid Study Listing ---
def test_valid_study_listing(client):
    """Scenario 6: GET /api/v1/research/studies retrieves paginated list of studies."""
    resp = client.get("/api/v1/research/studies")
    assert resp.status_code == 200
    body = resp.json()
    assert "data" in body
    assert "total" in body
    assert body["total"] >= 15
    assert len(body["data"]) == body["total"]

    first = body["data"][0]
    assert "accession" in first
    assert "title" in first
    assert "evidence_category" in first
    assert "relevance" in first
    assert "assay_types" in first
    assert "body_systems" in first
    assert first["is_synthetic"] is False


# --- 7. Body-System Filtering ---
def test_body_system_filtering(client):
    """Scenario 7: GET /api/v1/research/studies?body_system=cardiovascular isolates cardiovascular studies."""
    resp = client.get("/api/v1/research/studies?body_system=cardiovascular")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 3
    for study in body["data"]:
        assert "cardiovascular" in [bs.lower() for bs in study["body_systems"]]


# --- 8. Evidence-Category Filtering ---
def test_evidence_category_filtering(client):
    """Scenario 8: GET /api/v1/research/studies?evidence_category=HUMAN_SPACEFLIGHT isolates astronaut flight studies."""
    resp = client.get("/api/v1/research/studies?evidence_category=HUMAN_SPACEFLIGHT")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 2
    for study in body["data"]:
        assert study["evidence_category"] == "HUMAN_SPACEFLIGHT"
        assert study["organism"] == "Homo sapiens"


# --- 9. Relevance Filtering ---
def test_relevance_filtering(client):
    """Scenario 9: GET /api/v1/research/studies?relevance=HIGH isolates high-priority studies."""
    resp = client.get("/api/v1/research/studies?relevance=HIGH")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 5
    for study in body["data"]:
        assert study["relevance"] == "HIGH"


# --- 10. Case-Insensitive Search ---
def test_case_insensitive_search(client):
    """Scenario 10: GET /api/v1/research/studies?search=inspiration4 searches across title, context, and fields."""
    resp = client.get("/api/v1/research/studies?search=inspiration4")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 2
    for study in body["data"]:
        text_corpus = (
            study["accession"]
            + " "
            + study["title"]
            + " "
            + study["description"]
            + " "
            + study["mission_context"]
        ).lower()
        assert "inspiration4" in text_corpus


# --- 11. Individual Accession Retrieval ---
def test_individual_accession_retrieval(client):
    """Scenario 11: GET /api/v1/research/studies/{accession} retrieves individual study detail."""
    resp = client.get("/api/v1/research/studies/OSD-575")
    assert resp.status_code == 200
    study = resp.json()
    assert study["accession"] == "OSD-575"
    assert "Inspiration4" in study["title"]
    assert study["evidence_category"] == "HUMAN_SPACEFLIGHT"
    assert "cardiovascular" in study["body_systems"]
    assert study["sample_count"] == 24
    assert study["is_synthetic"] is False


# --- 12. Unknown Accession 404 ---
def test_unknown_accession_returns_404(client):
    """Scenario 12: GET /api/v1/research/studies/OSD-9999 returns 404 and standardized error envelope."""
    resp = client.get("/api/v1/research/studies/OSD-9999")
    assert resp.status_code == 404
    body = resp.json()
    assert "error" in body
    assert body["error"]["code"] == "RESEARCH_STUDY_NOT_FOUND"
    assert "OSD-9999" in body["error"]["message"]


# --- 13. Summary Statistics ---
def test_summary_statistics(client):
    """Scenario 13: GET /api/v1/research/summary returns comprehensive counts and categories."""
    resp = client.get("/api/v1/research/summary")
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["total_studies"] >= 15
    assert "counts_by_evidence_category" in summary
    assert "counts_by_body_system" in summary
    assert "counts_by_relevance" in summary
    assert summary["counts_by_evidence_category"]["HUMAN_SPACEFLIGHT"] >= 2
    assert summary["counts_by_evidence_category"]["ANIMAL_MODEL"] >= 5
    assert summary["counts_by_body_system"]["cardiovascular"] >= 3
    assert summary["counts_by_body_system"]["musculoskeletal"] >= 3
    assert summary["counts_by_relevance"]["HIGH"] >= 5


# --- 14. Dependency Override Testing ---
def test_dependency_override_testing(client):
    """Scenario 14: Verifies FastAPI dependency injection override mechanism works cleanly for mock repos."""
    mock_study = ResearchStudy(
        accession="OSD-777",
        title="Mock Astronaut Research Study",
        description="Controlled testing study for dependency injection override verification.",
        evidence_category=EvidenceCategory.HUMAN_SPACEFLIGHT,
        relevance=ResearchRelevance.HIGH,
        assay_types=["Mock Assay"],
        body_systems=["cardiovascular"],
        data_formats=["CSV"],
        organism="Homo sapiens",
        mission_context="Test Context",
        measurements_summary="Mock measurements",
        sample_count=4,
        is_synthetic=False,
    )

    class MockRepository:
        def __init__(self):
            self.is_available = True
            self.unavailable_reason = None

        def list_studies(self, **kwargs):
            return [mock_study], 1

        def get_study_by_accession(self, accession: str):
            if accession.upper() == "OSD-777":
                return mock_study
            raise ResearchStudyNotFoundException(accession=accession)

        def get_summary(self):
            return {
                "total_studies": 1,
                "counts_by_evidence_category": {"HUMAN_SPACEFLIGHT": 1},
                "counts_by_body_system": {"cardiovascular": 1},
                "counts_by_relevance": {"HIGH": 1},
                "last_catalogue_update": "2026-11-14T00:00:00Z",
            }

    app.dependency_overrides[get_research_repository] = lambda: MockRepository()

    list_resp = client.get("/api/v1/research/studies")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1
    assert list_resp.json()["data"][0]["accession"] == "OSD-777"

    detail_resp = client.get("/api/v1/research/studies/OSD-777")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["title"] == "Mock Astronaut Research Study"


# --- 15. Operational Measurement Isolation ---
def test_operational_measurement_isolation(client):
    """Scenario 15: Verifies complete scientific isolation between research catalogue and operational measurements.
    
    Research records must never enter or pollute astronaut telemetry streams,
    and all seeded operational telemetry must remain synthetic.
    """
    # 1. Check astronaut measurement stream does not contain research accessions
    meas_resp = client.get("/api/v1/astronauts/astro-001/measurements?limit=100")
    assert meas_resp.status_code == 200
    records = meas_resp.json()["data"]
    for record in records:
        assert record["is_synthetic"] is True
        assert not record["id"].startswith("OSD-")
        assert not record["measurement_type"].startswith("OSD-")

    # 2. Check catalog discovery endpoint does not conflate research studies with operational metrics
    cat_resp = client.get("/api/v1/measurements/catalog")
    assert cat_resp.status_code == 200
    metrics = cat_resp.json()["metrics"]
    for m in metrics:
        assert not m["canonical_identifier"].startswith("OSD-")

    # 3. Check research endpoints return strictly empirical studies (is_synthetic = False)
    research_resp = client.get("/api/v1/research/studies")
    assert research_resp.status_code == 200
    for s in research_resp.json()["data"]:
        assert s["is_synthetic"] is False
        assert s["accession"].startswith("OSD-")
