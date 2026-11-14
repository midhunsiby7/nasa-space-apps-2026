"""Aggregated router for API v1."""

from fastapi import APIRouter
from app.api.v1.endpoints import astronauts, measurements

api_router = APIRouter()
api_router.include_router(astronauts.router)
api_router.include_router(measurements.router)
