"""Pydantic v2 schemas for health alerts and alert lifecycle management."""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AlertResponse(BaseModel):
    """Public representation of an operational health alert."""
    id: str = Field(..., description="Unique alert identifier")
    astronaut_id: str = Field(..., description="Unique astronaut identifier")
    assessment_id: Optional[str] = Field(None, description="Linked assessment ID if emitted by assessment engine")
    measurement_type: str = Field(..., description="Metric classification related to alert")
    category: str = Field(..., description="Alert category (e.g. 'physiological_shift', 'data_staleness')")
    severity: str = Field(..., description="Severity tier: 'low' | 'medium' | 'high' | 'critical'")
    title: str = Field(..., description="Concise headline summary")
    explanation: str = Field(..., description="Transparent, non-diagnostic explanation")
    status: str = Field(..., description="Alert lifecycle state: 'active' | 'acknowledged' | 'resolved'")
    created_at: str = Field(..., description="Timestamp of alert emission in UTC ISO format")
    acknowledged_at: Optional[str] = Field(None, description="Timestamp when operator acknowledged the alert")
    resolved_at: Optional[str] = Field(None, description="Timestamp when operator resolved the alert")
    is_synthetic: bool = Field(True, description="Provenance flag")

    model_config = ConfigDict(from_attributes=True)


class AlertListResponse(BaseModel):
    """Collection of health alerts for an astronaut."""
    astronaut_id: str
    data: List[AlertResponse]
    total: int

    model_config = ConfigDict(from_attributes=True)


class AlertActionRequest(BaseModel):
    """Optional payload when acknowledging or resolving an alert."""
    note: Optional[str] = Field(None, max_length=500, description="Operator acknowledgement or resolution note")
