"""Service functions for astronaut personal baseline calculation and retrieval."""

from datetime import datetime, timezone
import statistics
from typing import Any, Dict, List, Optional, Tuple
import uuid
from sqlalchemy import select
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
)
from app.models.astronaut import Astronaut
from app.models.baseline import AstronautBaseline
from app.models.measurement import Measurement
from app.schemas.baseline import (
    BaselineQualitySummary,
    BaselineResponse,
    PersonalOperationalEnvelope,
)
from app.services.astronaut_service import get_astronaut


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Normalize datetime to timezone-aware UTC datetime."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def calculate_baseline_statistics(values: List[float]) -> Dict[str, float]:
    """Calculate non-parametric primary and parametric secondary reference statistics.

    Returns:
        dict with median, q25, q75, iqr, robust_scale_iqr, mean, std_dev, min_value, max_value.
    """
    if not values:
        raise ValueError("Cannot calculate statistics for empty dataset.")

    n = len(values)
    if n == 1:
        val = float(values[0])
        return {
            "median": round(val, 4),
            "q25": round(val, 4),
            "q75": round(val, 4),
            "iqr": 0.0,
            "robust_scale_iqr": 0.0,
            "mean": round(val, 4),
            "std_dev": 0.0,
            "min_value": round(val, 4),
            "max_value": round(val, 4),
        }

    # Inclusive method matches linear interpolation / percentile conventions
    q25, _, q75 = statistics.quantiles(values, n=4, method="inclusive")
    med = statistics.median(values)
    iqr = round(q75 - q25, 4)

    # Gaussian-equivalent scale estimate: IQR / 1.349 (zero-IQR safe)
    robust_scale = round(iqr / 1.349, 4) if iqr > 0.0 else 0.0

    mean_val = round(statistics.mean(values), 4)
    std_val = round(statistics.stdev(values), 4)
    min_val = round(min(values), 4)
    max_val = round(max(values), 4)

    return {
        "median": round(med, 4),
        "q25": round(q25, 4),
        "q75": round(q75, 4),
        "iqr": iqr,
        "robust_scale_iqr": robust_scale,
        "mean": mean_val,
        "std_dev": std_val,
        "min_value": min_val,
        "max_value": max_val,
    }


def calculate_and_persist_baseline(
    db: Session,
    astronaut_id: str,
    measurement_type: str,
    context: str = "resting_cabin",
    exercise_modality: Optional[str] = None,
    measurement_site: Optional[str] = None,
    measurement_method: Optional[str] = None,
    include_degraded: bool = False,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
) -> AstronautBaseline:
    """Calculate and persist an astronaut's personal baseline envelope using comparable telemetry.

    Applies:
    1. Astronaut validation.
    2. Canonical metric resolution via Phase 2A catalog.
    3. Physiological baseline eligibility check (Tier A contexts only).
    4. Query expansion (spo2 <-> blood_oxygen, isolated temperatures).
    5. Exercise modality and anatomical site isolation.
    6. Measurement validation and physical boundary filtering.
    7. Transparent data-quality accounting.
    8. Idempotent upsert into astronaut_baseline.
    """
    # 1. Astronaut validation
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    # 2. Canonical metric resolution
    canonical_type = get_canonical_type(measurement_type)
    if not canonical_type or canonical_type not in MEASUREMENT_CATALOG:
        raise InvalidQueryParameterException(
            parameter="measurement_type",
            message=f"Unrecognized measurement type: '{measurement_type}'.",
            value=measurement_type,
        )
    catalog_entry = MEASUREMENT_CATALOG[canonical_type]

    # 3. Context validation & baseline eligibility
    norm_context = normalize_context(context)
    if not is_baseline_eligible(norm_context):
        if norm_context == "eva_operational":
            raise IneligibleBaselineContextException(
                context=norm_context,
                message=(
                    "Operational EVA context vitals must not be pooled into habitat physiological baselines. "
                    "EVA measurements represent operational suit workloads, not resting or countermeasure baselines."
                ),
            )
        raise IneligibleBaselineContextException(context=norm_context)

    # 4. Exercise modality resolution
    norm_modality: Optional[str] = None
    if norm_context in ("exercise_active", "exercise_recovery") and exercise_modality:
        norm_modality = normalize_exercise_modality(exercise_modality)

    norm_site = measurement_site.strip() if measurement_site else None
    norm_method = measurement_method.strip() if measurement_method else None

    # 5. Query candidate measurements
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

    # 6. Data quality segregation and measurement validation
    nominal_count = 0
    degraded_count = 0
    valid_records: List[Measurement] = []
    normalized_values: List[float] = []

    for m in candidate_records:
        if m.data_quality == "nominal":
            nominal_count += 1
        else:
            degraded_count += 1

        # Run validation against physical limits & site consistency
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
            # Exclude invalid telemetry (e.g. impossible heart rate or superficial core site)
            continue

        if not include_degraded and m.data_quality != "nominal":
            # Transparently exclude degraded/noisy data from nominal baseline calculation
            continue

        valid_records.append(m)
        normalized_values.append(v_res.normalized_value)

    # 7. Check for empty valid dataset
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

    # 8. Calculate statistics
    stats = calculate_baseline_statistics(normalized_values)

    timestamps = [_ensure_utc(m.measured_at) for m in valid_records if m.measured_at is not None]
    window_start = min(timestamps) if timestamps else None
    window_end = max(timestamps) if timestamps else None
    is_synthetic = any(m.is_synthetic for m in valid_records)

    # 9. Upsert baseline record
    existing_query = (
        select(AstronautBaseline)
        .where(AstronautBaseline.astronaut_id == astronaut_id)
        .where(AstronautBaseline.measurement_type == canonical_type)
        .where(AstronautBaseline.context == norm_context)
    )
    if norm_modality:
        existing_query = existing_query.where(AstronautBaseline.exercise_modality == norm_modality)
    else:
        existing_query = existing_query.where(AstronautBaseline.exercise_modality.is_(None))

    if norm_site:
        existing_query = existing_query.where(AstronautBaseline.measurement_site == norm_site)
    else:
        existing_query = existing_query.where(AstronautBaseline.measurement_site.is_(None))

    if norm_method:
        existing_query = existing_query.where(AstronautBaseline.measurement_method == norm_method)
    else:
        existing_query = existing_query.where(AstronautBaseline.measurement_method.is_(None))

    baseline = db.execute(existing_query).scalars().first()

    now_utc = datetime.now(timezone.utc)
    if baseline:
        # Update existing record
        baseline.unit = catalog_entry.standard_unit
        baseline.median = stats["median"]
        baseline.q25 = stats["q25"]
        baseline.q75 = stats["q75"]
        baseline.iqr = stats["iqr"]
        baseline.mean = stats["mean"]
        baseline.std_dev = stats["std_dev"]
        baseline.robust_scale_iqr = stats["robust_scale_iqr"]
        baseline.min_value = stats["min_value"]
        baseline.max_value = stats["max_value"]
        baseline.sample_count = len(normalized_values)
        baseline.nominal_count = nominal_count
        baseline.degraded_count = degraded_count
        baseline.window_start = window_start
        baseline.window_end = window_end
        baseline.is_synthetic = is_synthetic
        baseline.calculated_at = now_utc
    else:
        baseline_id = f"base-{uuid.uuid4().hex[:12]}"
        baseline = AstronautBaseline(
            id=baseline_id,
            astronaut_id=astronaut_id,
            measurement_type=canonical_type,
            context=norm_context,
            exercise_modality=norm_modality,
            measurement_site=norm_site,
            measurement_method=norm_method,
            sensor_model=catalog_entry.hardware_examples[0] if catalog_entry.hardware_examples else None,
            unit=catalog_entry.standard_unit,
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
            algorithm_version="v2b-iqr",
            is_synthetic=is_synthetic,
            calculated_at=now_utc,
        )
        db.add(baseline)

    db.commit()
    db.refresh(baseline)
    return baseline


