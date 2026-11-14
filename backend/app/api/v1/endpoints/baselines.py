"""Astronaut baseline calculation and retrieval API v1 endpoints."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, Body, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.exceptions import (
    AstronautNotFoundException,
    BaselineNotFoundException,
    InvalidQueryParameterException,
)
from app.schemas.baseline import (
    BaselineCalculationRequest,
    BaselineListResponse,
    BaselineResponse,
)
from app.services.astronaut_service import get_astronaut
from app.services.baseline_service import (
    calculate_and_persist_baseline,
    format_baseline_response,
    get_baseline_for_astronaut,
    list_baselines_for_astronaut,
)

router = APIRouter(tags=["baselines"])


def parse_iso_datetime(value: Optional[str], param_name: str) -> Optional[datetime]:
    """Parse an ISO 8601 string, raising InvalidQueryParameterException on error."""
    if not value:
        return None
    try:
        clean_val = value.strip().replace("Z", "+00:00")
        return datetime.fromisoformat(clean_val)
    except Exception:
        raise InvalidQueryParameterException(
            parameter=param_name,
            message=f"Parameter '{param_name}' must be a valid ISO 8601 formatted timestamp.",
            value=value,
        )


@router.post(
    "/astronauts/{astronaut_id}/baselines/calculate",
    response_model=BaselineResponse,
    status_code=status.HTTP_200_OK,
)
def calculate_astronaut_baseline(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    payload: BaselineCalculationRequest = Body(..., description="Baseline calculation parameters"),
    db: Session = Depends(get_db),
) -> BaselineResponse:
    """Calculate and persist an astronaut's personal baseline envelope for a given metric and context."""
    # Verify astronaut exists
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    parsed_start = parse_iso_datetime(payload.start_time, "start_time")
    parsed_end = parse_iso_datetime(payload.end_time, "end_time")

    baseline = calculate_and_persist_baseline(
        db=db,
        astronaut_id=astronaut_id,
        measurement_type=payload.measurement_type,
        context=payload.context,
        exercise_modality=payload.exercise_modality,
        measurement_site=payload.measurement_site,
        measurement_method=payload.measurement_method,
        include_degraded=payload.include_degraded,
        start_time=parsed_start,
        end_time=parsed_end,
    )

    return format_baseline_response(baseline)


@router.get(
    "/astronauts/{astronaut_id}/baselines",
    response_model=BaselineListResponse,
)
def get_astronaut_baselines(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    context: Optional[str] = Query(None, description="Optional context filter (e.g., resting_cabin, sleep_cycle)"),
    db: Session = Depends(get_db),
) -> BaselineListResponse:
    """Retrieve all calculated baseline envelopes for a specific astronaut."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    baselines = list_baselines_for_astronaut(
        db=db,
        astronaut_id=astronaut_id,
        context=context,
    )

    data = [format_baseline_response(b) for b in baselines]
    return BaselineListResponse(
        astronaut_id=astronaut_id,
        data=data,
        total=len(data),
    )


@router.get(
    "/astronauts/{astronaut_id}/baselines/{measurement_type}",
    response_model=BaselineResponse,
)
def get_astronaut_baseline_by_type(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    measurement_type: str = Path(..., description="Metric canonical identifier or alias (e.g., heart_rate, spo2)"),
    context: Optional[str] = Query(None, description="Optional context filter (e.g., resting_cabin)"),
    exercise_modality: Optional[str] = Query(None, description="Optional exercise modality filter"),
    db: Session = Depends(get_db),
) -> BaselineResponse:
    """Retrieve a specific baseline envelope for an astronaut and metric type."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    baseline = get_baseline_for_astronaut(
        db=db,
        astronaut_id=astronaut_id,
        measurement_type=measurement_type,
        context=context,
        exercise_modality=exercise_modality,
    )

    if not baseline:
        raise BaselineNotFoundException(
            astronaut_id=astronaut_id,
            measurement_type=measurement_type,
            context=context,
        )

    return format_baseline_response(baseline)
