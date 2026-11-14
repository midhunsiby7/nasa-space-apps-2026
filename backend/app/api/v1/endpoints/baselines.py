"""Astronaut baseline calculation and retrieval API v1 endpoints."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, Body, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.exceptions import (
    AstronautNotFoundException,
    BaselineNotFoundException,
    InvalidQueryParameterException,
)
from app.models.baseline import AstronautBaseline
from app.schemas.baseline import (
    BaselineCalculationRequest,
    BaselineListResponse,
    BaselineResponse,
    PreflightFinalizationRequest,
)
from app.services.astronaut_service import get_astronaut
from app.services.baseline_lifecycle_service import (
    create_or_recalculate_lifecycle_baseline,
    finalize_preflight_baseline,
    get_baseline_history,
)
from app.services.baseline_service import (
    calculate_and_persist_baseline,
    format_baseline_response,
    get_baseline_for_astronaut,
    list_baselines_for_astronaut,
)
from app.catalog import normalize_context

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
    create_version: bool = Query(False, description="Whether to increment version and archive previous active version"),
    db: Session = Depends(get_db),
) -> BaselineResponse:
    """Calculate and persist an astronaut's personal baseline envelope for a given metric and context."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    parsed_start = parse_iso_datetime(payload.start_time, "start_time")
    parsed_end = parse_iso_datetime(payload.end_time, "end_time")

    if create_version or payload.baseline_type == "preflight":
        baseline = create_or_recalculate_lifecycle_baseline(
            db=db,
            astronaut_id=astronaut_id,
            measurement_type=payload.measurement_type,
            baseline_type=payload.baseline_type,
            context=payload.context,
            exercise_modality=payload.exercise_modality,
            measurement_site=payload.measurement_site,
            measurement_method=payload.measurement_method,
            include_degraded=payload.include_degraded,
            start_time=parsed_start,
            end_time=parsed_end,
        )
    else:
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


@router.post(
    "/astronauts/{astronaut_id}/baselines/preflight",
    response_model=BaselineResponse,
    status_code=status.HTTP_200_OK,
)
def calculate_astronaut_preflight_baseline(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    payload: BaselineCalculationRequest = Body(..., description="Preflight baseline calculation parameters"),
    db: Session = Depends(get_db),
) -> BaselineResponse:
    """Calculate and register a preflight benchmark baseline for an astronaut."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    parsed_start = parse_iso_datetime(payload.start_time, "start_time")
    parsed_end = parse_iso_datetime(payload.end_time, "end_time")

    baseline = create_or_recalculate_lifecycle_baseline(
        db=db,
        astronaut_id=astronaut_id,
        measurement_type=payload.measurement_type,
        baseline_type="preflight",
        context=payload.context,
        exercise_modality=payload.exercise_modality,
        measurement_site=payload.measurement_site,
        measurement_method=payload.measurement_method,
        include_degraded=payload.include_degraded,
        start_time=parsed_start,
        end_time=parsed_end,
    )

    return format_baseline_response(baseline)


@router.post(
    "/baselines/{baseline_id}/finalize",
    response_model=BaselineResponse,
    status_code=status.HTTP_200_OK,
)
def finalize_baseline(
    baseline_id: str = Path(..., description="Unique identifier of preflight baseline to finalize"),
    payload: Optional[PreflightFinalizationRequest] = Body(None, description="Optional finalization justification"),
    db: Session = Depends(get_db),
) -> BaselineResponse:
    """Finalize a preflight baseline, locking it against any future modifications."""
    baseline = finalize_preflight_baseline(db=db, baseline_id=baseline_id)
    return format_baseline_response(baseline)


@router.get(
    "/astronauts/{astronaut_id}/baselines/active",
    response_model=BaselineListResponse,
)
def get_astronaut_active_baselines(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    baseline_type: Optional[str] = Query(None, description="Optional baseline type filter ('preflight' | 'inflight')"),
    context: Optional[str] = Query(None, description="Optional context filter"),
    db: Session = Depends(get_db),
) -> BaselineListResponse:
    """Retrieve all currently active baseline references for an astronaut."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    query = (
        select(AstronautBaseline)
        .where(AstronautBaseline.astronaut_id == astronaut_id)
        .where(AstronautBaseline.is_active == True)  # noqa: E712
    )

    if baseline_type:
        query = query.where(AstronautBaseline.baseline_type == baseline_type.strip().lower())
    if context:
        norm_context = normalize_context(context)
        query = query.where(AstronautBaseline.context == norm_context)

    query = query.order_by(AstronautBaseline.measurement_type.asc(), AstronautBaseline.context.asc())
    baselines = list(db.execute(query).scalars().all())

    data = [format_baseline_response(b) for b in baselines]
    return BaselineListResponse(
        astronaut_id=astronaut_id,
        data=data,
        total=len(data),
    )


@router.get(
    "/astronauts/{astronaut_id}/baselines/{measurement_type}/history",
    response_model=BaselineListResponse,
)
def get_astronaut_baseline_history_endpoint(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    measurement_type: str = Path(..., description="Canonical metric identifier or alias"),
    baseline_type: Optional[str] = Query(None, description="Optional baseline type filter ('preflight' | 'inflight')"),
    context: Optional[str] = Query(None, description="Optional context filter"),
    db: Session = Depends(get_db),
) -> BaselineListResponse:
    """Retrieve historical baseline versions for auditability and evolution tracking."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    baselines = get_baseline_history(
        db=db,
        astronaut_id=astronaut_id,
        measurement_type=measurement_type,
        baseline_type=baseline_type,
        context=context,
    )

    data = [format_baseline_response(b) for b in baselines]
    return BaselineListResponse(
        astronaut_id=astronaut_id,
        data=data,
        total=len(data),
    )


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
