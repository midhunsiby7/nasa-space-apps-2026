"""NASA OSDR research catalogue API v1 endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Path

from app.repository.research_repo import ResearchRepository, get_research_repository
from app.schemas.research import (
    EvidenceCategory,
    ResearchRelevance,
    ResearchStudyListResponse,
    ResearchStudyResponse,
    ResearchSummaryResponse,
)

router = APIRouter(prefix="/research", tags=["research"])


@router.get("/summary", response_model=ResearchSummaryResponse)
def get_research_catalogue_summary(
    repo: ResearchRepository = Depends(get_research_repository),
) -> ResearchSummaryResponse:
    """Retrieve portfolio summary statistics across the curated NASA OSDR research catalogue."""
    summary_data = repo.get_summary()
    return ResearchSummaryResponse.model_validate(summary_data)


@router.get("/studies", response_model=ResearchStudyListResponse)
def list_research_studies(
    body_system: Optional[str] = Query(None, description="Filter studies by body system (e.g. cardiovascular, musculoskeletal)"),
    evidence_category: Optional[EvidenceCategory] = Query(None, description="Filter studies by scientific origin/evidence category"),
    relevance: Optional[ResearchRelevance] = Query(None, description="Filter studies by operational relevance (HIGH, MODERATE, LOW)"),
    search: Optional[str] = Query(None, description="Case-insensitive search across accession, title, description, and keywords"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return (1-100)"),
    offset: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    repo: ResearchRepository = Depends(get_research_repository),
) -> ResearchStudyListResponse:
    """Retrieve a paginated collection of curated NASA OSDR research studies with multi-dimensional filtering."""
    studies, total = repo.list_studies(
        body_system=body_system,
        evidence_category=evidence_category,
        relevance=relevance,
        search=search,
        limit=limit,
        offset=offset,
    )
    data = [ResearchStudyResponse.model_validate(s) for s in studies]
    return ResearchStudyListResponse(
        data=data,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/studies/{accession}", response_model=ResearchStudyResponse)
def get_research_study_by_accession(
    accession: str = Path(..., description="Unique study accession identifier (e.g. 'OSD-575')"),
    repo: ResearchRepository = Depends(get_research_repository),
) -> ResearchStudyResponse:
    """Retrieve full scientific details for an individual NASA research study by accession number."""
    study = repo.get_study_by_accession(accession)
    return ResearchStudyResponse.model_validate(study)
