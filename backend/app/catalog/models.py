"""Data models and structures for the COSMOLOOKUP Measurement Catalog."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class MetricCategory(str, Enum):
    """Broad physiological or environmental classification."""
    CARDIOVASCULAR = "cardiovascular"
    RESPIRATORY = "respiratory"
    THERMAL = "thermal"
    SLEEP = "sleep"
    ENVIRONMENTAL = "environmental"


class ContextCategory(str, Enum):
    """Operational and physiological context taxonomy categories."""
    # Tier A: Physiological Baseline-Eligible
    RESTING_CABIN = "resting_cabin"
    SLEEP_CYCLE = "sleep_cycle"
    EXERCISE_ACTIVE = "exercise_active"
    EXERCISE_RECOVERY = "exercise_recovery"

    # Tier B: Operational Tracking Context
    EVA_OPERATIONAL = "eva_operational"

    # Tier C: Excluded Ingestion Catch-Alls
    UNKNOWN = "unknown"
    OTHER = "other"


class ExerciseModality(str, Enum):
    """Decoupled physical countermeasure equipment modalities."""
    ARED_RESISTIVE = "ared_resistive"
    CEVIS_AEROBIC = "cevis_aerobic"
    T2_TREADMILL = "t2_treadmill"
    OTHER = "other"
    UNKNOWN = "unknown"


class CatalogEntry(BaseModel):
    """Definition of a canonical metric in the COSMOLOOKUP catalog."""
    canonical_identifier: str = Field(..., description="Unique canonical name (e.g. 'spo2', 'heart_rate')")
    display_name: str = Field(..., description="Human-readable label for dashboard rendering")
    category: MetricCategory = Field(..., description="Physiological/environmental category")
    standard_unit: str = Field(..., description="Canonical standard unit of observation")
    accepted_aliases: List[str] = Field(default_factory=list, description="Accepted wire aliases mapping to this metric")
    accepted_units: List[str] = Field(default_factory=list, description="Recognized unit strings convertible or matching standard")
    valid_range_min: float = Field(..., description="Physically plausible lower boundary for telemetry sanity checks")
    valid_range_max: float = Field(..., description="Physically plausible upper boundary for telemetry sanity checks")
    is_derived: bool = Field(False, description="Whether metric is mathematically derived rather than directly observed")
    applicable_contexts: List[str] = Field(default_factory=list, description="Contexts in which this metric is typically observed")
    hardware_examples: List[str] = Field(default_factory=list, description="Example hardware sensors or subsystems")
    description: str = Field(..., description="Scientific definition and baseline handling guidance")
    strict_site_matching: bool = Field(False, description="Whether strict anatomical site matching is mandatory (e.g. core temp)")


class ValidationResult(BaseModel):
    """Result of telemetry normalization and boundary validation."""
    is_valid: bool = Field(..., description="True if measurement passes alias, unit, and physical boundary checks")
    normalized_type: str = Field(..., description="Resolved canonical measurement identifier")
    normalized_value: float = Field(..., description="Value after unit conversion (e.g., Fahrenheit to Celsius)")
    normalized_unit: str = Field(..., description="Resolved standard unit")
    errors: List[str] = Field(default_factory=list, description="Validation failure messages if invalid")
    warnings: List[str] = Field(default_factory=list, description="Non-fatal warnings (e.g. edge-of-range observations)")


class ComparabilityResult(BaseModel):
    """Result of measurement comparability evaluation."""
    are_comparable: bool = Field(..., description="True if two observations can be meaningfully compared or pooled")
    reason: str = Field(..., description="Scientific explanation of comparability or isolation rationale")
    mismatched_dimensions: List[str] = Field(default_factory=list, description="Attributes causing comparability failure")
