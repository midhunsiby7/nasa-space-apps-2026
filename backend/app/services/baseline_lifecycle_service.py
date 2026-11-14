"""Service functions for baseline lifecycle management, maturity evaluation, and versioning."""

from datetime import datetime, timezone
import json
from typing import Dict, List, Optional, Tuple
import uuid
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.catalog import (
    MEASUREMENT_CATALOG,
    get_canonical_type,
    get_query_expansion_types,
    is_baseline_eligible,
    normalize_context,
    normalize_exercise_modality,
    normalize_and_validate_measurement,
)
from app.core.exceptions import (
    AstronautNotFoundException,
    BaselineNotFoundException,
    IneligibleBaselineContextException,
    InsufficientMeasurementsException,
    InvalidQueryParameterException,
    PreflightBaselineFinalizedException,
)
from app.models.astronaut import Astronaut
from app.models.baseline import AstronautBaseline
from app.models.measurement import Measurement
from app.services.astronaut_service import get_astronaut
from app.services.baseline_service import calculate_baseline_statistics, _ensure_utc


# Configurable Baseline Maturity Criteria (Engineering Assumptions, not NASA clinical rules)
MATURITY_CRITERIA: Dict[str, Dict[str, float]] = {
    "provisional": {"min_samples": 10, "min_days": 3.0},
    "established": {"min_samples": 30, "min_days": 7.0, "min_nominal_pct": 90.0},
}


def evaluate_baseline_maturity(
    sample_count: int,
    window_start: Optional[datetime],
    window_end: Optional[datetime],
    nominal_count: int,
    degraded_count: int,
) -> Tuple[str, Dict[str, object]]:
    """Evaluate baseline maturity against configurable sample size, duration, and quality rules.

    Maturity Classifications:
    - 'insufficient': N < 10 OR observation period < 3 days.
    - 'provisional': N >= 10 AND observation period >= 3 days.
    - 'established': N >= 30 AND observation period >= 7 days AND nominal-quality percentage >= 90%.

    Returns:
        (maturity_status, criteria_snapshot_dict)
    """
    total_eval = nominal_count + degraded_count
    nom_pct = (nominal_count / total_eval * 100.0) if total_eval > 0 else 0.0

    observation_days = 0.0
    if window_start and window_end:
        start_utc = _ensure_utc(window_start)
        end_utc = _ensure_utc(window_end)
        if start_utc and end_utc:
            observation_days = max((end_utc - start_utc).total_seconds() / 86400.0, 0.0)

    est_cfg = MATURITY_CRITERIA["established"]
    prov_cfg = MATURITY_CRITERIA["provisional"]

    if (
        sample_count >= est_cfg["min_samples"]
        and observation_days >= est_cfg["min_days"]
        and nom_pct >= est_cfg["min_nominal_pct"]
    ):
        maturity = "established"
    elif sample_count >= prov_cfg["min_samples"] and observation_days >= prov_cfg["min_days"]:
        maturity = "provisional"
    else:
        maturity = "insufficient"

    snapshot = {
        "maturity": maturity,
        "sample_count": sample_count,
        "observation_days": round(observation_days, 2),
        "nominal_percentage": round(nom_pct, 1),
        "nominal_count": nominal_count,
        "degraded_count": degraded_count,
        "criteria": (
            "Established (N>=30, days>=7, nom%>=90)"
            if maturity == "established"
            else ("Provisional (N>=10, days>=3)" if maturity == "provisional" else "Insufficient (N<10 or days<3)")
        ),
    }

    return maturity, snapshot


