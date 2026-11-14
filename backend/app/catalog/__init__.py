"""COSMOLOOKUP Measurement Catalog and Normalization Package."""

from app.catalog.models import (
    MetricCategory,
    ContextCategory,
    ExerciseModality,
    CatalogEntry,
    ValidationResult,
    ComparabilityResult,
)
from app.catalog.definitions import (
    MEASUREMENT_CATALOG,
    ALIAS_MAP,
    get_canonical_type,
    get_catalog_entry,
    get_query_expansion_types,
)
from app.catalog.context import (
    BASELINE_ELIGIBLE_CONTEXTS,
    OPERATIONAL_TRACKING_CONTEXTS,
    EXCLUDED_CONTEXTS,
    ALL_CONTEXTS,
    ALL_EXERCISE_MODALITIES,
    normalize_context,
    normalize_exercise_modality,
    is_baseline_eligible,
    is_operational_context,
    is_excluded_context,
    is_valid_context,
    is_valid_exercise_modality,
)
from app.catalog.normalizer import (
    normalize_and_validate_measurement,
    are_measurements_comparable,
)

__all__ = [
    # Models
    "MetricCategory",
    "ContextCategory",
    "ExerciseModality",
    "CatalogEntry",
    "ValidationResult",
    "ComparabilityResult",
    # Definitions
    "MEASUREMENT_CATALOG",
    "ALIAS_MAP",
    "get_canonical_type",
    "get_catalog_entry",
    "get_query_expansion_types",
    # Context
    "BASELINE_ELIGIBLE_CONTEXTS",
    "OPERATIONAL_TRACKING_CONTEXTS",
    "EXCLUDED_CONTEXTS",
    "ALL_CONTEXTS",
    "ALL_EXERCISE_MODALITIES",
    "normalize_context",
    "normalize_exercise_modality",
    "is_baseline_eligible",
    "is_operational_context",
    "is_excluded_context",
    "is_valid_context",
    "is_valid_exercise_modality",
    # Normalizer
    "normalize_and_validate_measurement",
    "are_measurements_comparable",
]
