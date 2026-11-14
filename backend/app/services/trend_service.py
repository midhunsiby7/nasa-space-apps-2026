"""Trend Intelligence service providing personal trend analysis, Sen's slope estimation, and telemetry freshness."""

from datetime import datetime, timezone, timedelta
import statistics
from typing import Dict, List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.catalog import (
    MEASUREMENT_CATALOG,
    get_canonical_type,
    get_query_expansion_types,
    normalize_context,
    normalize_exercise_modality,
    normalize_and_validate_measurement,
)
from app.core.exceptions import (
    AstronautNotFoundException,
    InvalidQueryParameterException,
)
from app.models.astronaut import Astronaut
from app.models.baseline import AstronautBaseline
from app.models.measurement import Measurement
from app.schemas.trend import (
    MetricFreshnessItem,
    TelemetryFreshnessResponse,
    TrendObservation,
)
from app.services.astronaut_service import get_astronaut
from app.services.baseline_lifecycle_service import get_active_baseline
from app.services.baseline_service import _ensure_utc, _format_iso


# Configurable Telemetry Freshness Expected Intervals (Hours)
FRESHNESS_CONFIG_HOURS: Dict[str, float] = {
    "heart_rate": 6.0,
    "spo2": 6.0,
    "body_temperature": 6.0,
    "core_temperature": 6.0,
    "blood_pressure_systolic": 12.0,
    "blood_pressure_diastolic": 12.0,
    "respiratory_rate": 6.0,
    "sleep_duration": 24.0,
    "radiation_dose": 12.0,
    "default": 12.0,
}


def calculate_sens_slope(timestamps: List[datetime], values: List[float]) -> Optional[float]:
    """Calculate the non-parametric Sen's slope estimator (rate of change per 24 hours).

    Calculates the median of all pairwise slopes:
        S_ij = (y_j - y_i) / (t_j - t_i in days)  for all i < j
    """
    n = len(values)
    if n < 2:
        return None

    slopes: List[float] = []
    for i in range(n - 1):
        for j in range(i + 1, n):
            dt_seconds = (timestamps[j] - timestamps[i]).total_seconds()
            if dt_seconds > 0:
                dt_days = dt_seconds / 86400.0
                slope = (values[j] - values[i]) / dt_days
                slopes.append(slope)

    if not slopes:
        return 0.0

    return round(float(statistics.median(slopes)), 4)


def evaluate_telemetry_freshness(
    last_measured_at: Optional[datetime],
    measurement_type: str,
    now: Optional[datetime] = None,
) -> MetricFreshnessItem:
    """Evaluate telemetry currency against metric-specific collection intervals."""
    canonical_type = get_canonical_type(measurement_type) or measurement_type
    expected_hours = FRESHNESS_CONFIG_HOURS.get(canonical_type, FRESHNESS_CONFIG_HOURS["default"])

    now_utc = _ensure_utc(now) or datetime.now(timezone.utc)

    if not last_measured_at:
        return MetricFreshnessItem(
            measurement_type=canonical_type,
            last_measured_at=None,
            hours_since_last=None,
            expected_interval_hours=expected_hours,
            status="unknown",
            message=f"No telemetry observations recorded for '{canonical_type}'.",
        )

    last_utc = _ensure_utc(last_measured_at)
    if not last_utc:
        return MetricFreshnessItem(
            measurement_type=canonical_type,
            last_measured_at=None,
            hours_since_last=None,
            expected_interval_hours=expected_hours,
            status="unknown",
            message=f"Unable to parse timestamp for '{canonical_type}'.",
        )

    elapsed_hours = max((now_utc - last_utc).total_seconds() / 3600.0, 0.0)

    if elapsed_hours <= expected_hours:
        status = "fresh"
        msg = f"Telemetry is current (updated {round(elapsed_hours, 1)}h ago; expected <= {expected_hours}h)."
    else:
        status = "stale"
        msg = (
            f"Telemetry is stale ({round(elapsed_hours, 1)}h elapsed since last reading; "
            f"expected <= {expected_hours}h). Does not imply a clinical emergency."
        )

    return MetricFreshnessItem(
        measurement_type=canonical_type,
        last_measured_at=_format_iso(last_utc),
        hours_since_last=round(elapsed_hours, 2),
        expected_interval_hours=expected_hours,
        status=status,
        message=msg,
    )


