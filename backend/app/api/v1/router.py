"""Aggregated router for API v1."""

from fastapi import APIRouter
from app.api.v1.endpoints import astronauts, measurements, baselines

api_router = APIRouter()
api_router.include_router(astronauts.router)
api_router.include_router(measurements.router)
api_router.include_router(baselines.router)
