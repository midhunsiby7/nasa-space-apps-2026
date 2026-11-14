"""Service functions for operational health alerts and lifecycle management."""

from datetime import datetime, timezone
from typing import List, Optional
import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    AlertNotFoundException,
    AstronautNotFoundException,
)
from app.models.alert import HealthAlert
from app.schemas.alert import AlertResponse
from app.services.astronaut_service import get_astronaut
from app.services.baseline_service import _format_iso


def format_alert_response(alert: HealthAlert) -> AlertResponse:
    """Format an ORM HealthAlert instance into an API-compliant AlertResponse schema."""
    return AlertResponse(
        id=alert.id,
        astronaut_id=alert.astronaut_id,
        assessment_id=alert.assessment_id,
        measurement_type=alert.measurement_type,
        category=alert.category,
        severity=alert.severity,
        title=alert.title,
        explanation=alert.explanation,
        status=alert.status,
        created_at=_format_iso(alert.created_at) or "",
        acknowledged_at=_format_iso(alert.acknowledged_at),
        resolved_at=_format_iso(alert.resolved_at),
        is_synthetic=alert.is_synthetic,
    )


def create_or_update_alert(
    db: Session,
    astronaut_id: str,
    measurement_type: str,
    title: str,
    explanation: str,
    severity: str = "medium",
    category: str = "physiological_shift",
    assessment_id: Optional[str] = None,
    is_synthetic: bool = True,
) -> HealthAlert:
    """Create a new health alert or update existing active alert to suppress duplicate alarm fatigue."""
    # Check if an active alert already exists for this astronaut and metric
    existing_query = (
        select(HealthAlert)
        .where(HealthAlert.astronaut_id == astronaut_id)
        .where(HealthAlert.measurement_type == measurement_type)
        .where(HealthAlert.status.in_(["active", "acknowledged"]))
    )
    existing_alert = db.execute(existing_query).scalars().first()

    now_utc = datetime.now(timezone.utc)

    if existing_alert:
        # Update existing alert with latest assessment context without creating noisy duplicates
        existing_alert.title = title
        existing_alert.explanation = explanation
        # Upgrade severity if new severity is higher
        severity_rank = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        if severity_rank.get(severity, 1) > severity_rank.get(existing_alert.severity, 1):
            existing_alert.severity = severity
            existing_alert.status = "active"  # Re-activate if upgraded
        if assessment_id:
            existing_alert.assessment_id = assessment_id
        db.commit()
        db.refresh(existing_alert)
        return existing_alert

    # Create new alert
    new_alert = HealthAlert(
        id=f"alt-{uuid.uuid4().hex[:12]}",
        astronaut_id=astronaut_id,
        assessment_id=assessment_id,
        measurement_type=measurement_type,
        category=category,
        severity=severity,
        title=title,
        explanation=explanation,
        status="active",
        created_at=now_utc,
        is_synthetic=is_synthetic,
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert


def list_alerts_for_astronaut(
    db: Session,
    astronaut_id: str,
    status: Optional[str] = None,
    severity: Optional[str] = None,
) -> List[HealthAlert]:
    """List alerts for an astronaut with optional status and severity filtering."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    query = select(HealthAlert).where(HealthAlert.astronaut_id == astronaut_id)

    if status:
        query = query.where(HealthAlert.status == status.strip().lower())
    if severity:
        query = query.where(HealthAlert.severity == severity.strip().lower())

    query = query.order_by(HealthAlert.created_at.desc())
    return list(db.execute(query).scalars().all())


def get_alert_by_id(db: Session, alert_id: str) -> HealthAlert:
    """Retrieve an alert by ID or raise AlertNotFoundException."""
    alert = db.get(HealthAlert, alert_id)
    if not alert:
        raise AlertNotFoundException(alert_id=alert_id)
    return alert


def acknowledge_alert(db: Session, alert_id: str) -> HealthAlert:
    """Mark an alert as acknowledged by flight surgeon or crew medical officer."""
    alert = get_alert_by_id(db=db, alert_id=alert_id)
    if alert.status == "active":
        alert.status = "acknowledged"
        alert.acknowledged_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(alert)
    return alert


def resolve_alert(db: Session, alert_id: str) -> HealthAlert:
    """Mark an alert as resolved."""
    alert = get_alert_by_id(db=db, alert_id=alert_id)
    alert.status = "resolved"
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert
