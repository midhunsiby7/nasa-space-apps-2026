"""Telemetry normalization, validation, and comparability engine."""

from typing import Any, List, Optional
from app.catalog.definitions import (
    MEASUREMENT_CATALOG,
    get_canonical_type,
    get_catalog_entry,
)
from app.catalog.models import (
    ComparabilityResult,
    ValidationResult,
)
from app.catalog.context import (
    is_valid_context,
    is_valid_exercise_modality,
    normalize_context,
    normalize_exercise_modality,
)


def _get_field(obj: Any, field_name: str) -> Any:
    """Extract field from dict, Pydantic model, or SQLAlchemy ORM model."""
    if isinstance(obj, dict):
        return obj.get(field_name)
    return getattr(obj, field_name, None)


def normalize_and_validate_measurement(
    measurement_type: str,
    value: float,
    unit: str,
    context: Optional[str] = None,
    exercise_modality: Optional[str] = None,
    measurement_site: Optional[str] = None,
    measurement_method: Optional[str] = None,
) -> ValidationResult:
    """Normalize aliases/units and validate physical boundaries against the catalog.

    Performs:
    1. Alias resolution (e.g. 'blood_oxygen' -> 'spo2', 'hr' -> 'heart_rate').
    2. Unit conversion (e.g. Fahrenheit -> Celsius for temperature metrics).
    3. Plausible range verification against canonical limits.
    4. Temperature type integrity (core_temperature site confirmation).
    5. Context and exercise modality validation.
    """
    errors: List[str] = []
    warnings: List[str] = []

    canonical_type = get_canonical_type(measurement_type)
    if not canonical_type or canonical_type not in MEASUREMENT_CATALOG:
        return ValidationResult(
            is_valid=False,
            normalized_type=measurement_type.strip() if measurement_type else "unknown",
            normalized_value=value,
            normalized_unit=unit.strip() if unit else "unknown",
            errors=[f"Unrecognized measurement type: '{measurement_type}'."],
            warnings=[],
        )

    entry = MEASUREMENT_CATALOG[canonical_type]
    clean_unit = unit.strip().lower() if unit else ""
    normalized_val = float(value)
    normalized_unit = entry.standard_unit

    # Unit Normalization & Conversion
    if canonical_type in ("body_temperature", "core_temperature"):
        if clean_unit in ("fahrenheit", "f", "degf", "°f"):
            # Convert °F to °C: (°F - 32) * 5 / 9
            normalized_val = round((normalized_val - 32.0) * 5.0 / 9.0, 2)
            normalized_unit = "celsius"
        elif clean_unit in ("celsius", "c", "degc", "°c"):
            normalized_val = round(normalized_val, 2)
            normalized_unit = "celsius"
        else:
            errors.append(
                f"Invalid unit '{unit}' for temperature metric '{canonical_type}'. "
                f"Expected Celsius or convertible Fahrenheit."
            )
            normalized_unit = unit
    else:
        accepted_lower = [u.lower() for u in entry.accepted_units]
        if clean_unit in accepted_lower:
            normalized_unit = entry.standard_unit
        else:
            errors.append(
                f"Invalid unit '{unit}' for metric '{canonical_type}'. "
                f"Expected standard unit '{entry.standard_unit}'."
            )
            normalized_unit = unit

    # Physical Range Validation
    if normalized_val < entry.valid_range_min or normalized_val > entry.valid_range_max:
        errors.append(
            f"Value {normalized_val} {normalized_unit} is outside the physically plausible range "
            f"[{entry.valid_range_min}, {entry.valid_range_max}] for {canonical_type}."
        )

    # Core Temperature Sensor Site Verification
    if canonical_type == "core_temperature" and measurement_site:
        superficial_sites = {"skin", "axilla", "axillary", "forehead", "surface", "temporal"}
        if measurement_site.strip().lower() in superficial_sites:
            errors.append(
                f"Superficial measurement site '{measurement_site}' is incompatible with 'core_temperature'. "
                f"Core temperature requires confirmed deep visceral telemetry (e.g. ingestible pill)."
            )

    # Context and Modality Advisory Checks
    if context:
        if not is_valid_context(context):
            warnings.append(f"Context '{context}' is unclassified; treated as 'unknown'.")

    if exercise_modality:
        if not is_valid_exercise_modality(exercise_modality):
            warnings.append(f"Exercise modality '{exercise_modality}' is unclassified; treated as 'unknown'.")

    return ValidationResult(
        is_valid=(len(errors) == 0),
        normalized_type=canonical_type,
        normalized_value=normalized_val,
        normalized_unit=normalized_unit,
        errors=errors,
        warnings=warnings,
    )


