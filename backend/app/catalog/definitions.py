"""Centralized Measurement Catalog definitions for COSMOLOOKUP."""

from typing import Dict, List, Optional
from app.catalog.models import CatalogEntry, MetricCategory

MEASUREMENT_CATALOG: Dict[str, CatalogEntry] = {
    "heart_rate": CatalogEntry(
        canonical_identifier="heart_rate",
        display_name="Heart Rate",
        category=MetricCategory.CARDIOVASCULAR,
        standard_unit="bpm",
        accepted_aliases=["hr"],
        accepted_units=["bpm", "beats/min", "bpm"],
        valid_range_min=30.0,
        valid_range_max=220.0,
        is_derived=False,
        applicable_contexts=["resting_cabin", "sleep_cycle", "exercise_active", "exercise_recovery", "eva_operational"],
        hardware_examples=["BioHarness chest band", "3-lead ECG", "Wearable telemetry band"],
        description="Ventricular contractions per minute.",
        strict_site_matching=False,
    ),
    "spo2": CatalogEntry(
        canonical_identifier="spo2",
        display_name="Oxygen Saturation (SpO2)",
        category=MetricCategory.RESPIRATORY,
        standard_unit="%",
        accepted_aliases=["blood_oxygen"],
        accepted_units=["%", "percent", "pct"],
        valid_range_min=70.0,
        valid_range_max=100.0,
        is_derived=False,
        applicable_contexts=["resting_cabin", "sleep_cycle", "exercise_active", "exercise_recovery", "eva_operational"],
        hardware_examples=["Optical finger/wrist pulse oximeter", "Wearable spectrophotometric sensor"],
        description="Peripheral capillary oxygen saturation via spectrophotometry. Compatible alias with blood_oxygen.",
        strict_site_matching=False,
    ),
    "body_temperature": CatalogEntry(
        canonical_identifier="body_temperature",
        display_name="Body Temperature",
        category=MetricCategory.THERMAL,
        standard_unit="celsius",
        accepted_aliases=[],
        accepted_units=["celsius", "c", "degc", "fahrenheit", "f", "degf"],
        valid_range_min=34.0,
        valid_range_max=42.0,
        is_derived=False,
        applicable_contexts=["resting_cabin", "sleep_cycle", "exercise_active", "exercise_recovery", "eva_operational"],
        hardware_examples=["Infrared skin probe", "Wearable sensor band", "Temporal artery thermometer"],
        description="Generic canonical body/skin temperature. Must NOT share baselines or cross-alias with core_temperature.",
        strict_site_matching=False,
    ),
    "core_temperature": CatalogEntry(
        canonical_identifier="core_temperature",
        display_name="Core Body Temperature",
        category=MetricCategory.THERMAL,
        standard_unit="celsius",
        accepted_aliases=[],
        accepted_units=["celsius", "c", "degc", "fahrenheit", "f", "degf"],
        valid_range_min=35.0,
        valid_range_max=42.0,
        is_derived=False,
        applicable_contexts=["resting_cabin", "sleep_cycle", "exercise_active", "exercise_recovery", "eva_operational"],
        hardware_examples=["Ingestible telemetric core pill (LSDA)", "Deep visceral temperature probe"],
        description="Deep visceral internal temperature. Distinct metric; requires confirmed deep visceral telemetry source.",
        strict_site_matching=True,
    ),
    "blood_pressure_systolic": CatalogEntry(
        canonical_identifier="blood_pressure_systolic",
        display_name="Systolic Blood Pressure",
        category=MetricCategory.CARDIOVASCULAR,
        standard_unit="mmHg",
        accepted_aliases=["bp_systolic"],
        accepted_units=["mmHg", "mm_hg", "mmhg"],
        valid_range_min=70.0,
        valid_range_max=220.0,
        is_derived=False,
        applicable_contexts=["resting_cabin", "sleep_cycle", "exercise_active", "exercise_recovery", "eva_operational"],
        hardware_examples=["Ambulatory arterial cuff", "Automated sphygmomanometer"],
        description="Peak arterial pressure during ventricular systole.",
        strict_site_matching=False,
    ),
    "blood_pressure_diastolic": CatalogEntry(
        canonical_identifier="blood_pressure_diastolic",
        display_name="Diastolic Blood Pressure",
        category=MetricCategory.CARDIOVASCULAR,
        standard_unit="mmHg",
        accepted_aliases=["bp_diastolic"],
        accepted_units=["mmHg", "mm_hg", "mmhg"],
        valid_range_min=40.0,
        valid_range_max=130.0,
        is_derived=False,
        applicable_contexts=["resting_cabin", "sleep_cycle", "exercise_active", "exercise_recovery", "eva_operational"],
        hardware_examples=["Ambulatory arterial cuff", "Automated sphygmomanometer"],
        description="Minimum arterial pressure during ventricular diastole.",
        strict_site_matching=False,
    ),
    "respiratory_rate": CatalogEntry(
        canonical_identifier="respiratory_rate",
        display_name="Respiratory Rate",
        category=MetricCategory.RESPIRATORY,
        standard_unit="breaths/min",
        accepted_aliases=["rr"],
        accepted_units=["breaths/min", "rpm", "brpm"],
        valid_range_min=4.0,
        valid_range_max=45.0,
        is_derived=False,
        applicable_contexts=["resting_cabin", "sleep_cycle", "exercise_active", "exercise_recovery", "eva_operational"],
        hardware_examples=["Inductive plethysmography band", "Acoustic respiratory sensor"],
        description="Breaths / ventilatory cycles completed per minute.",
        strict_site_matching=False,
    ),
    "sleep_duration": CatalogEntry(
        canonical_identifier="sleep_duration",
        display_name="Sleep Duration",
        category=MetricCategory.SLEEP,
        standard_unit="hours",
        accepted_aliases=[],
        accepted_units=["hours", "h", "hrs", "hour"],
        valid_range_min=0.0,
        valid_range_max=16.0,
        is_derived=False,
        applicable_contexts=["sleep_cycle", "resting_cabin"],
        hardware_examples=["Actigraphy sleep-staging monitor", "Quarters polysomnography sensor"],
        description="Cumulative consolidated sleep period.",
        strict_site_matching=False,
    ),
    "radiation_dose": CatalogEntry(
        canonical_identifier="radiation_dose",
        display_name="Radiation Dose",
        category=MetricCategory.ENVIRONMENTAL,
        standard_unit="mSv",
        accepted_aliases=[],
        accepted_units=["mSv", "msv"],
        valid_range_min=0.0,
        valid_range_max=500.0,
        is_derived=False,
        applicable_contexts=["resting_cabin", "sleep_cycle", "exercise_active", "exercise_recovery", "eva_operational"],
        hardware_examples=["Crew Active Personal Dosimeter", "Space radiation detector"],
        description="Ionizing radiation equivalent dose.",
        strict_site_matching=False,
    ),
    "mean_arterial_pressure": CatalogEntry(
        canonical_identifier="mean_arterial_pressure",
        display_name="Mean Arterial Pressure (MAP)",
        category=MetricCategory.CARDIOVASCULAR,
        standard_unit="mmHg",
        accepted_aliases=["map"],
        accepted_units=["mmHg", "mm_hg", "mmhg"],
        valid_range_min=40.0,
        valid_range_max=160.0,
        is_derived=True,
        applicable_contexts=["resting_cabin", "sleep_cycle", "exercise_active", "exercise_recovery", "eva_operational"],
        hardware_examples=["Derived mathematical approximation from SBP/DBP"],
        description="Calculated approximation of continuous arterial pressure: DBP + (1/3)*(SBP - DBP).",
        strict_site_matching=False,
    ),
}

