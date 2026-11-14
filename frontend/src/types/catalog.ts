/**
 * Authoritative Measurement Catalog Types matching backend/app/catalog/
 */

export type MetricCategory =
  | 'cardiovascular'
  | 'respiratory'
  | 'thermal'
  | 'sleep'
  | 'environmental';

export type OperationalContext =
  | 'resting_cabin'
  | 'sleep_cycle'
  | 'exercise_active'
  | 'exercise_recovery'
  | 'eva_operational'
  | 'unknown'
  | 'other';

export type ExerciseModalityType =
  | 'ared_resistive'
  | 'cevis_aerobic'
  | 't2_treadmill'
  | 'other'
  | 'unknown';

export interface CatalogMetric {
  canonical_identifier: string;
  display_name: string;
  category: MetricCategory;
  standard_unit: string;
  accepted_aliases: string[];
  accepted_units: string[];
  valid_range_min: number;
  valid_range_max: number;
  is_derived: boolean;
  applicable_contexts: string[];
  hardware_examples: string[];
  description: string;
  strict_site_matching: boolean;
}

export interface CatalogContexts {
  baseline_eligible: string[];
  operational_tracking: string[];
  excluded: string[];
}

export interface MeasurementCatalogResponse {
  metrics: CatalogMetric[];
  contexts: CatalogContexts;
  exercise_modalities: string[];
}
