"""Explainable health assessment service synthesizing baselines, trends, and deterministic guidance."""

from datetime import datetime, timezone
import json
from typing import Dict, List, Optional, Tuple
import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    AssessmentNotFoundException,
    AstronautNotFoundException,
)
from app.models.assessment import HealthAssessment
from app.models.astronaut import Astronaut
from app.schemas.assessment import (
    AssessmentFinding,
    AssessmentResponse,
    GuidanceItem,
)
from app.services.alert_service import create_or_update_alert
from app.services.astronaut_service import get_astronaut
from app.services.baseline_service import _format_iso
from app.services.trend_service import (
    analyze_all_trends_for_astronaut,
    analyze_metric_trend,
    TrendObservation,
)


# Illustrative Demonstration Thresholds (Unvalidated & Disabled by Default)
# IMPORTANT: These default values are illustrative engineering artifacts for test scaffolding.
# They are NOT authoritative or NASA-approved clinical flight protocol thresholds.
# Emergency threshold evaluation is DISABLED BY DEFAULT in operational assessment flows.
DEMO_UNVALIDATED_EMERGENCY_THRESHOLDS: Dict[str, Dict[str, float]] = {
    "spo2": {"critical_low": 85.0},
    "heart_rate": {"critical_high_resting": 180.0},
    "blood_pressure_systolic": {"critical_high": 200.0},
}


# Critical Acute / Emergency Symptom Set for Decision Support Escalation
ACUTE_EMERGENCY_SYMPTOMS = {
    "acute_chest_pain",
    "sudden_visual_loss",
    "severe_dyspnea",
    "loss_of_consciousness",
    "acute_severe_headache",
}


def evaluate_metric_finding(
    trend: TrendObservation,
    emergency_protocol_config: Optional[Dict[str, Dict[str, float]]] = None,
) -> Tuple[str, AssessmentFinding]:
    """Evaluate individual metric trend into an explainable finding and severity tier.

    Emergency evaluation is DISABLED by default unless an explicit protocol configuration
    is provided via `emergency_protocol_config`. Unvalidated thresholds must never be presented
    as genuine medical emergency determinations. Missing or insufficient data must NEVER imply
    nominal physiology.
    """
    # 0. Check data availability and currency first
    if trend.sample_count == 0:
        status = "no_data"
        summary = (
            f"No telemetry observations recorded for {trend.measurement_type} in lookback window. "
            f"Absence of telemetry does NOT indicate nominal physiology."
        )
    elif trend.trend_direction == "insufficient_data":
        status = "insufficient_data"
        summary = (
            f"{trend.measurement_type}: Insufficient data ({trend.sample_count} observation(s) in lookback window; "
            f"minimum 3 required for trajectory analysis). Does NOT confirm nominal physiology."
        )
    elif trend.freshness_status == "stale":
        status = "telemetry_stale"
        summary = (
            f"{trend.measurement_type} telemetry is stale ({trend.hours_since_last_observation}h since last reading; "
            f"expected every {trend.expected_interval_hours}h). Currency verification required."
        )
    else:
        status = "nominal"
        summary = f"{trend.measurement_type}: Operating within nominal intra-individual variation."

    # 1. Configured emergency rule check (DISABLED by default unless emergency_protocol_config is provided)
    if emergency_protocol_config and trend.current_value is not None:
        metric_cfg = emergency_protocol_config.get(trend.measurement_type, {})
        crit_low = metric_cfg.get("critical_low")
        crit_high = metric_cfg.get("critical_high")
        crit_high_resting = metric_cfg.get("critical_high_resting")

        if crit_low is not None and trend.current_value < crit_low:
            status = "emergency"
            summary = (
                f"OPERATIONAL PROTOCOL NOTICE: {trend.measurement_type} ({trend.current_value} {trend.unit}) "
                f"breached configured protocol floor ({crit_low} {trend.unit}). "
                f"This notification is a decision-support indicator based on configured protocol rules and does NOT constitute a clinical diagnosis."
            )
        elif (
            crit_high_resting is not None
            and trend.context == "resting_cabin"
            and trend.current_value > crit_high_resting
        ):
            status = "emergency"
            summary = (
                f"OPERATIONAL PROTOCOL NOTICE: Resting {trend.measurement_type} ({trend.current_value} {trend.unit}) "
                f"breached configured protocol ceiling ({crit_high_resting} {trend.unit}). "
                f"This notification is a decision-support indicator based on configured protocol rules and does NOT constitute a clinical diagnosis."
            )
        elif crit_high is not None and trend.current_value > crit_high:
            status = "emergency"
            summary = (
                f"OPERATIONAL PROTOCOL NOTICE: {trend.measurement_type} ({trend.current_value} {trend.unit}) "
                f"breached configured protocol ceiling ({crit_high} {trend.unit}). "
                f"This notification is a decision-support indicator based on configured protocol rules and does NOT constitute a clinical diagnosis."
            )

    # 2. Non-emergency status evaluation for available data
    if status not in ("emergency", "no_data", "insufficient_data"):
        if trend.is_sustained:
            status = "sustained_shift"
            summary = (
                f"{trend.measurement_type} exhibits a sustained shift across {trend.consecutive_deviations} consecutive readings "
                f"(current: {trend.current_value} {trend.unit}, baseline median: {trend.baseline_median} {trend.unit}, Z: {trend.robust_z})."
            )
        elif trend.robust_z is not None and abs(trend.robust_z) > 2.0:
            status = "significant_outlier"
            summary = (
                f"{trend.measurement_type} shows an isolated elevated deviation (Z: {trend.robust_z}; current: {trend.current_value} {trend.unit}). "
                f"Isolated readings are evaluated cautiously to avoid alarm fatigue."
            )
        elif trend.trend_direction in ("increasing", "decreasing"):
            status = "directional_drift"
            summary = f"{trend.measurement_type} exhibits a monotonic {trend.trend_direction} drift (Sen's slope: {trend.sens_slope} {trend.unit}/day)."
        elif trend.freshness_status == "stale":
            status = "telemetry_stale"
            summary = f"{trend.measurement_type} telemetry is stale ({trend.hours_since_last_observation}h since last reading)."

    finding = AssessmentFinding(
        measurement_type=trend.measurement_type,
        status=status,
        summary=summary,
        current_value=trend.current_value,
        baseline_median=trend.baseline_median,
        robust_z=trend.robust_z,
        trend=trend.trend_direction,
        baseline_version=trend.baseline_version,
    )

    return status, finding