def create_or_recalculate_lifecycle_baseline(
    db: Session,
    astronaut_id: str,
    measurement_type: str,
    baseline_type: str = "inflight",
    context: str = "resting_cabin",
    exercise_modality: Optional[str] = None,
    measurement_site: Optional[str] = None,
    measurement_method: Optional[str] = None,
    include_degraded: bool = False,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
) -> AstronautBaseline:
    """Calculate and persist a baseline with maturity evaluation and version history.

    Features:
    1. Preflight Immutability: If a finalized preflight baseline exists, raises PreflightBaselineFinalizedException.
    2. In-flight Versioning: When recalculating an in-flight baseline, increments version and supersedes previous active baseline.
    3. Maturity Evaluation: Derives maturity (insufficient, provisional, established) and records criteria snapshot.
    """
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    canonical_type = get_canonical_type(measurement_type)
    if not canonical_type or canonical_type not in MEASUREMENT_CATALOG:
        raise InvalidQueryParameterException(
            parameter="measurement_type",
            message=f"Unrecognized measurement type: '{measurement_type}'.",
            value=measurement_type,
        )
    catalog_entry = MEASUREMENT_CATALOG[canonical_type]

    norm_context = normalize_context(context)
    if not is_baseline_eligible(norm_context):
        if norm_context == "eva_operational":
            raise IneligibleBaselineContextException(
                context=norm_context,
                message="Operational EVA context vitals must not be pooled into habitat physiological baselines.",
            )
        raise IneligibleBaselineContextException(context=norm_context)

    norm_modality: Optional[str] = None
    if norm_context in ("exercise_active", "exercise_recovery") and exercise_modality:
        norm_modality = normalize_exercise_modality(exercise_modality)

    norm_site = measurement_site.strip() if measurement_site else None
    norm_method = measurement_method.strip() if measurement_method else None

    # Check for existing active baseline for this astronaut, type, context, and modality
    active_query = (
        select(AstronautBaseline)
        .where(AstronautBaseline.astronaut_id == astronaut_id)
        .where(AstronautBaseline.baseline_type == baseline_type)
        .where(AstronautBaseline.measurement_type == canonical_type)
        .where(AstronautBaseline.context == norm_context)
        .where(AstronautBaseline.is_active == True)  # noqa: E712
    )
    if norm_modality:
        active_query = active_query.where(AstronautBaseline.exercise_modality == norm_modality)
    else:
        active_query = active_query.where(AstronautBaseline.exercise_modality.is_(None))

    if norm_site:
        active_query = active_query.where(AstronautBaseline.measurement_site == norm_site)
    else:
        active_query = active_query.where(AstronautBaseline.measurement_site.is_(None))

    if norm_method:
        active_query = active_query.where(AstronautBaseline.measurement_method == norm_method)
    else:
        active_query = active_query.where(AstronautBaseline.measurement_method.is_(None))

    existing_active = db.execute(active_query).scalars().first()

    # Preflight immutability rule: Finalized preflight baseline cannot be modified or recalculated
    if baseline_type == "preflight" and existing_active and existing_active.is_finalized:
        raise PreflightBaselineFinalizedException(
            baseline_id=existing_active.id,
            message=(
                f"Preflight baseline '{existing_active.id}' for metric '{canonical_type}' has been finalized and is immutable. "
                f"Modifications to finalized preflight baselines are prohibited."
            ),
        )

    # Query candidate measurements
    expansion_types = get_query_expansion_types(canonical_type)
    query = (
        select(Measurement)
        .where(Measurement.astronaut_id == astronaut_id)
        .where(Measurement.measurement_type.in_(expansion_types))
        .where(Measurement.context == norm_context)
    )

    if norm_modality:
        query = query.where(Measurement.exercise_modality == norm_modality)
    if norm_site:
        query = query.where(Measurement.measurement_site == norm_site)
    if norm_method:
        query = query.where(Measurement.measurement_method == norm_method)
    if start_time:
        query = query.where(Measurement.measured_at >= start_time)
    if end_time:
        query = query.where(Measurement.measured_at <= end_time)

    candidate_records = list(db.execute(query).scalars().all())

    nominal_count = 0
    degraded_count = 0
    valid_records: List[Measurement] = []
    normalized_values: List[float] = []

    for m in candidate_records:
        if m.data_quality == "nominal":
            nominal_count += 1
        else:
            degraded_count += 1

        v_res = normalize_and_validate_measurement(
            measurement_type=m.measurement_type,
            value=m.value,
            unit=m.unit,
            context=m.context,
            exercise_modality=m.exercise_modality,
            measurement_site=m.measurement_site,
            measurement_method=m.measurement_method,
        )

        if not v_res.is_valid:
            continue

        if not include_degraded and m.data_quality != "nominal":
            continue

        valid_records.append(m)
        normalized_values.append(v_res.normalized_value)

    if not normalized_values:
        raise InsufficientMeasurementsException(
            astronaut_id=astronaut_id,
            measurement_type=canonical_type,
            context=norm_context,
            details={
                "evaluated_total": len(candidate_records),
                "nominal_count": nominal_count,
                "degraded_count": degraded_count,
                "include_degraded": include_degraded,
            },
        )

    stats = calculate_baseline_statistics(normalized_values)

    timestamps = [_ensure_utc(m.measured_at) for m in valid_records if m.measured_at is not None]
    window_start = min(timestamps) if timestamps else None
    window_end = max(timestamps) if timestamps else None
    is_synthetic = any(m.is_synthetic for m in valid_records)

    # Evaluate maturity
    maturity, snapshot = evaluate_baseline_maturity(
        sample_count=len(normalized_values),
        window_start=window_start,
        window_end=window_end,
        nominal_count=nominal_count,
        degraded_count=degraded_count,
    )

    now_utc = datetime.now(timezone.utc)

    if baseline_type == "preflight":
        # Preflight baseline: update unfinalized or create version 1
        if existing_active:
            existing_active.median = stats["median"]
            existing_active.q25 = stats["q25"]
            existing_active.q75 = stats["q75"]
            existing_active.iqr = stats["iqr"]
            existing_active.mean = stats["mean"]
            existing_active.std_dev = stats["std_dev"]
            existing_active.robust_scale_iqr = stats["robust_scale_iqr"]
            existing_active.min_value = stats["min_value"]
            existing_active.max_value = stats["max_value"]
            existing_active.sample_count = len(normalized_values)
            existing_active.nominal_count = nominal_count
            existing_active.degraded_count = degraded_count
            existing_active.window_start = window_start
            existing_active.window_end = window_end
            existing_active.maturity = maturity
            existing_active.maturity_evaluated_at = now_utc
            existing_active.maturity_criteria_snapshot = json.dumps(snapshot)
            existing_active.calculated_at = now_utc
            target_baseline = existing_active
        else:
            target_baseline = AstronautBaseline(
                id=f"base-{uuid.uuid4().hex[:12]}",
                astronaut_id=astronaut_id,
                measurement_type=canonical_type,
                context=norm_context,
                exercise_modality=norm_modality,
                measurement_site=norm_site,
                measurement_method=norm_method,
                sensor_model=catalog_entry.hardware_examples[0] if catalog_entry.hardware_examples else None,
                unit=catalog_entry.standard_unit,
                baseline_type="preflight",
                maturity=maturity,
                version=1,
                is_active=True,
                is_finalized=False,
                supersedes_baseline_id=None,
                maturity_evaluated_at=now_utc,
                maturity_criteria_snapshot=json.dumps(snapshot),
                median=stats["median"],
                q25=stats["q25"],
                q75=stats["q75"],
                iqr=stats["iqr"],
                mean=stats["mean"],
                std_dev=stats["std_dev"],
                robust_scale_iqr=stats["robust_scale_iqr"],
                min_value=stats["min_value"],
                max_value=stats["max_value"],
                sample_count=len(normalized_values),
                nominal_count=nominal_count,
                degraded_count=degraded_count,
                window_start=window_start,
                window_end=window_end,
                algorithm_version="v2c-lifecycle",
                is_synthetic=is_synthetic,
                calculated_at=now_utc,
            )
            db.add(target_baseline)
    else:
        # In-flight baseline: version increment & supersession
        next_version = 1
        prior_id = None
        if existing_active:
            next_version = existing_active.version + 1
            prior_id = existing_active.id
            existing_active.is_active = False

        target_baseline = AstronautBaseline(
            id=f"base-{uuid.uuid4().hex[:12]}",
            astronaut_id=astronaut_id,
            measurement_type=canonical_type,
            context=norm_context,
            exercise_modality=norm_modality,
            measurement_site=norm_site,
            measurement_method=norm_method,
            sensor_model=catalog_entry.hardware_examples[0] if catalog_entry.hardware_examples else None,
            unit=catalog_entry.standard_unit,
            baseline_type="inflight",
            maturity=maturity,
            version=next_version,
            is_active=True,
            is_finalized=False,
            supersedes_baseline_id=prior_id,
            maturity_evaluated_at=now_utc,
            maturity_criteria_snapshot=json.dumps(snapshot),
            median=stats["median"],
            q25=stats["q25"],
            q75=stats["q75"],
            iqr=stats["iqr"],
            mean=stats["mean"],
            std_dev=stats["std_dev"],
            robust_scale_iqr=stats["robust_scale_iqr"],
            min_value=stats["min_value"],
            max_value=stats["max_value"],
            sample_count=len(normalized_values),
            nominal_count=nominal_count,
            degraded_count=degraded_count,
            window_start=window_start,
            window_end=window_end,
            algorithm_version="v2c-lifecycle",
            is_synthetic=is_synthetic,
            calculated_at=now_utc,
        )
        db.add(target_baseline)

    db.commit()
    db.refresh(target_baseline)
    return target_baseline