# Explicit Alias Map to Canonical Identifier
# Note: body_temperature and core_temperature have ZERO cross-aliasing!
ALIAS_MAP: Dict[str, str] = {
    "heart_rate": "heart_rate",
    "hr": "heart_rate",
    "spo2": "spo2",
    "blood_oxygen": "spo2",
    "body_temperature": "body_temperature",
    "core_temperature": "core_temperature",
    "blood_pressure_systolic": "blood_pressure_systolic",
    "bp_systolic": "blood_pressure_systolic",
    "blood_pressure_diastolic": "blood_pressure_diastolic",
    "bp_diastolic": "blood_pressure_diastolic",
    "respiratory_rate": "respiratory_rate",
    "rr": "respiratory_rate",
    "sleep_duration": "sleep_duration",
    "radiation_dose": "radiation_dose",
    "mean_arterial_pressure": "mean_arterial_pressure",
    "map": "mean_arterial_pressure",
}


def get_canonical_type(identifier: Optional[str]) -> Optional[str]:
    """Resolve an incoming raw or wire identifier to its canonical metric type.

    Returns None if the identifier is unknown or unmapped.
    """
    if not identifier:
        return None
    clean = identifier.strip().lower()
    return ALIAS_MAP.get(clean)


def get_catalog_entry(identifier: Optional[str]) -> Optional[CatalogEntry]:
    """Retrieve catalog definition by canonical or alias identifier."""
    canonical = get_canonical_type(identifier)
    if not canonical:
        return None
    return MEASUREMENT_CATALOG.get(canonical)


def get_query_expansion_types(query_type: Optional[str]) -> List[str]:
    """Expand a query metric type to include all acceptable stored database aliases.

    Guarantees that:
    - 'blood_oxygen' queries match both 'blood_oxygen' and 'spo2' records.
    - 'spo2' queries match both 'spo2' and 'blood_oxygen' records.
    - 'body_temperature' queries NEVER expand to or match 'core_temperature'.
    - 'core_temperature' queries NEVER expand to or match 'body_temperature'.
    """
    if not query_type:
        return []

    clean = query_type.strip().lower()

    # Temperature strict independence
    if clean == "body_temperature":
        return ["body_temperature"]
    if clean == "core_temperature":
        return ["core_temperature"]

    # SpO2 / blood_oxygen backward compatibility
    if clean in ("spo2", "blood_oxygen"):
        return ["spo2", "blood_oxygen"]

    canonical = ALIAS_MAP.get(clean)
    if not canonical:
        return [query_type.strip()]

    entry = MEASUREMENT_CATALOG.get(canonical)
    if not entry:
        return [canonical]

    expansion = [canonical]
    for alias in entry.accepted_aliases:
        if alias not in expansion:
            expansion.append(alias)
    # Also ensure original query type is in list if not already
    if query_type.strip() not in expansion:
        expansion.append(query_type.strip())

    return expansion
