"""Application entry point for COSMOLOOKUP API."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.exceptions import AppException
from app.database.connection import engine
from app.database.base import Base
import app.models  # Registers models with Base.metadata
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event handler for database initialization."""
    # Ensure tables exist in SQLite on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Astronaut health monitoring and telemetry observation platform for NASA Space Apps 2026.",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers matching API_CONTRACT.md error response specifications
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle query/path/body validation errors and format into standard envelope."""
    errors = exc.errors()
    first_err = errors[0] if errors else {}
    loc = first_err.get("loc", [])
    param_name = str(loc[-1]) if loc else "unknown"
    msg = first_err.get("msg", "Validation error")

    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": "INVALID_QUERY_PARAMETER",
                "message": f"Parameter '{param_name}' validation error: {msg}.",
                "details": {
                    "parameter": param_name,
                    "value": first_err.get("input"),
                },
            }
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle standard Starlette/FastAPI HTTP exceptions."""
    code = "RESOURCE_NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": str(exc.detail),
                "details": None,
            }
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected unhandled exceptions without leaking stack trace."""
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred.",
                "details": None,
            }
        },
    )


# Internal Health-Check Routes (Development & Monitoring)
@app.get("/health", tags=["system"])
@app.get(f"{settings.API_V1_STR}/health", tags=["system"])
def health_check():
    """Development and readiness health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": "v1",
        "environment": settings.ENVIRONMENT,
    }


# Register Versioned API Routes
app.include_router(api_router, prefix=settings.API_V1_STR)
