"""Astronaut baseline Pydantic v2 schemas and Personal Operational Envelopes."""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_serializer


class PersonalOperationalEnvelope(BaseModel):
    """Statistical representation of an individual astronaut's observed physiological range."""
    median: float = Field(..., description="Personal median (primary robust location estimator)")
    q25: float = Field(..., description="First quartile / 25th percentile")
    q75: float = Field(..., description="Third quartile / 75th percentile")
    iqr: float = Field(..., description="Interquartile range (Q3 - Q1, primary robust scale estimator)")
    robust_scale_iqr: float = Field(
        ...,
        description="Gaussian-equivalent scale estimate (IQR / 1.349). Not universally unbiased."
    )
    mean: float = Field(..., description="Sample mean (secondary descriptive statistic)")
    std_dev: float = Field(..., description="Sample standard deviation (secondary descriptive statistic)")
    min_value: float = Field(..., description="Minimum observed measurement value")
    max_value: float = Field(..., description="Maximum observed measurement value")
    sample_count: int = Field(..., description="Total number of valid measurements contributing to baseline")
    window_start: Optional[str] = Field(None, description="Timestamp of earliest measurement in baseline window")
    window_end: Optional[str] = Field(None, description="Timestamp of latest measurement in baseline window")
    disclaimer: str = Field(
        "Statistical reference values only. NOT medical diagnostic thresholds or clinical flight rules.",
        description="Scientific decision-support boundary notice",
    )


class BaselineQualitySummary(BaseModel):
    """Transparent summary of telemetry data quality across evaluated measurements."""
    nominal: int = Field(0, description="Count of nominal-quality measurements included")
    degraded: int = Field(0, description="Count of non-nominal (degraded/noisy) measurements evaluated")
    total_evaluated: int = Field(0, description="Total measurements evaluated during calculation")


class BaselineResponse(BaseModel):
    """Public representation of an astronaut's personal baseline envelope."""
    id: str = Field(..., description="Unique baseline identifier")
    astronaut_id: str = Field(..., description="Unique astronaut identifier")
    measurement_type: str = Field(..., description="Canonical metric identifier")
    context: str = Field(..., description="Physiological context (e.g. resting_cabin)")
    exercise_modality: Optional[str] = Field(None, description="Decoupled exercise countermeasure equipment")
    measurement_site: Optional[str] = Field(None, description="Anatomical observation site")
    measurement_method: Optional[str] = Field(None, description="Measurement technique or protocol")
    sensor_model: Optional[str] = Field(None, description="Hardware or sensor model designation")
    unit: str = Field(..., description="Standard canonical unit")
    envelope: PersonalOperationalEnvelope = Field(..., description="Statistical personal operational envelope")
    quality_summary: BaselineQualitySummary = Field(..., description="Data quality breakdown")
    algorithm_version: str = Field("v2b-iqr", description="Engine algorithm version")
    is_synthetic: bool = Field(True, description="Provenance indicator")
    calculated_at: str = Field(..., description="Timestamp of calculation in UTC ISO format")

    model_config = ConfigDict(from_attributes=True)


class BaselineListResponse(BaseModel):
    """Collection of calculated baseline records for an astronaut."""
    astronaut_id: str
    data: List[BaselineResponse]
    total: int

    model_config = ConfigDict(from_attributes=True)


class BaselineCalculationRequest(BaseModel):
    """Request payload for calculating or refreshing a personal baseline."""
    measurement_type: str = Field(..., description="Target canonical metric or accepted alias (e.g. 'heart_rate', 'spo2')")
    context: str = Field("resting_cabin", description="Target baseline-eligible context")
    exercise_modality: Optional[str] = Field(None, description="Exercise modality if context is exercise")
    measurement_site: Optional[str] = Field(None, description="Specific anatomical site if required")
    measurement_method: Optional[str] = Field(None, description="Specific method if required")
    include_degraded: bool = Field(False, description="Whether to include degraded/noisy measurements (default False)")
    start_time: Optional[str] = Field(None, description="Optional start of observation window (ISO 8601)")
    end_time: Optional[str] = Field(None, description="Optional end of observation window (ISO 8601)")
