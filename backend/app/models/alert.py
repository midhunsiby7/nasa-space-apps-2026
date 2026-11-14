"""HealthAlert SQLAlchemy model."""

from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.astronaut import Astronaut
    from app.models.assessment import HealthAssessment


class HealthAlert(Base):
    """Represents an actionable or informational operational health alert."""

    __tablename__ = "health_alert"
    __table_args__ = (
        CheckConstraint(
            "severity IN ('low', 'medium', 'high', 'critical')",
            name="chk_alert_severity",
        ),
        CheckConstraint(
            "status IN ('active', 'acknowledged', 'resolved')",
            name="chk_alert_status",
        ),
        Index("idx_alert_astronaut_status", "astronaut_id", "status"),
        Index("idx_alert_created", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    astronaut_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("astronaut.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    assessment_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("health_assessment.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )
    measurement_type: Mapped[str] = mapped_column(String(64), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, default="physiological_shift")
    severity: Mapped[str] = mapped_column(String(32), nullable=False, default="low")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    astronaut: Mapped["Astronaut"] = relationship("Astronaut", back_populates="alerts")
    assessment: Mapped[Optional["HealthAssessment"]] = relationship("HealthAssessment", back_populates="alerts")

    def __repr__(self) -> str:
        return (
            f"<HealthAlert(id='{self.id}', astronaut_id='{self.astronaut_id}', "
            f"severity='{self.severity}', status='{self.status}', title='{self.title}')>"
        )
