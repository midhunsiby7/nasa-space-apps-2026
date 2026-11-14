# COSMOLOOKUP — NASA OSDR Research Integration & API Contract

> **Project:** COSMOLOOKUP (NASA Space Apps Challenge 2026)  
> **Status:** Implemented (Offline-First Curated Catalogue)  
> **Base URL:** `/api/v1/research`  
> **Authority Source:** [NASA Open Science Data Repository (OSDR)](https://osdr.nasa.gov/bio/repo)  
> **Official Biological API Documentation:** [NASA OSDR Biological Data API](https://visualization.osdr.nasa.gov/biodata/api/)  
> **Last Updated:** 2026-11-14  

---

## 1. Executive Architecture Overview

COSMOLOOKUP bridges operational astronaut health monitoring with authoritative empirical space biology research from the **NASA Open Science Data Repository (OSDR)**. 

### Core Design Principles
1. **Offline-First Resilience:** In deep space exploration, continuous broadband internet connectivity to Earth servers is impossible. The core research integration operates entirely offline using a strictly validated, curated JSON catalogue stored locally at `data/research/osdr_curated_catalogue.json`.
2. **Absolute Scientific Safety Boundary:** Empirical spaceflight research data (e.g. genomic sequencing, cytokine arrays, tissue chip assays) is completely decoupled from operational astronaut telemetry. Research records:
   - Do **not** create foreign keys or relational joins with the operational `measurement` database.
   - Do **not** enter time-series telemetry streams or baseline calculation envelopes.
   - Are explicitly flagged with `is_synthetic: false` to ensure total provenance transparency.
3. **Graceful Degradation:** If the optional research catalogue file is missing during development, the existing COSMOLOOKUP application starts up without failure. Research endpoints return an explicit HTTP 503 (`RESEARCH_CATALOGUE_UNAVAILABLE`) status, preserving all operational telemetry, baselines, and alerts.
4. **Strict Schema Validation:** If the catalogue file exists, every study is validated against strict Pydantic v2 schemas (`extra="forbid"`), rejecting malformed records, invalid enum values, or duplicate accession numbers loudly.

---

## 2. Scientific Evidence Classification & Dimensions

The research schema enforces strict separation between scientific dimensions:

### 2.1 Evidence Category (`evidence_category`)
Describes the scientific origin and model system of the study:
- `HUMAN_SPACEFLIGHT`: Data derived directly from human astronauts during or following spaceflight (e.g., Inspiration4, Axiom-1, ISS missions).
- `HUMAN_GROUND_ANALOG`: Data from terrestrial human simulation analogs (e.g., Head-Down Tilt Bed Rest, HERA isolation).
- `ANIMAL_MODEL`: Spaceflight or terrestrial analog animal research (e.g., ISS Rodent Research missions, NSRL GCR simulations).
- `CELL_OR_TISSUE_MODEL`: In vitro cell culture or 3D microphysiological systems (e.g., human muscle tissue chips, primary T-cell activation).
- `OTHER`: Environmental surveys, hardware validation, or multi-model syntheses.

> **Note:** Assay types (such as RNA-Seq, metabolomics, or cytokine arrays) are tracked separately from `evidence_category`.

### 2.2 Operational Relevance (`relevance`)
Classifies the translational relevance to deep-space astronaut health monitoring:
- `HIGH`: Direct translational impact on human spaceflight physiological adaptation, countermeasures, or mission safety.
- `MODERATE`: Indirect or mechanistic insight supporting aerospace biomedical understanding.
- `LOW`: Fundamental biological or exploratory research with limited immediate clinical application.

### 2.3 Orthogonal Dimensions
- `assay_types`: List of laboratory assay methodologies (e.g., `["RNA-Seq transcriptomics", "Multiplex cytokine array"]`).
- `body_systems`: List of physiological target systems (e.g., `["cardiovascular", "immune", "musculoskeletal"]`).
- `data_formats`: List of repository data formats available (e.g., `["FASTQ", "tabular CSV", "CEL"]`).

---

## 3. Curated NASA OSDR Research Catalogue

The platform is initialized with 15 verified, authentic NASA OSDR studies across six critical spaceflight domains:

| Accession | Official Title | Evidence Category | Relevance | Primary Body Systems | Organism |
|---|---|---|---|---|---|
| **OSD-575** | SpaceX Inspiration4 Blood Serum Metabolic Panel and Cytokine Arrays | `HUMAN_SPACEFLIGHT` | `HIGH` | Cardiovascular, Immune, Metabolic | *Homo sapiens* |
| **OSD-570** | SpaceX Inspiration4 PBMC Profiling: Single-Cell RNA-seq & Repertoires | `HUMAN_SPACEFLIGHT` | `HIGH` | Immune, Hematologic | *Homo sapiens* |
| **OSD-195** | Effects of 21 Days of Bed Rest on Human Skeletal Muscle Gene Expression | `HUMAN_GROUND_ANALOG` | `HIGH` | Musculoskeletal | *Homo sapiens* |
| **OSD-51** | Woman Skeletal Muscle Transcriptome with Bed Rest & Countermeasures | `HUMAN_GROUND_ANALOG` | `MODERATE` | Musculoskeletal, Metabolic | *Homo sapiens* |
| **OSD-684** | Human Skeletal Muscle Tissue Chip Autonomous Payload on the ISS | `CELL_OR_TISSUE_MODEL` | `HIGH` | Musculoskeletal | *Homo sapiens* |
| **OSD-635** | Spaceflight Effects on Human Vascular Smooth Muscle Cell Phenotype | `CELL_OR_TISSUE_MODEL` | `MODERATE` | Cardiovascular | *Homo sapiens* |
| **OSD-13** | T-Cell Activation in Microgravity Compared to 1g Gravity | `CELL_OR_TISSUE_MODEL` | `HIGH` | Immune | *Homo sapiens* |
| **OSD-599** | Rodent Research-12: In Vivo Cardiac Transcriptomics After Spaceflight | `ANIMAL_MODEL` | `HIGH` | Cardiovascular | *Mus musculus* |
| **OSD-342** | Targeting Myostatin/Activin A Protects Against Musculoskeletal Loss | `ANIMAL_MODEL` | `HIGH` | Musculoskeletal | *Mus musculus* |
| **OSD-254** | Rodent Research-7: Space Environment Impact on Microbiota & Circadian Clock | `ANIMAL_MODEL` | `HIGH` | Sleep/Circadian, Digestive | *Mus musculus* |
| **OSD-63** | Behavioral Changes and Circadian Timing in Rats Exposed to Microgravity | `ANIMAL_MODEL` | `MODERATE` | Sleep/Circadian, Neurological | *Rattus norvegicus* |
| **OSD-618** | Cumulative Impacts of Deep-Space Radiation, Confinement, & Altered Gravity | `ANIMAL_MODEL` | `HIGH` | Behavioral, Neurological, Radiation | *Mus musculus* |
| **OSD-1018**| Differential Impact of Social Isolation & Space Radiation on Behavior | `ANIMAL_MODEL` | `MODERATE` | Behavioral, Neurological | *Rattus norvegicus* |
| **OSD-984** | Biological Responses Following Simulated GCR Exposure & Microgravity | `ANIMAL_MODEL` | `HIGH` | Radiation, Hematologic | *Mus musculus* |
| **OSD-479** | Deep Space Radiation Impacts on Cognitive Performance & Microglial Activation | `ANIMAL_MODEL` | `HIGH` | Radiation, Neurological | *Mus musculus* |

---

## 4. API Endpoints Specification

### 4.1 List Research Studies

Retrieves a paginated collection of curated NASA OSDR studies with multi-dimensional filtering.

- **Method:** `GET`
- **Route:** `/api/v1/research/studies`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `body_system` | `string` | No | `null` | Filter studies by target physiological system (e.g. `cardiovascular`). |
| `evidence_category` | `string` | No | `null` | Filter by evidence category (`HUMAN_SPACEFLIGHT`, `HUMAN_GROUND_ANALOG`, `ANIMAL_MODEL`, `CELL_OR_TISSUE_MODEL`, `OTHER`). |
| `relevance` | `string` | No | `null` | Filter by operational relevance (`HIGH`, `MODERATE`, `LOW`). |
| `search` | `string` | No | `null` | Case-insensitive substring search across accession, title, description, and keywords. |
| `limit` | `integer` | No | `50` | Maximum number of records to return (min: `1`, max: `100`). |
| `offset` | `integer` | No | `0` | Number of records to skip for pagination (min: `0`). |

#### Response: `200 OK`

```json
{
  "data": [
    {
      "accession": "OSD-575",
      "title": "SpaceX Inspiration4 Blood Serum Metabolic Panel and Immune/Cardiac Cytokine Arrays",
      "description": "Comprehensive metabolic panel and multiplex cytokine/chemokine profiling from four commercial astronauts aboard the Inspiration4 mission...",
      "evidence_category": "HUMAN_SPACEFLIGHT",
      "relevance": "HIGH",
      "assay_types": [
        "Multiplex cytokine array",
        "Comprehensive metabolic panel",
        "Protein mass spectrometry"
      ],
      "body_systems": [
        "cardiovascular",
        "immune",
        "metabolic"
      ],
      "data_formats": [
        "tabular CSV",
        "JSON",
        "PDF"
      ],
      "organism": "Homo sapiens",
      "mission_context": "Inspiration4 Commercial Crew Mission (Crew Dragon Resilience, 3 days LEO)",
      "measurements_summary": "Plasma cytokines (IL-6, TNF-alpha, VEGF), electrolytes, BUN, creatinine, troponin, and hsCRP.",
      "sample_count": 24,
      "publication_citation": "Beheshti, A., Mason, C. E., et al. (2024). Nature, 632, 1158-1172.",
      "official_url": "https://osdr.nasa.gov/bio/repo/data/studies/OSD-575",
      "is_synthetic": false,
      "created_at": "2024-06-11T16:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### 4.2 Get Study by Accession

Retrieves complete scientific details for an individual NASA research study.

- **Method:** `GET`
- **Route:** `/api/v1/research/studies/{accession}`

#### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `accession` | `string` | Yes | Unique repository accession identifier (e.g. `OSD-575`). |

#### Response: `200 OK`
Returns the `ResearchStudyResponse` object.

#### Response: `404 Not Found`

```json
{
  "error": {
    "code": "RESEARCH_STUDY_NOT_FOUND",
    "message": "Research study with accession 'OSD-9999' not found in catalogue.",
    "details": {
      "accession": "OSD-9999"
    }
  }
}
```

---

### 4.3 Research Catalogue Summary

Retrieves portfolio aggregate metrics across the curated catalogue.

- **Method:** `GET`
- **Route:** `/api/v1/research/summary`

#### Response: `200 OK`

```json
{
  "total_studies": 15,
  "counts_by_evidence_category": {
    "HUMAN_SPACEFLIGHT": 2,
    "HUMAN_GROUND_ANALOG": 2,
    "ANIMAL_MODEL": 8,
    "CELL_OR_TISSUE_MODEL": 3,
    "OTHER": 0
  },
  "counts_by_body_system": {
    "cardiovascular": 3,
    "immune": 3,
    "metabolic": 2,
    "hematologic": 2,
    "musculoskeletal": 4,
    "sleep_circadian": 2,
    "digestive": 1,
    "neurological": 4,
    "behavioral": 3,
    "radiation": 3
  },
  "counts_by_relevance": {
    "HIGH": 11,
    "MODERATE": 4,
    "LOW": 0
  },
  "last_catalogue_update": "2026-11-14T22:30:00Z"
}
```

---

### 4.4 Service Unavailable Handling (Missing Catalogue)

If `data/research/osdr_curated_catalogue.json` is missing during development:

#### Response: `503 Service Unavailable`

```json
{
  "error": {
    "code": "RESEARCH_CATALOGUE_UNAVAILABLE",
    "message": "NASA OSDR research catalogue is unavailable: file not found at '.../data/research/osdr_curated_catalogue.json'.",
    "details": null
  }
}
```

---

## 5. Future Live NASA API Integration Scope

COSMOLOOKUP's initial implementation is intentionally offline-first, requiring zero runtime internet connectivity and introducing no external network failure modes.

### Future Live Refresh Design Specification
When network connectivity to NASA servers is enabled in future mission phases, the platform will interface with the official **NASA Biological Data API**:
- **Official Documentation:** `https://visualization.osdr.nasa.gov/biodata/api/`
- **API Base URL:** `https://visualization.osdr.nasa.gov/biodata/api/v2/`
- **Study Listing Endpoint:** `GET /biodata/api/v2/dataset/`
- **Targeted Study Detail:** `GET /biodata/api/v2/dataset/{accession}/`
- **Assay Drill-Down:** `GET /biodata/api/v2/dataset/{accession}/assay/{assay_id}/`

### Architectural Integration Rules for Future Live Sync:
1. **Asynchronous Background Ingestion:** Live updates must occur via an offline-safe background task or build-step crawler. Never block live FastAPI request threads with external HTTP calls.
2. **Local Schema Gate:** Live API responses must pass through `ResearchStudy.model_validate()` before persisting into local storage. Malformed external records must be isolated to an quarantine buffer without corrupting the operational catalogue.
3. **Telemetry Boundary Preservation:** Future live omics or environmental records must strictly remain in the research repository tier and never bleed into astronaut vital telemetry tables.
