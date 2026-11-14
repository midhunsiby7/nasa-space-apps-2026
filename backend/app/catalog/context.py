"""Context taxonomy and exercise modality definitions for COSMOLOOKUP."""

from typing import Optional, Set
from app.catalog.models import ContextCategory, ExerciseModality

# Tier A: Physiological Baseline-Eligible Contexts
BASELINE_ELIGIBLE_CONTEXTS: Set[str] = {
    ContextCategory.RESTING_CABIN.value,
    ContextCategory.SLEEP_CYCLE.value,
    ContextCategory.EXERCISE_ACTIVE.value,
    ContextCategory.EXERCISE_RECOVERY.value,
}

# Tier B: Operational Tracking Contexts (Monitored in real time; NEVER pooled into habitat baselines)
OPERATIONAL_TRACKING_CONTEXTS: Set[str] = {
    ContextCategory.EVA_OPERATIONAL.value,
}

# Tier C: Excluded Ingestion Catch-Alls (Stored for raw fidelity; excluded from all baselines)
EXCLUDED_CONTEXTS: Set[str] = {
    ContextCategory.UNKNOWN.value,
    ContextCategory.OTHER.value,
}

ALL_CONTEXTS: Set[str] = BASELINE_ELIGIBLE_CONTEXTS | OPERATIONAL_TRACKING_CONTEXTS | EXCLUDED_CONTEXTS

ALL_EXERCISE_MODALITIES: Set[str] = {
    ExerciseModality.ARED_RESISTIVE.value,
    ExerciseModality.CEVIS_AEROBIC.value,
    ExerciseModality.T2_TREADMILL.value,
    ExerciseModality.OTHER.value,
    ExerciseModality.UNKNOWN.value,
}


def normalize_context(context: Optional[str]) -> str:
    """Normalize raw context string to approved taxonomy identifier or 'unknown'."""
    if not context:
        return ContextCategory.UNKNOWN.value
    clean = context.strip().lower()
    if clean in ALL_CONTEXTS:
        return clean
    return ContextCategory.UNKNOWN.value


def normalize_exercise_modality(modality: Optional[str]) -> str:
    """Normalize exercise modality string to approved taxonomy or 'unknown'."""
    if not modality:
        return ExerciseModality.UNKNOWN.value
    clean = modality.strip().lower()
    if clean in ALL_EXERCISE_MODALITIES:
        return clean
    return ExerciseModality.UNKNOWN.value


def is_baseline_eligible(context: Optional[str]) -> bool:
    """Determine whether context is eligible for physiological baseline generation.

    Only Tier A contexts (resting_cabin, sleep_cycle, exercise_active, exercise_recovery)
    are baseline-eligible. Operational tracking (eva_operational) and excluded catch-alls
    (unknown, other) return False.
    """
    normalized = normalize_context(context)
    return normalized in BASELINE_ELIGIBLE_CONTEXTS


def is_operational_context(context: Optional[str]) -> bool:
    """Determine whether context represents operational tracking (e.g. eva_operational)."""
    normalized = normalize_context(context)
    return normalized in OPERATIONAL_TRACKING_CONTEXTS


def is_excluded_context(context: Optional[str]) -> bool:
    """Determine whether context is an ingestion catch-all excluded from baselines."""
    normalized = normalize_context(context)
    return normalized in EXCLUDED_CONTEXTS


def is_valid_context(context: Optional[str]) -> bool:
    """Check if the provided context matches any recognized taxonomy category."""
    if not context:
        return False
    return context.strip().lower() in ALL_CONTEXTS


def is_valid_exercise_modality(modality: Optional[str]) -> bool:
    """Check if the provided modality matches any recognized countermeasure equipment."""
    if not modality:
        return False
    return modality.strip().lower() in ALL_EXERCISE_MODALITIES