def generate_safe_guidance(classification: str, findings: List[AssessmentFinding]) -> List[GuidanceItem]:
    """Generate safe, deterministic, non-diagnostic guidance items matching the assessment tier."""
    guidance: List[GuidanceItem] = []

    # Telemetry and sensor verification is always appropriate
    guidance.append(
        GuidanceItem(
            category="telemetry_verification",
            action="Inspect sensor band fit, skin contact, and battery telemetry.",
            rationale="Transitory sensor displacements and motion artifacts frequently mimic physiological shifts in microgravity.",
        )
    )

    if classification == "emergency":
        guidance.append(
            GuidanceItem(
                category="emergency_protocol",
                action="Notify the Crew Medical Officer and Flight Surgeon for review of configured protocol excursion.",
                rationale="Configured operational protocol threshold reached. Operational notice only; does not replace flight surgeon clinical evaluation.",
                is_medical_prescription=False,
            )
        )
    elif classification == "medical_review_recommended":
        guidance.append(
            GuidanceItem(
                category="medical_consultation",
                action="Schedule an asynchronous or live clinical review with the designated Crew Medical Officer.",
                rationale="Multi-parameter concordance or sustained significant physiological deviation detected across multiple monitoring windows.",
            )
        )
        guidance.append(
            GuidanceItem(
                category="context_review",
                action="Review recent exercise workload, sleep architecture logs, and cabin carbon dioxide levels.",
                rationale="Environmental factors and cumulative countermeasure fatigue commonly explain concordant vital shifts.",
            )
        )
    elif classification == "needs_attention":
        guidance.append(
            GuidanceItem(
                category="protocol_repeat",
                action="Perform a scheduled follow-up vital signs observation under quiet resting conditions.",
                rationale="Confirming whether the observed shift is sustained or transient clarifies true physiological adaptation.",
            )
        )
        guidance.append(
            GuidanceItem(
                category="symptom_logging",
                action="Record any subjective symptoms (head fullness, fatigue, thermal discomfort) in the crew daily log.",
                rationale="Subjective clinical telemetry complements non-invasive sensor tracking.",
            )
        )
    else:
        # Routine
        guidance.append(
            GuidanceItem(
                category="routine_operations",
                action="Continue scheduled nominal mission timeline and physiological countermeasure schedule.",
                rationale="Vitals are well-contained within personal operational baseline boundaries.",
                is_medical_prescription=False,
            )
        )
        guidance.append(
            GuidanceItem(
                category="clinical_primacy",
                action="Never dismiss reported physical symptoms based solely on normal statistical telemetry.",
                rationale="Telemetry models reflect statistical envelopes only; direct crew symptom reports always take clinical precedence.",
                is_medical_prescription=False,
            )
        )

    return guidance


