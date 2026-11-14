"""AstronautBaseline SQLAlchemy model with lifecycle versioning and maturity attributes."""

from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Float,
    Integer,
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


class AstronautBaseline(Base):
    """Represents a calculated personal physiological baseline envelope for an astronaut."""

    __tablename__ = "astronaut_baseline"
    __table_args__ = (
        CheckConstraint(
            "context IN ('resting_cabin', 'sleep_cycle', 'exercise_active', 'exercise_recovery')",
            name="chk_baseline_context",
        ),
        CheckConstraint("sample_count >= 0", name="chk_baseline_sample_count"),
        CheckConstraint("baseline_type IN ('preflight', 'inflight')", name="chk_baseline_type"),
        CheckConstraint(
            "maturity IN ('insufficient', 'provisional', 'established')",
            name="chk_baseline_maturity",
        ),
        CheckConstraint("version >= 1", name="chk_baseline_version"),
        Index("idx_baseline_lookup", "astronaut_id", "measurement_type", "context"),
        Index("idx_baseline_astronaut", "astronaut_id"),
        Index(
            "idx_baseline_active_lookup",
            "astronaut_id",
            "baseline_type",
            "measurement_type",
            "context",
            "is_active",
        ),
        Index(
            "idx_baseline_version",
            "astronaut_id",
            "baseline_type",
            "measurement_type",
            "context",
            "version",
        ),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    astronaut_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("astronaut.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    measurement_type: Mapped[str] = mapped_column(String(64), nullable=False)
    context: Mapped[str] = mapped_column(String(64), nullable=False, default="resting_cabin")
    exercise_modality: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, default=None)
    measurement_site: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, default=None)
    measurement_method: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, default=None)
    sensor_model: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, default=None)
    unit: Mapped[str] = mapped_column(String(32), nullable=False)

    # Lifecycle Attributes
    baseline_type: Mapped[str] = mapped_column(String(32), nullable=False, default="inflight")
    maturity: Mapped[str] = mapped_column(String(32), nullable=False, default="insufficient")
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_finalized: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    supersedes_baseline_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, default=None)
    maturity_evaluated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
    maturity_criteria_snapshot: Mapped[Optional[str]] = mapped_column(
        String(512), nullable=True, default=None
    )

    # Robust & Descriptive Statistics
    median: Mapped[float] = mapped_column(Float, nullable=False)
    q25: Mapped[float] = mapped_column(Float, nullable=False)
    q75: Mapped[float] = mapped_column(Float, nullable=False)
    iqr: Mapped[float] = mapped_column(Float, nullable=False)
    mean: Mapped[float] = mapped_column(Float, nullable=False)
    std_dev: Mapped[float] = mapped_column(Float, nullable=False)
    robust_scale_iqr: Mapped[float] = mapped_column(Float, nullable=False)
    min_value: Mapped[float] = mapped_column(Float, nullable=False)
    max_value: Mapped[float] = mapped_column(Float, nullable=False)

    # Observation metadata & Provenance
    sample_count: Mapped[int] = mapped_column(Integer, nullable=False)
    nominal_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    degraded_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    window_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    window_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    algorithm_version: Mapped[str] = mapped_column(String(32), nullable=False, default="v2c-lifecycle")
    is_synthetic: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationship back to Astronaut
    astronaut: Mapped["Astronaut"] = relationship("Astronaut", back_populates="baselines")

    def __repr__(self) -> str:
        return (
            f"<AstronautBaseline(id='{self.id}', astronaut_id='{self.astronaut_id}', "
            f"type='{self.measurement_type}', baseline_type='{self.baseline_type}', "
            f"v={self.version}, active={self.is_active}, maturity='{self.maturity}', "
            f"median={self.median} {self.unit})>"
        )
