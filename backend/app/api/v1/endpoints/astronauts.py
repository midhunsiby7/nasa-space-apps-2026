"""Astronaut API v1 endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.exceptions import AstronautNotFoundException
from app.schemas.astronaut import AstronautResponse, AstronautListResponse
from app.services.astronaut_service import get_astronaut, list_astronauts

router = APIRouter(prefix="/astronauts", tags=["astronauts"])


@router.get("", response_model=AstronautListResponse)
def get_astronauts(
    mission_name: Optional[str] = Query(None, description="Filter astronauts by mission name"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return (1-100)"),
    offset: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    db: Session = Depends(get_db),
) -> AstronautListResponse:
    """Retrieve a paginated collection of astronaut profiles, optionally filtered by mission name."""
    astronauts, total = list_astronauts(
        db=db,
        mission_name=mission_name,
        limit=limit,
        offset=offset,
    )
    return AstronautListResponse(
        data=astronauts,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{astronaut_id}", response_model=AstronautResponse)
def get_astronaut_by_id(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    db: Session = Depends(get_db),
) -> AstronautResponse:
    """Retrieve detailed profile information for an individual astronaut by ID."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)
    return AstronautResponse.model_validate(astronaut)
