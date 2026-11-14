"""Astronaut Pydantic v2 schemas."""

from datetime import datetime, timezone
from typing import List
from pydantic import BaseModel, ConfigDict, Field, field_serializer


class AstronautBase(BaseModel):
    """Base fields shared across astronaut schemas."""
    name: str = Field(..., max_length=255, description="Full name of the astronaut")
    crew_role: str = Field(..., max_length=128, description="Mission operational or medical role")
    mission_name: str = Field(..., max_length=128, description="Assigned mission name")
    mission_day: int = Field(0, ge=0, description="Elapsed mission day (>= 0)")


class AstronautCreate(AstronautBase):
    """Schema for internal astronaut creation/seeding."""
    id: str = Field(..., max_length=64, description="Unique astronaut identifier (e.g., 'astro-001')")


class AstronautResponse(AstronautBase):
    """Public representation of an astronaut profile matching API_CONTRACT.md."""
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace("+00:00", "Z")


class AstronautListResponse(BaseModel):
    """Paginated collection response for astronauts."""
    data: List[AstronautResponse]
    total: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)
