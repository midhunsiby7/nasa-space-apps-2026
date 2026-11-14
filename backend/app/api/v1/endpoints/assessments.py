"""Explainable health assessment and clinical decision support API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, Body, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.exceptions import (
    AssessmentNotFoundException,
    AstronautNotFoundException,
)
from app.models.assessment import HealthAssessment
from app.schemas.assessment import (
    AssessmentGenerationRequest,
    AssessmentListResponse,
    AssessmentResponse,
)
from app.services.assessment_service import (
    format_assessment_response,
    get_latest_assessment_for_astronaut,
    list_assessments_for_astronaut,
    synthesize_health_assessment,
)
from app.services.astronaut_service import get_astronaut

router = APIRouter(tags=["assessments"])


@router.post(
    "/astronauts/{astronaut_id}/assessments",
    response_model=AssessmentResponse,
    status_code=status.HTTP_200_OK,
)
def generate_astronaut_assessment(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    payload: AssessmentGenerationRequest = Body(
        default_factory=AssessmentGenerationRequest,
        description="Assessment generation parameters",
    ),
    db: Session = Depends(get_db),
) -> AssessmentResponse:
    """Synthesize an explainable, deterministic multi-metric health assessment for an astronaut."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    assessment = synthesize_health_assessment(
        db=db,
        astronaut_id=astronaut_id,
        context=payload.context,
        lookback_hours=payload.lookback_hours,
        generate_alerts=payload.generate_alerts,
        emergency_protocol_config=payload.emergency_protocol_config,
        reported_symptoms=payload.reported_symptoms,
    )

    return format_assessment_response(assessment)


@router.get(
    "/astronauts/{astronaut_id}/assessments/latest",
    response_model=AssessmentResponse,
)
def get_latest_astronaut_assessment(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    db: Session = Depends(get_db),
) -> AssessmentResponse:
    """Retrieve the latest explainable health assessment for an astronaut."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    assessment = get_latest_assessment_for_astronaut(db=db, astronaut_id=astronaut_id)
    if not assessment:
        raise AssessmentNotFoundException(
            assessment_id=f"latest for astronaut '{astronaut_id}'",
            message=f"No health assessments have been generated for astronaut '{astronaut_id}'.",
        )

    return format_assessment_response(assessment)


@router.get(
    "/astronauts/{astronaut_id}/assessments",
    response_model=AssessmentListResponse,
)
def list_astronaut_assessments(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of historical assessments to return"),
    db: Session = Depends(get_db),
) -> AssessmentListResponse:
    """Retrieve historical health assessments for an astronaut."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    assessments = list_assessments_for_astronaut(db=db, astronaut_id=astronaut_id, limit=limit)
    data = [format_assessment_response(a) for a in assessments]

    return AssessmentListResponse(
        astronaut_id=astronaut_id,
        data=data,
        total=len(data),
    )


@router.get(
    "/assessments/{assessment_id}",
    response_model=AssessmentResponse,
)
def get_assessment_by_id(
    assessment_id: str = Path(..., description="Unique assessment identifier"),
    db: Session = Depends(get_db),
) -> AssessmentResponse:
    """Retrieve a single health assessment by its unique ID."""
    assessment = db.get(HealthAssessment, assessment_id)
    if not assessment:
        raise AssessmentNotFoundException(assessment_id=assessment_id)

    return format_assessment_response(assessment)
