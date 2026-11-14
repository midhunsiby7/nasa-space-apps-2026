"""NASA OSDR research repository and curated catalogue lifecycle manager."""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from app.core.exceptions import (
    ResearchCatalogueCorruptException,
    ResearchCatalogueUnavailableException,
    ResearchStudyNotFoundException,
)
from app.schemas.research import (
    EvidenceCategory,
    ResearchRelevance,
    ResearchStudy,
)


def resolve_catalogue_path(explicit_path: Optional[Union[str, Path]] = None) -> Path:
    """Resolve the path to the curated research catalogue JSON file.
    
    Resolves relative to project repository root rather than current working directory,
    with environment variable and fallback support.
    """
    if explicit_path:
        return Path(explicit_path).resolve()

    env_path = os.environ.get("RESEARCH_CATALOGUE_PATH")
    if env_path:
        return Path(env_path).resolve()

    # Candidate 1: repo_root/data/research/osdr_curated_catalogue.json
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    candidate_1 = repo_root / "data" / "research" / "osdr_curated_catalogue.json"
    if candidate_1.exists():
        return candidate_1

    # Candidate 2: cwd/data/research/osdr_curated_catalogue.json
    candidate_2 = Path.cwd() / "data" / "research" / "osdr_curated_catalogue.json"
    if candidate_2.exists():
        return candidate_2.resolve()

    # Default to candidate_1
    return candidate_1