def are_measurements_comparable(m1: Any, m2: Any) -> ComparabilityResult:
    """Determine whether two telemetry observations are comparable for baselines or trends.

    Strict Evaluation Rules:
    1. Canonical Type Match: Both must map to identical canonical metric.
       - 'spo2' and 'blood_oxygen' ARE comparable.
       - 'body_temperature' and 'core_temperature' are NEVER comparable.
    2. Context Match:
       - Baseline-eligible contexts cannot be compared across different categories
         (e.g., resting_cabin vs exercise_active).
       - EVA operational context vitals must NEVER be compared to cabin/sleep/exercise data.
       - Unclassified contexts (unknown, other) cannot form valid comparisons.
    3. Exercise Modality Match:
       - For exercise contexts, equipment modalities must strictly match
         (e.g., ARED resistive is NOT comparable to CEVIS aerobic or T2 treadmill).
    4. Measurement Site & Method:
       - For core_temperature, differing sites or methods break comparability.
    """
    mismatched_dimensions: List[str] = []

    type1 = _get_field(m1, "measurement_type")
    type2 = _get_field(m2, "measurement_type")
    canon1 = get_canonical_type(type1)
    canon2 = get_canonical_type(type2)

    if not canon1 or not canon2:
        return ComparabilityResult(
            are_comparable=False,
            reason=f"Unrecognized or unmapped measurement type: '{type1}' or '{type2}'.",
            mismatched_dimensions=["measurement_type"],
        )

    # Temperature strict independence check
    if {canon1, canon2} == {"body_temperature", "core_temperature"}:
        return ComparabilityResult(
            are_comparable=False,
            reason=(
                "body_temperature (skin/surface) and core_temperature (deep visceral) "
                "are distinct physiological metrics and must not be compared or pooled."
            ),
            mismatched_dimensions=["measurement_type"],
        )

    if canon1 != canon2:
        return ComparabilityResult(
            are_comparable=False,
            reason=f"Measurement types '{canon1}' and '{canon2}' are distinct canonical metrics.",
            mismatched_dimensions=["measurement_type"],
        )

    # Context Comparability Check
    raw_ctx1 = _get_field(m1, "context")
    raw_ctx2 = _get_field(m2, "context")
    ctx1 = normalize_context(raw_ctx1)
    ctx2 = normalize_context(raw_ctx2)

    # EVA Context Nuance: EVA is operational and strictly isolated
    if ctx1 == "eva_operational" or ctx2 == "eva_operational":
        if ctx1 != ctx2:
            return ComparabilityResult(
                are_comparable=False,
                reason="Operational EVA context vitals cannot be compared to cabin, sleep, or exercise measurements.",
                mismatched_dimensions=["context"],
            )

    # Excluded contexts
    if ctx1 in ("unknown", "other") or ctx2 in ("unknown", "other"):
        if ctx1 != ctx2:
            return ComparabilityResult(
                are_comparable=False,
                reason=f"Unclassified contexts ('{ctx1}' vs '{ctx2}') cannot form valid comparative baselines.",
                mismatched_dimensions=["context"],
            )

    if ctx1 != ctx2:
        return ComparabilityResult(
            are_comparable=False,
            reason=f"Context mismatch: '{ctx1}' vs '{ctx2}' represent divergent physiological states.",
            mismatched_dimensions=["context"],
        )

    # Exercise Modality Isolation Check
    if ctx1 in ("exercise_active", "exercise_recovery") and ctx2 in ("exercise_active", "exercise_recovery"):
        mod1 = normalize_exercise_modality(_get_field(m1, "exercise_modality"))
        mod2 = normalize_exercise_modality(_get_field(m2, "exercise_modality"))
        if mod1 != mod2:
            return ComparabilityResult(
                are_comparable=False,
                reason=(
                    f"Exercise modality mismatch: '{mod1}' and '{mod2}' have divergent "
                    f"cardiovascular and musculoskeletal strain profiles."
                ),
                mismatched_dimensions=["exercise_modality"],
            )

    # Site and Method Check (especially for core_temperature)
    site1 = _get_field(m1, "measurement_site")
    site2 = _get_field(m2, "measurement_site")
    method1 = _get_field(m1, "measurement_method")
    method2 = _get_field(m2, "measurement_method")

    if canon1 == "core_temperature":
        if site1 and site2 and site1.strip().lower() != site2.strip().lower():
            mismatched_dimensions.append("measurement_site")
            return ComparabilityResult(
                are_comparable=False,
                reason=f"Core temperature anatomical site mismatch: '{site1}' vs '{site2}'.",
                mismatched_dimensions=mismatched_dimensions,
            )
        if method1 and method2 and method1.strip().lower() != method2.strip().lower():
            mismatched_dimensions.append("measurement_method")
            return ComparabilityResult(
                are_comparable=False,
                reason=f"Core temperature measurement method mismatch: '{method1}' vs '{method2}'.",
                mismatched_dimensions=mismatched_dimensions,
            )

    return ComparabilityResult(
        are_comparable=True,
        reason="Measurements are comparable under identical canonical type, context, and modality specifications.",
        mismatched_dimensions=[],
    )
