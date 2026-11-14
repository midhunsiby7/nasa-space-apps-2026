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
