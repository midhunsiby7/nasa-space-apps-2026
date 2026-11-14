"""Operational health alerts and alert lifecycle API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, Body, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.exceptions import (
    AlertNotFoundException,
    AstronautNotFoundException,
)
from app.models.alert import HealthAlert
from app.schemas.alert import (
    AlertActionRequest,
    AlertListResponse,
    AlertResponse,
)
from app.services.alert_service import (
    acknowledge_alert,
    format_alert_response,
    get_alert_by_id,
    list_alerts_for_astronaut,
    resolve_alert,
)
from app.services.astronaut_service import get_astronaut

router = APIRouter(tags=["alerts"])


@router.get(
    "/astronauts/{astronaut_id}/alerts",
    response_model=AlertListResponse,
)
def get_astronaut_alerts(
    astronaut_id: str = Path(..., description="Unique identifier of the astronaut"),
    status: Optional[str] = Query(None, description="Optional alert status filter ('active', 'acknowledged', 'resolved')"),
    severity: Optional[str] = Query(None, description="Optional severity filter ('low', 'medium', 'high', 'critical')"),
    db: Session = Depends(get_db),
) -> AlertListResponse:
    """Retrieve operational health alerts for an astronaut with optional status/severity filters."""
    astronaut = get_astronaut(db=db, astronaut_id=astronaut_id)
    if not astronaut:
        raise AstronautNotFoundException(astronaut_id=astronaut_id)

    alerts = list_alerts_for_astronaut(
        db=db,
        astronaut_id=astronaut_id,
        status=status,
        severity=severity,
    )
    data = [format_alert_response(a) for a in alerts]

    return AlertListResponse(
        astronaut_id=astronaut_id,
        data=data,
        total=len(data),
    )


@router.get(
    "/alerts/{alert_id}",
    response_model=AlertResponse,
)
def get_alert(
    alert_id: str = Path(..., description="Unique alert identifier"),
    db: Session = Depends(get_db),
) -> AlertResponse:
    """Retrieve details for a single operational health alert."""
    alert = get_alert_by_id(db=db, alert_id=alert_id)
    return format_alert_response(alert)


@router.post(
    "/alerts/{alert_id}/acknowledge",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
)
def acknowledge_health_alert(
    alert_id: str = Path(..., description="Unique alert identifier"),
    payload: Optional[AlertActionRequest] = Body(None, description="Optional acknowledgement notes"),
    db: Session = Depends(get_db),
) -> AlertResponse:
    """Acknowledge an active health alert, recording operator review."""
    alert = acknowledge_alert(db=db, alert_id=alert_id)
    return format_alert_response(alert)


@router.post(
    "/alerts/{alert_id}/resolve",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
)
def resolve_health_alert(
    alert_id: str = Path(..., description="Unique alert identifier"),
    payload: Optional[AlertActionRequest] = Body(None, description="Optional resolution notes"),
    db: Session = Depends(get_db),
) -> AlertResponse:
    """Mark an alert as resolved."""
    alert = resolve_alert(db=db, alert_id=alert_id)
    return format_alert_response(alert)
