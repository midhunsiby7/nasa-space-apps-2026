"""Pydantic v2 schemas for explainable health assessments and safe guidance."""

from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AssessmentFinding(BaseModel):
    """Structured metric-level observation within a health assessment."""
    measurement_type: str = Field(..., description="Canonical metric identifier")
    status: str = Field(..., description="Classification status for this metric")
    summary: str = Field(..., description="Detailed observational summary")
    current_value: Optional[float] = Field(None, description="Observed value")
    baseline_median: Optional[float] = Field(None, description="Active baseline median")
    robust_z: Optional[float] = Field(None, description="Robust standardized deviation score")
    trend: str = Field("stable", description="Trajectory direction")
    baseline_version: Optional[int] = Field(None, description="Version of baseline used")


class GuidanceItem(BaseModel):
    """Actionable, safe, and deterministic non-diagnostic operational guidance item."""
    category: str = Field(..., description="Guidance category (e.g. 'telemetry_verification', 'context_review', 'medical_consultation')")
    action: str = Field(..., description="Concrete suggested operational action")
    rationale: str = Field(..., description="Scientific or operational rationale")
    is_medical_prescription: bool = Field(False, description="Explicit disclaimer: False for non-medical guidance")


class AssessmentResponse(BaseModel):
    """Public representation of an explainable health assessment."""
    id: str = Field(..., description="Unique assessment identifier")
    astronaut_id: str = Field(..., description="Unique astronaut identifier")
    assessment_date: str = Field(..., description="Timestamp of evaluation in UTC ISO format")
    overall_classification: str = Field(
        ...,
        description="Workflow attention tier: 'routine' | 'needs_attention' | 'medical_review_recommended' | 'emergency'",
    )
    summary_explanation: str = Field(..., description="Structured, transparent natural-language explanation")
    findings: List[AssessmentFinding] = Field(default_factory=list, description="Per-metric diagnostic support findings")
    guidance: List[GuidanceItem] = Field(default_factory=list, description="Safe deterministic guidance recommendations")
    baseline_versions_used: Dict[str, str] = Field(default_factory=dict, description="Mapping of metric to baseline version identifier")
    data_quality_status: str = Field("nominal", description="Data quality rating across evaluated window")
    is_synthetic: bool = Field(True, description="Provenance indicator")
    created_at: str = Field(..., description="Creation timestamp in UTC ISO format")

    model_config = ConfigDict(from_attributes=True)


class AssessmentListResponse(BaseModel):
    """Collection of health assessment records for an astronaut."""
    astronaut_id: str
    data: List[AssessmentResponse]
    total: int

    model_config = ConfigDict(from_attributes=True)


class AssessmentGenerationRequest(BaseModel):
    """Request parameters for generating an explainable health assessment."""
    context: str = Field("resting_cabin", description="Primary physiological context partition")
    lookback_hours: int = Field(72, ge=1, le=720, description="Observation lookback window in hours (default 72h)")
    generate_alerts: bool = Field(True, description="Whether to automatically emit alerts for non-routine findings")