def synthesize_health_assessment(
    db: Session,
    astronaut_id: str,
    context: str = "resting_cabin",
    lookback_hours: int = 72,
    generate_alerts: bool = True,
    emergency_protocol_config: Optional[Dict[str, Dict[str, float]]] = None,
    reported_symptoms: Optional[List[str]] = None,
) -> HealthAssessment:
    """Execute end-to-end explainable assessment synthesizing trends, baselines, and safety rules."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    # 1. Analyze trends across all metrics
    trends = analyze_all_trends_for_astronaut(
        db=db,
        astronaut_id=astronaut_id,
        context=context,
        lookback_hours=lookback_hours,
    )

    # 2. Evaluate metric-level findings
    findings: List[AssessmentFinding] = []
    statuses: List[str] = []
    baseline_versions: Dict[str, str] = {}
    has_degraded = False

    emergency_detected = False
    emergency_metrics: List[str] = []
    sustained_shifts: List[str] = []
    significant_deviations: List[str] = []

    for t in trends:
        st, f = evaluate_metric_finding(t, emergency_protocol_config=emergency_protocol_config)
        findings.append(f)
        statuses.append(st)

        if t.baseline_id:
            baseline_versions[t.measurement_type] = f"{t.baseline_id} (v{t.baseline_version or 1})"
        if t.data_quality_status != "nominal":
            has_degraded = True

        if st == "emergency":
            emergency_detected = True
            emergency_metrics.append(t.measurement_type)
        elif st == "sustained_shift":
            sustained_shifts.append(t.measurement_type)
        elif st == "significant_outlier":
            significant_deviations.append(t.measurement_type)

    # 3. Concordance & Attention Classification with Clinical Primacy
    acute_symptoms = [
        s for s in (reported_symptoms or [])
        if s.lower().replace(" ", "_") in ACUTE_EMERGENCY_SYMPTOMS
    ]
    general_symptoms = [
        s for s in (reported_symptoms or [])
        if s.lower().replace(" ", "_") not in ACUTE_EMERGENCY_SYMPTOMS
    ]

    active_stream_trends = [t for t in trends if t.sample_count > 0]
    has_active_streams = len(active_stream_trends) > 0
    all_active_streams_stale = has_active_streams and all(
        t.freshness_status == "stale" for t in active_stream_trends
    )
    if not has_active_streams or all_active_streams_stale:
        has_degraded = True

    if emergency_detected:
        overall_classification = "emergency"
        explanation = (
            f"OPERATIONAL PROTOCOL NOTICE: Telemetry excursion in {', '.join(emergency_metrics)} "
            f"met explicitly configured threshold criteria. This notification is an operational "
            f"decision-support indicator and not an automated clinical diagnosis."
        )
    elif acute_symptoms:
        # Acute/emergency symptom report takes clinical precedence over statistical telemetry
        overall_classification = "medical_review_recommended"
        explanation = (
            f"CLINICAL PRIMACY / ACUTE SYMPTOM ESCALATION: Astronaut reported acute symptom(s) ({', '.join(acute_symptoms)}). "
            f"Statistical vital envelopes cannot dismiss direct crew symptom reports. Immediate flight surgeon consultation "
            f"and operational checklist review required. Does NOT constitute automated clinical diagnosis."
        )
    elif len(sustained_shifts) >= 2 or (len(sustained_shifts) >= 1 and len(significant_deviations) >= 1):
        overall_classification = "medical_review_recommended"
        explanation = (
            f"Multi-parameter physiological shift detected across {', '.join(sustained_shifts + significant_deviations)}. "
            f"Concordant deviations across related vitals warrant flight surgeon review. Observations are based on comparable "
            f"active baseline envelopes and are explicitly non-diagnostic."
        )
    elif len(sustained_shifts) >= 1 or len(significant_deviations) >= 2:
        overall_classification = "needs_attention"
        affected = sustained_shifts if sustained_shifts else significant_deviations
        explanation = (
            f"Sustained baseline shift detected in {', '.join(affected)} relative to personal {context} operational baseline. "
            f"Observation is based on consecutive readings in lookback window ({lookback_hours}h). Does not indicate pathology."
        )
    elif general_symptoms:
        # Clinical primacy: symptoms reported despite normal vitals
        overall_classification = "needs_attention"
        explanation = (
            f"CLINICAL PRIMACY NOTICE: Astronaut reported subjective symptom(s) ({', '.join(general_symptoms)}). "
            f"Although statistical telemetry remains within personal baseline envelopes, reported symptoms take clinical precedence "
            f"and require non-diagnostic medical review."
        )
    elif not has_active_streams or all_active_streams_stale:
        overall_classification = "routine"
        explanation = (
            f"Telemetry streams across monitored metrics in context '{context}' are missing or stale. "
            f"Intra-individual baseline stability cannot be verified without current sensor packets. Telemetry currency verification required."
        )
    else:
        overall_classification = "routine"
        explanation = (
            f"Astronaut physiological telemetry is operating within nominal personal baseline envelopes "
            f"for context '{context}'. No sustained deviations or multi-parameter shifts detected across lookback window."
        )

    # 4. Generate safe deterministic guidance
    guidance = generate_safe_guidance(overall_classification, findings)
    if reported_symptoms:
        guidance.append(
            GuidanceItem(
                category="clinical_primacy",
                action="Review reported subjective symptoms with the astronaut. Never dismiss symptoms based solely on statistical vital envelopes.",
                rationale="Direct crew subjective reports take clinical precedence over automated non-invasive telemetry models.",
                is_medical_prescription=False,
            )
        )

    # 5. Persist HealthAssessment
    assessment_id = f"asm-{uuid.uuid4().hex[:12]}"
    now_utc = datetime.now(timezone.utc)
    data_quality_status = "degraded" if has_degraded else "nominal"

    assessment = HealthAssessment(
        id=assessment_id,
        astronaut_id=astronaut_id,
        assessment_date=now_utc,
        overall_classification=overall_classification,
        summary_explanation=explanation,
        findings_json=json.dumps([f.model_dump() for f in findings]),
        guidance_json=json.dumps([g.model_dump() for g in guidance]),
        baseline_versions_json=json.dumps(baseline_versions),
        data_quality_status=data_quality_status,
        is_synthetic=True,
        created_at=now_utc,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # 6. Automatic Alert Generation for Non-Routine Classifications
    if generate_alerts and overall_classification != "routine":
        severity_map = {
            "needs_attention": "medium",
            "medical_review_recommended": "high",
            "emergency": "critical",
        }
        severity = severity_map.get(overall_classification, "medium")

        # Emit an alert for each affected metric
        alert_targets = emergency_metrics or sustained_shifts or significant_deviations or ["vitals_summary"]
        for target_metric in alert_targets:
            create_or_update_alert(
                db=db,
                astronaut_id=astronaut_id,
                measurement_type=target_metric,
                title=f"{target_metric.replace('_', ' ').title()} {overall_classification.replace('_', ' ').title()}",
                explanation=explanation,
                severity=severity,
                category="physiological_shift" if overall_classification != "emergency" else "operational_protocol",
                assessment_id=assessment_id,
            )

    return assessment


def format_assessment_response(assessment: HealthAssessment) -> AssessmentResponse:
    """Format an ORM HealthAssessment model into an API-compliant AssessmentResponse schema."""
    findings_raw = json.loads(assessment.findings_json) if assessment.findings_json else []
    findings = [AssessmentFinding(**f) for f in findings_raw]

    guidance_raw = json.loads(assessment.guidance_json) if assessment.guidance_json else []
    guidance = [GuidanceItem(**g) for g in guidance_raw]

    baseline_versions = (
        json.loads(assessment.baseline_versions_json) if assessment.baseline_versions_json else {}
    )

    return AssessmentResponse(
        id=assessment.id,
        astronaut_id=assessment.astronaut_id,
        assessment_date=_format_iso(assessment.assessment_date) or "",
        overall_classification=assessment.overall_classification,
        summary_explanation=assessment.summary_explanation,
        findings=findings,
        guidance=guidance,
        baseline_versions_used=baseline_versions,
        data_quality_status=assessment.data_quality_status,
        is_synthetic=assessment.is_synthetic,
        created_at=_format_iso(assessment.created_at) or "",
    )


def get_latest_assessment_for_astronaut(
    db: Session,
    astronaut_id: str,
) -> Optional[HealthAssessment]:
    """Retrieve the most recent health assessment for an astronaut."""
    query = (
        select(HealthAssessment)
        .where(HealthAssessment.astronaut_id == astronaut_id)
        .order_by(HealthAssessment.assessment_date.desc())
    )
    return db.execute(query).scalars().first()


def list_assessments_for_astronaut(
    db: Session,
    astronaut_id: str,
    limit: int = 50,
) -> List[HealthAssessment]:
    """Retrieve historical assessment evaluations for an astronaut."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    query = (
        select(HealthAssessment)
        .where(HealthAssessment.astronaut_id == astronaut_id)
        .order_by(HealthAssessment.assessment_date.desc())
        .limit(limit)
    )
    return list(db.execute(query).scalars().all())
