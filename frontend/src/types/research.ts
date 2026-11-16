/**
 * COSMOLOOKUP — NASA OSDR Research Studies & Evidence Classification Types
 * Reflects backend Pydantic v2 schemas from app/schemas/research.py
 */

export type EvidenceCategory =
  | 'HUMAN_SPACEFLIGHT'
  | 'HUMAN_GROUND_ANALOG'
  | 'ANIMAL_MODEL'
  | 'CELL_OR_TISSUE_MODEL'
  | 'OTHER';

export type ResearchRelevance = 'HIGH' | 'MODERATE' | 'LOW';

export interface ResearchStudy {
  accession: string;
  title: string;
  description: string;
  evidence_category: EvidenceCategory;
  relevance: ResearchRelevance;
  assay_types: string[];
  body_systems: string[];
  data_formats: string[];
  organism: string;
  mission_context: string;
  measurements_summary: string;
  sample_count?: number | null;
  publication_citation?: string | null;
  official_url?: string | null;
  is_synthetic: boolean;
  provenance_type: string;
  limitations?: string | null;
  created_at?: string | null;
}

export type ResearchStudyResponse = ResearchStudy;

export interface ResearchStudyListResponse {
  data: ResearchStudy[];
  total: number;
  limit: number;
  offset: number;
}

export interface ResearchSummaryResponse {
  total_studies: number;
  counts_by_evidence_category: Record<string, number>;
  counts_by_body_system: Record<string, number>;
  counts_by_relevance: Record<string, number>;
  last_catalogue_update?: string | null;
}

export interface ListResearchStudiesParams {
  body_system?: string;
  evidence_category?: EvidenceCategory | string;
  relevance?: ResearchRelevance | string;
  search?: string;
  limit?: number;
  offset?: number;
}
