"""Custom application exceptions following API_CONTRACT.md error specifications."""

from typing import Any, Optional


class AppException(Exception):
    """Base application exception for standardized error envelopes."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Any] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class AstronautNotFoundException(AppException):
    """Raised when an astronaut profile does not exist."""

    def __init__(self, astronaut_id: str):
        super().__init__(
            code="ASTRONAUT_NOT_FOUND",
            message=f"Astronaut with id '{astronaut_id}' not found.",
            status_code=404,
            details={"astronaut_id": astronaut_id},
        )


class InvalidQueryParameterException(AppException):
    """Raised when an API query parameter is invalid or fails business validation."""

    def __init__(self, parameter: str, message: str, value: Any = None):
        super().__init__(
            code="INVALID_QUERY_PARAMETER",
            message=message,
            status_code=400,
            details={"parameter": parameter, "value": value},
        )


class BaselineNotFoundException(AppException):
    """Raised when a requested baseline reference does not exist."""

    def __init__(self, astronaut_id: str, measurement_type: str, context: Optional[str] = None):
        msg = f"Baseline for astronaut '{astronaut_id}' with metric '{measurement_type}'"
        if context:
            msg += f" in context '{context}'"
        msg += " not found."
        super().__init__(
            code="BASELINE_NOT_FOUND",
            message=msg,
            status_code=404,
            details={
                "astronaut_id": astronaut_id,
                "measurement_type": measurement_type,
                "context": context,
            },
        )


class IneligibleBaselineContextException(AppException):
    """Raised when an attempt is made to calculate a baseline from an ineligible context."""

    def __init__(self, context: str, message: Optional[str] = None):
        msg = message or (
            f"Context '{context}' is not eligible for physiological baseline generation. "
            f"Baselines must use resting_cabin, sleep_cycle, exercise_active, or exercise_recovery."
        )
        super().__init__(
            code="INELIGIBLE_BASELINE_CONTEXT",
            message=msg,
            status_code=400,
            details={"context": context},
        )


class InsufficientMeasurementsException(AppException):
    """Raised when insufficient valid comparable measurements exist to calculate a baseline."""

    def __init__(self, astronaut_id: str, measurement_type: str, context: str, details: Optional[Any] = None):
        super().__init__(
            code="INSUFFICIENT_MEASUREMENTS",
            message=(
                f"Cannot calculate baseline: No valid comparable measurements found for astronaut "
                f"'{astronaut_id}' with metric '{measurement_type}' in context '{context}'."
            ),
            status_code=422,
            details=details or {
                "astronaut_id": astronaut_id,
                "measurement_type": measurement_type,
                "context": context,
            },
        )
