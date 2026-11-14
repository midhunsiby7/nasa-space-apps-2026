"""Pydantic schemas package."""

from app.schemas.common import ErrorDetail, ErrorResponse
from app.schemas.astronaut import (
    AstronautBase,
    AstronautCreate,
    AstronautResponse,
    AstronautListResponse,
)
from app.schemas.measurement import (
    MeasurementBase,
    MeasurementCreate,
    MeasurementResponse,
    MeasurementListResponse,
)

__all__ = [
    "ErrorDetail",
    "ErrorResponse",
    "AstronautBase",
    "AstronautCreate",
    "AstronautResponse",
    "AstronautListResponse",
    "MeasurementBase",
    "MeasurementCreate",
    "MeasurementResponse",
    "MeasurementListResponse",
]
