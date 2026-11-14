"""Service functions for astronaut data access and business logic."""

from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.astronaut import Astronaut


def get_astronaut(db: Session, astronaut_id: str) -> Optional[Astronaut]:
    """Retrieve an individual astronaut by ID."""
    stmt = select(Astronaut).where(Astronaut.id == astronaut_id)
    return db.execute(stmt).scalar_one_or_none()


def list_astronauts(
    db: Session,
    mission_name: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[Astronaut], int]:
    """List astronauts with optional filtering by mission name and pagination."""
    base_query = select(Astronaut)

    if mission_name:
        base_query = base_query.where(Astronaut.mission_name.ilike(f"%{mission_name.strip()}%"))

    # Compute total count
    count_stmt = select(func.count()).select_from(base_query.subquery())
    total = db.execute(count_stmt).scalar() or 0

    # Retrieve paginated records ordered by creation/id
    query_stmt = (
        base_query.order_by(Astronaut.created_at.asc(), Astronaut.id.asc())
        .offset(offset)
        .limit(limit)
    )
    astronauts = list(db.execute(query_stmt).scalars().all())

    return astronauts, total