def analyze_metric_trend(
    db: Session,
    astronaut_id: str,
    measurement_type: str,
    context: str = "resting_cabin",
    exercise_modality: Optional[str] = None,
    lookback_hours: int = 72,
) -> TrendObservation:
    """Analyze intra-individual trajectory, rate-of-change, and deviation against active personal baseline."""
    canonical_type = get_canonical_type(measurement_type)
    if not canonical_type or canonical_type not in MEASUREMENT_CATALOG:
        raise InvalidQueryParameterException(
            parameter="measurement_type",
            message=f"Unrecognized measurement type: '{measurement_type}'.",
            value=measurement_type,
        )
    catalog_entry = MEASUREMENT_CATALOG[canonical_type]
    norm_context = normalize_context(context)
    norm_modality = normalize_exercise_modality(exercise_modality) if exercise_modality else None

    # Retrieve active in-flight baseline first, fallback to active preflight if in-flight not established
    active_baseline = get_active_baseline(
        db=db,
        astronaut_id=astronaut_id,
        measurement_type=canonical_type,
        baseline_type="inflight",
        context=norm_context,
        exercise_modality=norm_modality,
    )
    if not active_baseline:
        active_baseline = get_active_baseline(
            db=db,
            astronaut_id=astronaut_id,
            measurement_type=canonical_type,
            baseline_type="preflight",
            context=norm_context,
            exercise_modality=norm_modality,
        )

    # Query recent measurements in lookback window
    now_utc = datetime.now(timezone.utc)
    lookback_start = now_utc - timedelta(hours=lookback_hours)

    expansion_types = get_query_expansion_types(canonical_type)
    query = (
        select(Measurement)
        .where(Measurement.astronaut_id == astronaut_id)
        .where(Measurement.measurement_type.in_(expansion_types))
        .where(Measurement.context == norm_context)
        .where(Measurement.measured_at >= lookback_start)
    )
    if norm_modality:
        query = query.where(Measurement.exercise_modality == norm_modality)

    # Chronological ordering (oldest to newest for Sen's slope and run analysis)
    recent_records = list(
        db.execute(query.order_by(Measurement.measured_at.asc(), Measurement.id.asc())).scalars().all()
    )

    # Also query the very latest measurement regardless of lookback for freshness evaluation
    latest_query = (
        select(Measurement)
        .where(Measurement.astronaut_id == astronaut_id)
        .where(Measurement.measurement_type.in_(expansion_types))
        .order_by(Measurement.measured_at.desc())
    )
    latest_record = db.execute(latest_query).scalars().first()

    # Telemetry freshness evaluation
    freshness_item = evaluate_telemetry_freshness(
        last_measured_at=latest_record.measured_at if latest_record else None,
        measurement_type=canonical_type,
        now=now_utc,
    )

    # Filter and validate lookback telemetry
    valid_ts: List[datetime] = []
    valid_vals: List[float] = []
    has_degraded = False

    for m in recent_records:
        if m.data_quality != "nominal":
            has_degraded = True
        v_res = normalize_and_validate_measurement(
            measurement_type=m.measurement_type,
            value=m.value,
            unit=m.unit,
            context=m.context,
            exercise_modality=m.exercise_modality,
        )
        if v_res.is_valid:
            valid_ts.append(_ensure_utc(m.measured_at) or now_utc)
            valid_vals.append(v_res.normalized_value)

    sample_count = len(valid_vals)
    current_val: Optional[float] = valid_vals[-1] if valid_vals else (latest_record.value if latest_record else None)
    current_time: Optional[str] = _format_iso(valid_ts[-1]) if valid_ts else (_format_iso(latest_record.measured_at) if latest_record else None)

    # Baseline statistics
    b_median: Optional[float] = None
    b_iqr: Optional[float] = None
    b_scale: Optional[float] = None
    robust_z: Optional[float] = None

    if active_baseline:
        b_median = active_baseline.median
        b_iqr = active_baseline.iqr
        b_scale = active_baseline.robust_scale_iqr

        # Robust Z-score: (current - median) / scale
        if current_val is not None and b_median is not None:
            if b_scale and b_scale > 0.0:
                robust_z = round((current_val - b_median) / b_scale, 2)
            elif current_val == b_median:
                robust_z = 0.0

    # Sen's slope calculation
    sens_slope = calculate_sens_slope(valid_ts, valid_vals)

    # Consecutive run rule check (looking at last 4 readings)
    consecutive_deviations = 0
    is_sustained = False

    if active_baseline and b_scale and b_scale > 0.0 and sample_count >= 1:
        # Check from most recent backwards
        for val in reversed(valid_vals):
            z = abs((val - b_median) / b_scale)
            if z > 1.5:
                consecutive_deviations += 1
            else:
                break
        if consecutive_deviations >= 3:
            is_sustained = True

    # Trend Direction Classification
    if sample_count < 3:
        trend_direction = "insufficient_data"
        explanation = f"Insufficient data ({sample_count} observations in lookback window; minimum 3 required for trajectory analysis)."
    elif is_sustained:
        trend_direction = "sustained_deviation"
        explanation = (
            f"Sustained baseline shift detected: {consecutive_deviations} consecutive observations "
            f"exceed 1.5 robust standard deviations from personal baseline median ({b_median} {catalog_entry.standard_unit})."
        )
    elif sens_slope is not None and abs(sens_slope) > (b_scale * 0.15 if b_scale and b_scale > 0 else 0.5):
        if sens_slope > 0:
            trend_direction = "increasing"
            explanation = f"Upward trajectory detected: Sen's slope is +{sens_slope} {catalog_entry.standard_unit}/day."
        else:
            trend_direction = "decreasing"
            explanation = f"Downward trajectory detected: Sen's slope is {sens_slope} {catalog_entry.standard_unit}/day."
    else:
        trend_direction = "stable"
        explanation = f"Stable physiological trajectory within expected operational variation (|Z| <= 1.5, Sen's slope ~ {sens_slope or 0.0})."

    data_quality_status = "degraded" if has_degraded else "nominal"

    return TrendObservation(
        measurement_type=canonical_type,
        canonical_identifier=canonical_type,
        context=norm_context,
        exercise_modality=norm_modality,
        unit=catalog_entry.standard_unit,
        current_value=current_val,
        current_measured_at=current_time,
        baseline_id=active_baseline.id if active_baseline else None,
        baseline_version=active_baseline.version if active_baseline else None,
        baseline_type=active_baseline.baseline_type if active_baseline else None,
        baseline_maturity=active_baseline.maturity if active_baseline else None,
        baseline_median=b_median,
        baseline_iqr=b_iqr,
        robust_scale_iqr=b_scale,
        robust_z=robust_z,
        sample_count=sample_count,
        sens_slope=sens_slope,
        trend_direction=trend_direction,
        consecutive_deviations=consecutive_deviations,
        is_sustained=is_sustained,
        freshness_status=freshness_item.status,
        hours_since_last_observation=freshness_item.hours_since_last,
        expected_interval_hours=freshness_item.expected_interval_hours,
        data_quality_status=data_quality_status,
        explanation=explanation,
    )


