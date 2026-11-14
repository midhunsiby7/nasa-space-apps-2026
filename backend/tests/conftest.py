"""Pytest fixtures and configuration for isolated testing."""

from datetime import datetime, timezone, timedelta
from typing import Generator
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient

from app.database.base import Base
from app.database.connection import get_db
from app.models.astronaut import Astronaut
from app.models.measurement import Measurement
from app.main import app

# Create in-memory SQLite engine with StaticPool for test isolation
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(test_engine, "connect")
def set_test_sqlite_pragma(dbapi_connection, connection_record):
    """Enable SQLite foreign key constraints during tests."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    expire_on_commit=False,
)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Create fresh database tables for each test function and drop afterward."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Provide a FastAPI TestClient with the database dependency overridden."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_astronaut(db_session: Session) -> Astronaut:
    """Seed a sample astronaut record for tests."""
    astro = Astronaut(
        id="astro-test-01",
        name="Commander Elena Rostova",
        crew_role="Commander",
        mission_name="Artemis IX",
        mission_day=12,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(astro)
    db_session.commit()
    db_session.refresh(astro)
    return astro


@pytest.fixture
def sample_measurements(db_session: Session, sample_astronaut: Astronaut):
    """Seed a series of telemetry measurements for the sample astronaut."""
    base_time = datetime.now(timezone.utc)
    measurements = [
        Measurement(
            id="meas-test-01",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=72.0,
            unit="bpm",
            measured_at=base_time - timedelta(minutes=30),
            source="BioHarness Sensor",
            context="Pre-EVA checklist",
            data_quality="nominal",
            is_synthetic=True,
        ),
        Measurement(
            id="meas-test-02",
            astronaut_id=sample_astronaut.id,
            measurement_type="spo2",
            value=98.5,
            unit="%",
            measured_at=base_time - timedelta(minutes=15),
            source="Pulse Oximeter",
            context="Pre-EVA checklist",
            data_quality="nominal",
            is_synthetic=True,
        ),
        Measurement(
            id="meas-test-03",
            astronaut_id=sample_astronaut.id,
            measurement_type="heart_rate",
            value=125.0,
            unit="bpm",
            measured_at=base_time,
            source="BioHarness Sensor",
            context="EVA egress",
            data_quality="nominal",
            is_synthetic=True,
        ),
    ]
    for m in measurements:
        db_session.add(m)
    db_session.commit()
    return measurements
