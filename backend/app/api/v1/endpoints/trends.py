"""Astronaut telemetry trend intelligence and freshness API endpoints."""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.exceptions import AstronautNotFoundException
from app.schemas.trend import (
    AstronautTrendsResponse,
    TelemetryFreshnessResponse,
    TrendObservation,
)
from app.services.astronaut_service import get_astronaut
from app.services.baseline_service import _format_iso
from app.services.trend_service import (
    analyze_all_trends_for_astronaut,
    analyze_metric_trend,
    get_astronaut_telemetry_freshness,
)

router = APIRouter(tags=["trends"])


@router.get(
    "/astronauts/{astronaut_id}/trends",
    response_model=AstronautTrendsResponse,
)
def get_astronaut_trends(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    context: str = Query("resting_cabin", description="Context partition to analyze (default: resting_cabin)"),
    lookback_hours: int = Query(72, ge=1, le=720, description="Lookback window in hours (default: 72h)"),
    db: Session = Depends(get_db),
) -> AstronautTrendsResponse:
    """Analyze intra-individual health trends across all monitored metrics for an astronaut."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    trends = analyze_all_trends_for_astronaut(
        db=db,
        astronaut_id=astronaut_id,
        context=context,
        lookback_hours=lookback_hours,
    )

    now_utc = datetime.now(timezone.utc)
    return AstronautTrendsResponse(
        astronaut_id=astronaut_id,
        evaluated_at=_format_iso(now_utc) or "",
        data=trends,
        total=len(trends),
    )


@router.get(
    "/astronauts/{astronaut_id}/trends/freshness",
    response_model=TelemetryFreshnessResponse,
)
def get_astronaut_freshness(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    db: Session = Depends(get_db),
) -> TelemetryFreshnessResponse:
    """Evaluate telemetry currency and staleness report across all monitored metrics."""
    return get_astronaut_telemetry_freshness(db=db, astronaut_id=astronaut_id)


@router.get(
    "/astronauts/{astronaut_id}/trends/{measurement_type}",
    response_model=TrendObservation,
)
def get_astronaut_metric_trend(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    measurement_type: str = Path(..., description="Canonical metric identifier or accepted alias"),
    context: str = Query("resting_cabin", description="Context partition to analyze (default: resting_cabin)"),
    exercise_modality: Optional[str] = Query(None, description="Exercise countermeasure equipment modality if context is exercise"),
    lookback_hours: int = Query(72, ge=1, le=720, description="Lookback window in hours (default: 72h)"),
    db: Session = Depends(get_db),
) -> TrendObservation:
    """Analyze intra-individual trajectory, Sen's slope rate-of-change, and deviation for a specific metric."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    return analyze_metric_trend(
        db=db,
        astronaut_id=astronaut_id,
        measurement_type=measurement_type,
        context=context,
        exercise_modality=exercise_modality,
        lookback_hours=lookback_hours,
    )
