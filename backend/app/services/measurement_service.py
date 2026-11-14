"""Service functions for astronaut measurement telemetry access and business logic."""

from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.measurement import Measurement


def list_measurements_for_astronaut(
    db: Session,
    astronaut_id: str,
    measurement_type: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 100,
    offset: int = 0,
) -> Tuple[List[Measurement], int]:
    """Retrieve filtered, paginated telemetry measurements for an astronaut."""
    base_query = select(Measurement).where(Measurement.astronaut_id == astronaut_id)

    if measurement_type:
        base_query = base_query.where(Measurement.measurement_type == measurement_type.strip())

    if start_time:
        base_query = base_query.where(Measurement.measured_at >= start_time)

    if end_time:
        base_query = base_query.where(Measurement.measured_at <= end_time)

    # Compute total matching count
    count_stmt = select(func.count()).select_from(base_query.subquery())
    total = db.execute(count_stmt).scalar() or 0

    # Retrieve records ordered chronologically (latest first for timeline analysis)
    query_stmt = (
        base_query.order_by(Measurement.measured_at.desc(), Measurement.id.asc())
        .offset(offset)
        .limit(limit)
    )
    measurements = list(db.execute(query_stmt).scalars().all())

    return measurements, total
