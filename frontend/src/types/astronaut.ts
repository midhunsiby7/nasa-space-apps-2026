/**
 * Strict Astronaut Entity matching docs/api/API_CONTRACT.md and docs/architecture/DATABASE_SCHEMA.md
 */
export interface Astronaut {
  id: string;
  name: string;
  crew_role: string;
  mission_name: string;
  mission_day: number;
  created_at: string;
}

export interface AstronautListResponse {
  data: Astronaut[];
  total: number;
  limit: number;
  offset: number;
}