def finalize_preflight_baseline(db: Session, baseline_id: str) -> AstronautBaseline:
    """Finalize a preflight baseline, locking it against future mutations."""
    baseline = db.get(AstronautBaseline, baseline_id)
    if not baseline:
        raise BaselineNotFoundException(astronaut_id="unknown", measurement_type=baseline_id)

    if baseline.baseline_type != "preflight":
        raise InvalidQueryParameterException(
            parameter="baseline_id",
            message=f"Only preflight baselines can be finalized. Baseline '{baseline_id}' is of type '{baseline.baseline_type}'.",
            value=baseline_id,
        )

    baseline.is_finalized = True
    baseline.is_active = True
    db.commit()
    db.refresh(baseline)
    return baseline


def get_active_baseline(
    db: Session,
    astronaut_id: str,
    measurement_type: str,
    baseline_type: str = "inflight",
    context: str = "resting_cabin",
    exercise_modality: Optional[str] = None,
) -> Optional[AstronautBaseline]:
    """Retrieve the currently active baseline reference."""
    canonical_type = get_canonical_type(measurement_type)
    if not canonical_type:
        return None

    norm_context = normalize_context(context)
    query = (
        select(AstronautBaseline)
        .where(AstronautBaseline.astronaut_id == astronaut_id)
        .where(AstronautBaseline.baseline_type == baseline_type)
        .where(AstronautBaseline.measurement_type == canonical_type)
        .where(AstronautBaseline.context == norm_context)
        .where(AstronautBaseline.is_active == True)  # noqa: E712
    )

    if norm_context in ("exercise_active", "exercise_recovery") and exercise_modality:
        norm_mod = normalize_exercise_modality(exercise_modality)
        query = query.where(AstronautBaseline.exercise_modality == norm_mod)

    return db.execute(query.order_by(AstronautBaseline.version.desc())).scalars().first()


def get_baseline_history(
    db: Session,
    astronaut_id: str,
    measurement_type: str,
    baseline_type: Optional[str] = None,
    context: Optional[str] = None,
) -> List[AstronautBaseline]:
    """Retrieve historical baseline versions for auditability and evolution tracking."""
    canonical_type = get_canonical_type(measurement_type)
    if not canonical_type:
        return []

    query = (
        select(AstronautBaseline)
        .where(AstronautBaseline.astronaut_id == astronaut_id)
        .where(AstronautBaseline.measurement_type == canonical_type)
    )

    if baseline_type:
        query = query.where(AstronautBaseline.baseline_type == baseline_type)
    if context:
        norm_context = normalize_context(context)
        query = query.where(AstronautBaseline.context == norm_context)

    query = query.order_by(AstronautBaseline.version.desc(), AstronautBaseline.calculated_at.desc())
    return list(db.execute(query).scalars().all())