class ResearchRepository:
    """In-memory, read-only repository managing the validated NASA OSDR research catalogue."""

    def __init__(
        self,
        catalogue_path: Optional[Union[str, Path]] = None,
        auto_load: bool = True,
    ) -> None:
        self.catalogue_path: Path = resolve_catalogue_path(catalogue_path)
        self.is_available: bool = False
        self.unavailable_reason: Optional[str] = None
        self._studies: Dict[str, ResearchStudy] = {}
        self._ordered_accessions: List[str] = []
        self.last_catalogue_update: Optional[str] = None
        self.catalogue_version: Optional[str] = None

        if auto_load:
            self.load()

    def load(self) -> None:
        """Load and strictly validate all research records from the curated catalogue.
        
        If the file does not exist, the repository enters an explicit unavailable state
        without failing application startup.
        If the file exists but is malformed or invalid, raises ResearchCatalogueCorruptException loudly.
        """
        if not self.catalogue_path.exists() or not self.catalogue_path.is_file():
            self.is_available = False
            self.unavailable_reason = (
                f"NASA OSDR research catalogue is unavailable: file not found at '{self.catalogue_path}'."
            )
            self._studies = {}
            self._ordered_accessions = []
            return

        try:
            with open(self.catalogue_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
        except json.JSONDecodeError as err:
            raise ResearchCatalogueCorruptException(
                message=f"Failed to parse research catalogue JSON at '{self.catalogue_path}': {err.msg} (line {err.lineno})",
                details={"line": err.lineno, "col": err.colno, "error": str(err)},
            ) from err
        except Exception as err:
            raise ResearchCatalogueCorruptException(
                message=f"Failed to read research catalogue file at '{self.catalogue_path}': {err}",
                details={"error": str(err)},
            ) from err

        if not isinstance(raw_data, dict):
            raise ResearchCatalogueCorruptException(
                message="Research catalogue root must be a JSON object containing a 'studies' array.",
                details={"actual_type": type(raw_data).__name__},
            )

        studies_list = raw_data.get("studies")
        if studies_list is None or not isinstance(studies_list, list):
            raise ResearchCatalogueCorruptException(
                message="Research catalogue JSON is missing a valid 'studies' array.",
                details={"keys": list(raw_data.keys())},
            )

        self.catalogue_version = raw_data.get("catalogue_version", "1.0.0")
        self.last_catalogue_update = raw_data.get("generated_at")

        loaded_studies: Dict[str, ResearchStudy] = {}
        ordered_accessions: List[str] = []
        seen_accessions = set()

        for idx, study_data in enumerate(studies_list):
            if not isinstance(study_data, dict):
                raise ResearchCatalogueCorruptException(
                    message=f"Study at index {idx} must be a JSON object.",
                    details={"index": idx, "actual_type": type(study_data).__name__},
                )

            raw_accession = study_data.get("accession")
            if not raw_accession or not isinstance(raw_accession, str):
                raise ResearchCatalogueCorruptException(
                    message=f"Study at index {idx} is missing a valid 'accession' string.",
                    details={"index": idx},
                )

            clean_accession = raw_accession.strip().upper()
            if clean_accession in seen_accessions:
                raise ResearchCatalogueCorruptException(
                    message=f"Duplicate accession '{clean_accession}' detected in research catalogue at index {idx}.",
                    details={"accession": clean_accession, "index": idx},
                )

            seen_accessions.add(clean_accession)

            try:
                study_model = ResearchStudy.model_validate(study_data)
            except Exception as err:
                raise ResearchCatalogueCorruptException(
                    message=f"Validation failed for study accession '{clean_accession}': {err}",
                    details={"accession": clean_accession, "error": str(err)},
                ) from err

            loaded_studies[study_model.accession] = study_model
            ordered_accessions.append(study_model.accession)

        # Deterministic ordering by accession
        ordered_accessions.sort()

        self._studies = loaded_studies
        self._ordered_accessions = ordered_accessions
        self.is_available = True
        self.unavailable_reason = None

    def ensure_available(self) -> None:
        """Verify the research catalogue is loaded and available; raise 503 exception otherwise."""
        if not self.is_available:
            raise ResearchCatalogueUnavailableException(
                message=self.unavailable_reason or "NASA OSDR research catalogue is currently unavailable."
            )

    def list_studies(
        self,
        body_system: Optional[str] = None,
        evidence_category: Optional[EvidenceCategory] = None,
        relevance: Optional[ResearchRelevance] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[ResearchStudy], int]:
        """Retrieve paginated and filtered research studies with deterministic ordering."""
        self.ensure_available()

        matched: List[ResearchStudy] = []
        search_term = search.strip().lower() if search else None
        target_body_system = body_system.strip().lower() if body_system else None

        for accession in self._ordered_accessions:
            study = self._studies[accession]

            if evidence_category and study.evidence_category != evidence_category:
                continue

            if relevance and study.relevance != relevance:
                continue

            if target_body_system:
                if not any(bs.lower() == target_body_system for bs in study.body_systems):
                    continue

            if search_term:
                term_in_accession = search_term in study.accession.lower()
                term_in_title = search_term in study.title.lower()
                term_in_desc = search_term in study.description.lower()
                term_in_organism = search_term in study.organism.lower()
                term_in_context = search_term in study.mission_context.lower()
                term_in_body_systems = any(search_term in bs.lower() for bs in study.body_systems)
                term_in_assays = any(search_term in at.lower() for at in study.assay_types)

                if not (
                    term_in_accession
                    or term_in_title
                    or term_in_desc
                    or term_in_organism
                    or term_in_context
                    or term_in_body_systems
                    or term_in_assays
                ):
                    continue

            matched.append(study)

        total_matching = len(matched)
        sliced = matched[offset : offset + limit]
        return sliced, total_matching

    def get_study_by_accession(self, accession: str) -> ResearchStudy:
        """Retrieve an individual study by unique accession identifier."""
        self.ensure_available()
        clean_acc = accession.strip().upper()
        if clean_acc not in self._studies:
            raise ResearchStudyNotFoundException(accession=clean_acc)
        return self._studies[clean_acc]

    def get_summary(self) -> Dict[str, Any]:
        """Compute aggregated portfolio statistics across all curated studies."""
        self.ensure_available()

        cat_counts: Dict[str, int] = {cat.value: 0 for cat in EvidenceCategory}
        rel_counts: Dict[str, int] = {rel.value: 0 for rel in ResearchRelevance}
        system_counts: Dict[str, int] = {}

        for study in self._studies.values():
            cat_counts[study.evidence_category.value] = cat_counts.get(study.evidence_category.value, 0) + 1
            rel_counts[study.relevance.value] = rel_counts.get(study.relevance.value, 0) + 1
            for bs in study.body_systems:
                norm_bs = bs.strip().lower()
                system_counts[norm_bs] = system_counts.get(norm_bs, 0) + 1

        return {
            "total_studies": len(self._studies),
            "counts_by_evidence_category": cat_counts,
            "counts_by_body_system": system_counts,
            "counts_by_relevance": rel_counts,
            "last_catalogue_update": self.last_catalogue_update,
        }


# Singleton instance and FastAPI dependency injection provider
_research_repo_instance: Optional[ResearchRepository] = None


def get_research_repository() -> ResearchRepository:
    """FastAPI dependency for accessing the ResearchRepository singleton."""
    global _research_repo_instance
    if _research_repo_instance is None:
        _research_repo_instance = ResearchRepository()
    return _research_repo_instance


def set_research_repository(repo: Optional[ResearchRepository]) -> None:
    """Helper to set or reset the research repository singleton (e.g. for testing)."""
    global _research_repo_instance
    _research_repo_instance = repo
