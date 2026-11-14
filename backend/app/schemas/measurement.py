"""Measurement Pydantic v2 schemas."""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_serializer


class MeasurementBase(BaseModel):
    """Base fields shared across measurement schemas."""
    measurement_type: str = Field(..., max_length=64, description="Metric classification (e.g. heart_rate)")
    value: float = Field(..., description="Numerical telemetry reading")
    unit: str = Field(..., max_length=32, description="Measurement unit (e.g. bpm, celsius, %)")
    measured_at: datetime = Field(..., description="Timestamp of observation in UTC")
    source: str = Field(..., max_length=128, description="Originating sensor, hardware subsystem, or study")
    context: Optional[str] = Field(None, max_length=255, description="Operational or environmental context")
    data_quality: str = Field("nominal", max_length=32, description="Quality indicator")
    is_synthetic: bool = Field(True, description="Provenance flag: True for synthetic, False for empirical")


class MeasurementCreate(MeasurementBase):
    """Schema for internal measurement creation/seeding."""
    id: str = Field(..., max_length=64, description="Unique measurement identifier (e.g., 'meas-00101')")
    astronaut_id: str = Field(..., max_length=64, description="Foreign key referencing astronaut.id")


class MeasurementResponse(MeasurementBase):
    """Public representation of an individual measurement matching API_CONTRACT.md."""
    id: str
    astronaut_id: str

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("measured_at")
    def serialize_measured_at(self, dt: datetime, _info) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace("+00:00", "Z")


class MeasurementListResponse(BaseModel):
    """Collection response for astronaut telemetry measurements matching API_CONTRACT.md."""
    astronaut_id: str
    data: List[MeasurementResponse]
    total: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)
