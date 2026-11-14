"""HealthAssessment SQLAlchemy model."""

from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
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
    from app.models.alert import HealthAlert


class HealthAssessment(Base):
    """Represents an explainable multi-metric health assessment evaluation."""

    __tablename__ = "health_assessment"
    __table_args__ = (
        CheckConstraint(
            "overall_classification IN ('routine', 'needs_attention', 'medical_review_recommended', 'emergency')",
            name="chk_assessment_classification",
        ),
        Index("idx_assessment_astronaut", "astronaut_id"),
        Index("idx_assessment_timeline", "astronaut_id", "assessment_date"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    astronaut_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("astronaut.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    assessment_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    overall_classification: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="routine",
    )
    summary_explanation: Mapped[str] = mapped_column(Text, nullable=False)
    findings_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    guidance_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    baseline_versions_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    data_quality_status: Mapped[str] = mapped_column(String(32), nullable=False, default="nominal")
    is_synthetic: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    astronaut: Mapped["Astronaut"] = relationship("Astronaut", back_populates="assessments")
    alerts: Mapped[List["HealthAlert"]] = relationship(
        "HealthAlert",
        back_populates="assessment",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return (
            f"<HealthAssessment(id='{self.id}', astronaut_id='{self.astronaut_id}', "
            f"classification='{self.overall_classification}', date='{self.assessment_date}')>"
        )
