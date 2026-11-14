"""Common schemas and error response models matching API_CONTRACT.md."""

from typing import Any, Optional
from pydantic import BaseModel, ConfigDict


class ErrorDetail(BaseModel):
    """Detailed error object structure."""
    code: str
    message: str
    details: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    """Standardized top-level API error envelope."""
    error: ErrorDetail

    model_config = ConfigDict(from_attributes=True)
