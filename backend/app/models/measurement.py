"""Measurement SQLAlchemy model."""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Float,
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


class Measurement(Base):
    """Represents a physiological, environmental, or operational telemetry sample."""

    __tablename__ = "measurement"
    __table_args__ = (
        CheckConstraint(
            "data_quality IN ('nominal', 'degraded', 'noisy', 'interpolated', 'calibrating')",
            name="chk_measurement_data_quality",
        ),
        Index("idx_measurement_astronaut", "astronaut_id"),
        Index(
            "idx_measurement_timeline",
            "astronaut_id",
            "measurement_type",
            "measured_at",
        ),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    astronaut_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("astronaut.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    measurement_type: Mapped[str] = mapped_column(String(64), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source: Mapped[str] = mapped_column(String(128), nullable=False)
    context: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    data_quality: Mapped[str] = mapped_column(String(32), nullable=False, default="nominal")
    is_synthetic: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # N:1 Relationship back to Astronaut
    astronaut: Mapped["Astronaut"] = relationship("Astronaut", back_populates="measurements")

    def __repr__(self) -> str:
        return (
            f"<Measurement(id='{self.id}', type='{self.measurement_type}', "
            f"value={self.value} {self.unit}, is_synthetic={self.is_synthetic})>"
        )
