"""Pydantic v2 schemas for NASA OSDR research studies and evidence classification."""

import re
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class EvidenceCategory(str, Enum):
    """Scientific origin and model classification of spaceflight research evidence."""
    HUMAN_SPACEFLIGHT = "HUMAN_SPACEFLIGHT"
    HUMAN_GROUND_ANALOG = "HUMAN_GROUND_ANALOG"
    ANIMAL_MODEL = "ANIMAL_MODEL"
    CELL_OR_TISSUE_MODEL = "CELL_OR_TISSUE_MODEL"
    OTHER = "OTHER"


class ResearchRelevance(str, Enum):
    """Clinical and operational relevance tier for deep-space astronaut health monitoring."""
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"


ACCESSION_REGEX = re.compile(r"^[A-Z0-9]+-[0-9]+$")


class ResearchStudyBase(BaseModel):
    """Core fields characterizing an empirical NASA research study."""
    model_config = ConfigDict(extra="forbid")

    accession: str = Field(..., description="Unique repository accession identifier (e.g. OSD-575)")
    title: str = Field(..., min_length=3, description="Official scientific study title")
    description: str = Field(..., description="Scientific abstract and experimental summary")
    evidence_category: EvidenceCategory = Field(..., description="Evidence origin classification")
    relevance: ResearchRelevance = Field(..., description="Operational relevance tier (HIGH, MODERATE, LOW)")
    assay_types: List[str] = Field(default_factory=list, description="List of laboratory assay methodologies")
    body_systems: List[str] = Field(default_factory=list, description="Target physiological body systems")
    data_formats: List[str] = Field(default_factory=list, description="Assay data formats available in repository")
    organism: str = Field(..., description="Scientific name of subject organism")
    mission_context: str = Field(..., description="Spaceflight mission or ground analog environment")
    measurements_summary: str = Field(..., description="Summary of biological parameters and endpoints measured")
    sample_count: Optional[int] = Field(None, ge=0, description="Total biological samples evaluated")
    publication_citation: Optional[str] = Field(None, description="Primary peer-reviewed literature citation")
    official_url: Optional[str] = Field(None, description="Official NASA OSDR portal URL")
    is_synthetic: bool = Field(False, description="Provenance indicator: False for empirical research")
    created_at: Optional[str] = Field(None, description="Repository indexing timestamp in UTC ISO format")

    @field_validator("accession")
    @classmethod
    def validate_accession_format(cls, v: str) -> str:
        clean_v = v.strip().upper()
        if not ACCESSION_REGEX.match(clean_v):
            raise ValueError(f"Accession '{v}' does not match required format (e.g. 'OSD-575').")
        return clean_v

    @field_validator("assay_types", "body_systems", "data_formats")
    @classmethod
    def validate_string_lists(cls, v: List[str]) -> List[str]:
        if not v:
            return []
        cleaned = [item.strip() for item in v if item.strip()]
        return cleaned


class ResearchStudy(ResearchStudyBase):
    """Internal model for a research study record."""
    pass


class ResearchStudyResponse(ResearchStudyBase):
    """Public representation of an individual research study."""
    model_config = ConfigDict(extra="forbid", from_attributes=True)


class ResearchStudyListResponse(BaseModel):
    """Collection response for research studies matching COSMOLOOKUP conventions."""
    model_config = ConfigDict(extra="forbid")

    data: List[ResearchStudyResponse] = Field(default_factory=list, description="List of matching research studies")
    total: int = Field(..., ge=0, description="Total matching studies count")
    limit: int = Field(50, ge=1, le=100, description="Pagination record limit")
    offset: int = Field(0, ge=0, description="Pagination record offset")


class ResearchSummaryResponse(BaseModel):
    """Aggregated portfolio summary statistics for the research catalogue."""
    model_config = ConfigDict(extra="forbid")

    total_studies: int = Field(..., ge=0, description="Total curated studies in catalogue")
    counts_by_evidence_category: Dict[str, int] = Field(default_factory=dict, description="Distribution across evidence categories")
    counts_by_body_system: Dict[str, int] = Field(default_factory=dict, description="Distribution across physiological body systems")
    counts_by_relevance: Dict[str, int] = Field(default_factory=dict, description="Distribution across relevance tiers")
    last_catalogue_update: Optional[str] = Field(None, description="Timestamp of catalogue compilation or update")