def get_baseline_for_astronaut(
    db: Session,
    astronaut_id: str,
    measurement_type: str,
    context: Optional[str] = None,
    exercise_modality: Optional[str] = None,
) -> Optional[AstronautBaseline]:
    """Retrieve an astronaut's baseline for a specific measurement type and context."""
    canonical_type = get_canonical_type(measurement_type)
    if not canonical_type:
        return None

    query = (
        select(AstronautBaseline)
        .where(AstronautBaseline.astronaut_id == astronaut_id)
        .where(AstronautBaseline.measurement_type == canonical_type)
    )

    if context:
        norm_context = normalize_context(context)
        query = query.where(AstronautBaseline.context == norm_context)

    if exercise_modality:
        norm_mod = normalize_exercise_modality(exercise_modality)
        query = query.where(AstronautBaseline.exercise_modality == norm_mod)

    return db.execute(query.order_by(AstronautBaseline.calculated_at.desc())).scalars().first()


def list_baselines_for_astronaut(
    db: Session,
    astronaut_id: str,
    context: Optional[str] = None,
) -> List[AstronautBaseline]:
    """Retrieve all calculated baselines for an astronaut, with optional context filter."""
    query = select(AstronautBaseline).where(AstronautBaseline.astronaut_id == astronaut_id)

    if context:
        norm_context = normalize_context(context)
        query = query.where(AstronautBaseline.context == norm_context)

    query = query.order_by(AstronautBaseline.measurement_type.asc(), AstronautBaseline.context.asc())
    return list(db.execute(query).scalars().all())


def _format_iso(dt: Optional[datetime]) -> Optional[str]:
    """Serialize datetime to UTC ISO string with 'Z' suffix."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


def format_baseline_response(baseline: AstronautBaseline) -> BaselineResponse:
    """Format an AstronautBaseline ORM model into a BaselineResponse matching API contracts."""
    envelope = PersonalOperationalEnvelope(
        median=baseline.median,
        q25=baseline.q25,
        q75=baseline.q75,
        iqr=baseline.iqr,
        robust_scale_iqr=baseline.robust_scale_iqr,
        mean=baseline.mean,
        std_dev=baseline.std_dev,
        min_value=baseline.min_value,
        max_value=baseline.max_value,
        sample_count=baseline.sample_count,
        window_start=_format_iso(baseline.window_start),
        window_end=_format_iso(baseline.window_end),
    )

    quality_summary = BaselineQualitySummary(
        nominal=baseline.nominal_count,
        degraded=baseline.degraded_count,
        total_evaluated=baseline.nominal_count + baseline.degraded_count,
    )

    return BaselineResponse(
        id=baseline.id,
        astronaut_id=baseline.astronaut_id,
        measurement_type=baseline.measurement_type,
        context=baseline.context,
        exercise_modality=baseline.exercise_modality,
        measurement_site=baseline.measurement_site,
        measurement_method=baseline.measurement_method,
        sensor_model=baseline.sensor_model,
        unit=baseline.unit,
        envelope=envelope,
        quality_summary=quality_summary,
        algorithm_version=baseline.algorithm_version,
        is_synthetic=baseline.is_synthetic,
        calculated_at=_format_iso(baseline.calculated_at) or "",
    )
