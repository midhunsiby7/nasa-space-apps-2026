"""Pydantic v2 schemas for health trend intelligence and telemetry freshness."""

from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TrendObservation(BaseModel):
    """Personal statistical trend evaluation for a specific physiological telemetry metric."""
    measurement_type: str = Field(..., description="Canonical metric identifier")
    canonical_identifier: str = Field(..., description="Canonical metric identifier")
    context: str = Field(..., description="Context partition evaluated")
    exercise_modality: Optional[str] = Field(None, description="Exercise modality if relevant")
    unit: str = Field(..., description="Standard metric unit")

    # Current Telemetry Point
    current_value: Optional[float] = Field(None, description="Most recent valid telemetry reading")
    current_measured_at: Optional[str] = Field(None, description="Timestamp of most recent reading in UTC ISO format")

    # Baseline Comparison
    baseline_id: Optional[str] = Field(None, description="Active baseline identifier used for comparison")
    baseline_version: Optional[int] = Field(None, description="Version of active baseline")
    baseline_type: Optional[str] = Field(None, description="Baseline cohort type ('inflight' | 'preflight')")
    baseline_maturity: Optional[str] = Field(None, description="Maturity status ('insufficient', 'provisional', 'established')")
    baseline_median: Optional[float] = Field(None, description="Active baseline median")
    baseline_iqr: Optional[float] = Field(None, description="Active baseline interquartile range")
    robust_scale_iqr: Optional[float] = Field(None, description="Active baseline scale estimate (IQR / 1.349)")
    robust_z: Optional[float] = Field(None, description="Robust standardized deviation score: (current - median) / scale")

    # Trend Analytics
    sample_count: int = Field(0, description="Observations evaluated in lookback trajectory window")
    sens_slope: Optional[float] = Field(None, description="Non-parametric Sen's slope rate-of-change estimator (units per 24 hours)")
    trend_direction: str = Field(
        ...,
        description="Statistical trajectory classification: 'stable' | 'increasing' | 'decreasing' | 'sustained_deviation' | 'insufficient_data'",
    )
    consecutive_deviations: int = Field(0, description="Count of consecutive observations exceeding robust deviation threshold (|Z| > 1.5)")
    is_sustained: bool = Field(False, description="True if deviation is sustained across consecutive readings")

    # Telemetry Freshness
    freshness_status: str = Field(..., description="Telemetry currency status: 'fresh' | 'stale' | 'unknown'")
    hours_since_last_observation: Optional[float] = Field(None, description="Elapsed hours since most recent telemetry observation")
    expected_interval_hours: float = Field(..., description="Nominal collection interval for this metric category")

    # Provenance & Quality
    data_quality_status: str = Field("nominal", description="Overall data fidelity indicator in lookback window")
    explanation: str = Field(..., description="Human-readable statistical observation explanation")

    model_config = ConfigDict(from_attributes=True)


class AstronautTrendsResponse(BaseModel):
    """Collection of evaluated metric trends for an astronaut."""
    astronaut_id: str
    evaluated_at: str
    data: List[TrendObservation]
    total: int

    model_config = ConfigDict(from_attributes=True)


class MetricFreshnessItem(BaseModel):
    """Telemetry freshness assessment for an individual metric."""
    measurement_type: str
    last_measured_at: Optional[str]
    hours_since_last: Optional[float]
    expected_interval_hours: float
    status: str = Field(..., description="'fresh' | 'stale' | 'unknown'")
    message: str


class TelemetryFreshnessResponse(BaseModel):
    """Comprehensive telemetry freshness report for an astronaut."""
    astronaut_id: str
    evaluated_at: str
    items: List[MetricFreshnessItem]
    stale_count: int
    total_metrics: int

    model_config = ConfigDict(from_attributes=True)
