"""Astronaut SQLAlchemy model."""

from datetime import datetime, timezone
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.measurement import Measurement
    from app.models.baseline import AstronautBaseline
    from app.models.assessment import HealthAssessment
    from app.models.alert import HealthAlert


class Astronaut(Base):
    """Represents an individual crew member participating in a spaceflight mission."""

    __tablename__ = "astronaut"
    __table_args__ = (
        CheckConstraint("mission_day >= 0", name="chk_astronaut_mission_day"),
        Index("idx_astronaut_mission", "mission_name"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    crew_role: Mapped[str] = mapped_column(String(128), nullable=False)
    mission_name: Mapped[str] = mapped_column(String(128), nullable=False)
    mission_day: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # 1:N Relationship to measurements with cascade delete
    measurements: Mapped[List["Measurement"]] = relationship(
        "Measurement",
        back_populates="astronaut",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # 1:N Relationship to calculated baselines with cascade delete
    baselines: Mapped[List["AstronautBaseline"]] = relationship(
        "AstronautBaseline",
        back_populates="astronaut",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # 1:N Relationship to assessments with cascade delete
    assessments: Mapped[List["HealthAssessment"]] = relationship(
        "HealthAssessment",
        back_populates="astronaut",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # 1:N Relationship to alerts with cascade delete
    alerts: Mapped[List["HealthAlert"]] = relationship(
        "HealthAlert",
        back_populates="astronaut",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Astronaut(id='{self.id}', name='{self.name}', mission='{self.mission_name}')>"