def analyze_all_trends_for_astronaut(
    db: Session,
    astronaut_id: str,
    context: str = "resting_cabin",
    lookback_hours: int = 72,
) -> List[TrendObservation]:
    """Analyze trends across all catalog metrics for an astronaut."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    trends: List[TrendObservation] = []
    # Primary canonical metrics to evaluate
    eval_metrics = [
        "heart_rate",
        "spo2",
        "body_temperature",
        "core_temperature",
        "blood_pressure_systolic",
        "blood_pressure_diastolic",
        "respiratory_rate",
        "sleep_duration",
        "radiation_dose",
    ]

    for metric in eval_metrics:
        trend = analyze_metric_trend(
            db=db,
            astronaut_id=astronaut_id,
            measurement_type=metric,
            context=context,
            lookback_hours=lookback_hours,
        )
        trends.append(trend)

    return trends


def get_astronaut_telemetry_freshness(
    db: Session,
    astronaut_id: str,
) -> TelemetryFreshnessResponse:
    """Retrieve telemetry currency and staleness report across all monitored metrics."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    now_utc = datetime.now(timezone.utc)
    items: List[MetricFreshnessItem] = []
    stale_count = 0

    monitored_metrics = [
        "heart_rate",
        "spo2",
        "body_temperature",
        "core_temperature",
        "blood_pressure_systolic",
        "blood_pressure_diastolic",
        "respiratory_rate",
        "sleep_duration",
        "radiation_dose",
    ]

    for metric in monitored_metrics:
        expansion_types = get_query_expansion_types(metric)
        latest_query = (
            select(Measurement)
            .where(Measurement.astronaut_id == astronaut_id)
            .where(Measurement.measurement_type.in_(expansion_types))
            .order_by(Measurement.measured_at.desc())
        )
        latest = db.execute(latest_query).scalars().first()

        item = evaluate_telemetry_freshness(
            last_measured_at=latest.measured_at if latest else None,
            measurement_type=metric,
            now=now_utc,
        )
        if item.status == "stale":
            stale_count += 1
        items.append(item)

    return TelemetryFreshnessResponse(
        astronaut_id=astronaut_id,
        evaluated_at=_format_iso(now_utc) or "",
        items=items,
        stale_count=stale_count,
        total_metrics=len(items),
    )
