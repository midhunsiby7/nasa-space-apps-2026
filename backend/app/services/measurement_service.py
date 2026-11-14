"""Service functions for astronaut measurement telemetry access and business logic."""

from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.measurement import Measurement
from app.catalog.definitions import get_query_expansion_types


def list_measurements_for_astronaut(
    db: Session,
    astronaut_id: str,
    measurement_type: Optional[str] = None,
    context: Optional[str] = None,
    exercise_modality: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 100,
    offset: int = 0,
) -> Tuple[List[Measurement], int]:
    """Retrieve filtered, paginated telemetry measurements for an astronaut.

    Includes alias-expansion query resolution (e.g. blood_oxygen <-> spo2),
    while preserving strict separation between body_temperature and core_temperature.
    """
    base_query = select(Measurement).where(Measurement.astronaut_id == astronaut_id)

    if measurement_type:
        expansion_types = get_query_expansion_types(measurement_type.strip())
        if len(expansion_types) == 1:
            base_query = base_query.where(Measurement.measurement_type == expansion_types[0])
        else:
            base_query = base_query.where(Measurement.measurement_type.in_(expansion_types))

    if context:
        base_query = base_query.where(Measurement.context == context.strip())

    if exercise_modality:
        base_query = base_query.where(Measurement.exercise_modality == exercise_modality.strip())

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
