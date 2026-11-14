"""Measurement telemetry API v1 endpoints."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.exceptions import AstronautNotFoundException, InvalidQueryParameterException
from app.schemas.measurement import MeasurementListResponse
from app.services.astronaut_service import get_astronaut
from app.services.measurement_service import list_measurements_for_astronaut

router = APIRouter(tags=["measurements"])


def parse_iso_datetime(value: str, param_name: str) -> datetime:
    """Parse an ISO 8601 string, raising InvalidQueryParameterException on error."""
    try:
        clean_val = value.strip().replace("Z", "+00:00")
        return datetime.fromisoformat(clean_val)
    except Exception:
        raise InvalidQueryParameterException(
            parameter=param_name,
            message=f"Parameter '{param_name}' must be a valid ISO 8601 formatted timestamp.",
            value=value,
        )


@router.get("/astronauts/{astronaut_id}/measurements", response_model=MeasurementListResponse)
def get_astronaut_measurements(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    measurement_type: Optional[str] = Query(None, description="Filter by metric type (e.g., heart_rate)"),
    start_time: Optional[str] = Query(None, description="Filter measurements on/after this ISO 8601 timestamp"),
    end_time: Optional[str] = Query(None, description="Filter measurements on/before this ISO 8601 timestamp"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return (1-1000)"),
    offset: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    db: Session = Depends(get_db),
) -> MeasurementListResponse:
    """Retrieve physiological and environmental telemetry measurements for a specific astronaut."""
    # Verify astronaut exists first
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    # Validate timestamps if provided
    parsed_start: Optional[datetime] = None
    parsed_end: Optional[datetime] = None

    if start_time:
        parsed_start = parse_iso_datetime(start_time, "start_time")

    if end_time:
        parsed_end = parse_iso_datetime(end_time, "end_time")

    measurements, total = list_measurements_for_astronaut(
        db=db,
        astronaut_id=astronaut_id,
        measurement_type=measurement_type,
        start_time=parsed_start,
        end_time=parsed_end,
        limit=limit,
        offset=offset,
    )

    return MeasurementListResponse(
        astronaut_id=astronaut_id,
        data=measurements,
        total=total,
        limit=limit,
        offset=offset,
    )
