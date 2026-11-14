import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Filter,
  Search,
  RefreshCw,
  Info,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { MeasurementCatalogResponse } from '../../types/catalog';
import { apiClient } from '../../services/apiClient';
import { formatMetricCategory, formatOperationalContext } from '../../utils/formatters';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface MeasurementCatalogViewProps {
  onSelectMetricToInspect?: (canonicalId: string) => void;
}

export const MeasurementCatalogView: React.FC<MeasurementCatalogViewProps> = ({
  onSelectMetricToInspect,
}) => {
  const [catalog, setCatalog] = useState<MeasurementCatalogResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; code: string; details?: unknown } | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchCatalog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getMeasurementCatalog();
      setCatalog(data);
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to retrieve canonical measurement catalog.',
        code: err.code || 'CATALOG_ERROR',
        details: err.details,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'cardiovascular', label: 'Cardiovascular' },
    { id: 'respiratory', label: 'Respiratory' },
    { id: 'thermal', label: 'Thermal Regulation' },
    { id: 'sleep', label: 'Sleep & Circadian' },
    { id: 'environmental', label: 'Environmental' },
  ];

  const filteredMetrics = useMemo(() => {
    if (!catalog?.metrics) return [];
    return catalog.metrics.filter((m) => {
      const matchCategory = selectedCategory === 'all' || m.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.canonical_identifier.toLowerCase().includes(q) ||
        m.display_name.toLowerCase().includes(q) ||
        m.accepted_aliases.some((a) => a.toLowerCase().includes(q)) ||
        m.description.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [catalog, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Status Banner */}
      <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-telemetry-cyan" />
              <h2 className="font-mono text-base font-bold uppercase tracking-wider text-space-100">
                Authoritative Measurement Catalog & Context Taxonomy
              </h2>
              <span className="rounded bg-telemetry-cyan/15 px-2 py-0.5 font-mono text-[10px] text-telemetry-cyan border border-telemetry-cyan/30">
                PHASE 2A FOUNDATION
              </span>
            </div>
            <p className="font-mono text-xs text-space-400 mt-1.5 leading-relaxed">
              Standardized dictionary of spaceflight physiological metrics, alias mappings, accepted units, physical sanity check ranges, and operational context rules.
            </p>
          </div>

          <button
            onClick={fetchCatalog}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 transition-colors shrink-0 self-start md:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-telemetry-cyan' : ''}`} />
            <span>Reload Catalog</span>
          </button>
        </div>

        {/* Scientific Ingestion Boundaries Disclaimer */}
        <div className="mt-4 p-3.5 rounded bg-space-900/80 border border-telemetry-amber/30 text-xs font-mono flex items-start gap-3">
          <Info className="h-4 w-4 text-telemetry-amber shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-telemetry-amber font-bold text-[11px] uppercase tracking-wider block">
              Validation Boundary Disclaimer
            </span>
            <p className="text-[11px] text-space-300 leading-relaxed">
              The physical sanity ranges defined in this catalog (<code className="text-telemetry-cyan">valid_range_min</code> – <code className="text-telemetry-cyan">valid_range_max</code>) are strictly for telemetry ingestion filtering and boundary sanity validation. They do <strong>NOT</strong> represent clinical diagnostic thresholds, aeromedical certification limits, or flight rule violation alarms.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-space-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search canonical metric, alias, or description..."
              className="w-full pl-9 pr-3 py-2 rounded bg-space-900 border border-space-700 font-mono text-xs text-space-100 placeholder-space-500 focus:outline-none focus:border-telemetry-cyan transition-colors"
            />
          </div>

          {/* Result Count Indicator */}
          <div className="font-mono text-xs text-space-400 flex items-center gap-1.5 shrink-0 px-2">
            <span>Showing:</span>
            <span className="font-bold text-telemetry-cyan">{filteredMetrics.length}</span>
            <span>of {catalog?.metrics.length || 0} canonical metrics</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-space-800">
          <span className="font-mono text-[10px] text-space-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Categories:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded font-mono text-xs transition-colors border ${
                  isSelected
                    ? 'bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan font-semibold'
                    : 'bg-space-900 hover:bg-space-800 border-space-700/80 text-space-300'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && <LoadingSpinner label="Querying Canonical Measurement Catalog..." size="lg" />}

      {error && !isLoading && (
        <ErrorMessage
          title={`Catalog Retrieval Error [${error.code}]`}
          message={error.message}
          details={error.details ? JSON.stringify(error.details, null, 2) : undefined}
          onRetry={fetchCatalog}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredMetrics.length === 0 && (
        <div className="rounded-lg bg-space-850 p-12 text-center border border-space-700 font-mono space-y-3">
          <HelpCircle className="h-10 w-10 text-space-500 mx-auto" />
          <h3 className="text-sm font-bold text-space-200 uppercase">No Matching Catalog Metrics Found</h3>
          <p className="text-xs text-space-400 max-w-md mx-auto">
            No canonical measurement definitions match your filter &ldquo;{searchQuery}&rdquo;. Try clearing filters or searching for alternative terms.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 rounded bg-space-800 hover:bg-space-750 text-xs text-space-200 border border-space-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      {!isLoading && !error && filteredMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMetrics.map((metric) => {
            const catBadge = formatMetricCategory(metric.category);

            return (
              <div
                key={metric.canonical_identifier}
                className="rounded-lg bg-space-850 p-5 border border-space-750 shadow-hud-card hover:border-space-600 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3 font-mono">
                  {/* Top Row: Canonical ID & Category */}
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-space-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-space-100">
                          {metric.display_name}
                        </span>
                        {metric.is_derived && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            DERIVED
                          </span>
                        )}
                        {metric.strict_site_matching && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30" title="Strict Anatomical Site Matching Mandatory">
                            STRICT SITE
                          </span>
                        )}
                      </div>
                      <code className="text-xs text-telemetry-cyan block mt-0.5">
                        {metric.canonical_identifier}
                      </code>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${catBadge.badgeClass}`}>
                      {catBadge.label}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-space-300 leading-relaxed">
                    {metric.description}
                  </p>

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded bg-space-900 border border-space-800">
                      <span className="text-space-500 block text-[10px]">STANDARD UNIT:</span>
                      <span className="text-space-200 font-bold">{metric.standard_unit}</span>
                      {metric.accepted_units.length > 1 && (
                        <div className="text-[10px] text-space-400 mt-0.5 truncate" title={`Accepted: ${metric.accepted_units.join(', ')}`}>
                          Converts: {metric.accepted_units.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="p-2 rounded bg-space-900 border border-space-800">
                      <span className="text-space-500 block text-[10px]">SANITY BOUNDS:</span>
                      <span className="text-telemetry-amber font-bold">
                        {metric.valid_range_min} – {metric.valid_range_max} {metric.standard_unit}
                      </span>
                      <div className="text-[10px] text-space-500 mt-0.5">Physical boundary guard</div>
                    </div>
                  </div>

                  {/* Aliases & Hardware */}
                  <div className="space-y-1.5 text-xs pt-1">
                    {metric.accepted_aliases.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-space-500 shrink-0">Accepted Aliases:</span>
                        <div className="flex flex-wrap gap-1">
                          {metric.accepted_aliases.map((alias) => (
                            <code key={alias} className="px-1.5 py-0.5 rounded bg-space-800 text-space-300 text-[10px]">
                              {alias}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}

                    {metric.hardware_examples.length > 0 && (
                      <div className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-space-500 shrink-0">Hardware Examples:</span>
                        <span className="text-space-400 truncate">
                          {metric.hardware_examples.join('; ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Applicable Contexts */}
                  {metric.applicable_contexts.length > 0 && (
                    <div className="pt-2 border-t border-space-800 text-[11px]">
                      <span className="text-space-500 block mb-1">Applicable Contexts:</span>
                      <div className="flex flex-wrap gap-1">
                        {metric.applicable_contexts.map((ctx) => {
                          const formatted = formatOperationalContext(ctx);
                          return (
                            <span key={ctx} className={`px-1.5 py-0.5 rounded text-[9px] border ${formatted.badgeClass}`}>
                              {formatted.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Inspect Action */}
                {onSelectMetricToInspect && (
                  <div className="pt-3 border-t border-space-800">
                    <button
                      onClick={() => onSelectMetricToInspect(metric.canonical_identifier)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-space-800 hover:bg-space-750 text-xs font-mono text-telemetry-cyan border border-space-700 hover:border-telemetry-cyan/60 transition-colors"
                    >
                      <Activity className="h-3.5 w-3.5" />
                      <span>Explore In Telemetry Stream</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Context Taxonomy Overview Footer */}
      {catalog?.contexts && (
        <div className="rounded-lg bg-space-850 p-5 border border-space-750 font-mono text-xs space-y-3">
          <div className="flex items-center gap-2 text-space-200">
            <Layers className="h-4 w-4 text-telemetry-cyan" />
            <h4 className="font-bold uppercase tracking-wider">
              Context Taxonomy & Comparability Rules Overview
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3 rounded bg-space-900 border border-space-800">
              <span className="text-telemetry-emerald font-bold text-xs uppercase block mb-1">
                Tier A: Baseline-Eligible
              </span>
              <p className="text-[11px] text-space-400 mb-2">
                Stable physiological states suitable for computing personal intra-individual operational envelopes.
              </p>
              <div className="flex flex-wrap gap-1">
                {catalog.contexts.baseline_eligible.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded bg-space-800 text-space-300 text-[10px]">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded bg-space-900 border border-space-800">
              <span className="text-purple-400 font-bold text-xs uppercase block mb-1">
                Tier B: Operational Tracking
              </span>
              <p className="text-[11px] text-space-400 mb-2">
                High-strain environments monitored live, but isolated from shirt-sleeve habitat baselines.
              </p>
              <div className="flex flex-wrap gap-1">
                {catalog.contexts.operational_tracking.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded bg-space-800 text-space-300 text-[10px]">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded bg-space-900 border border-space-800">
              <span className="text-space-400 font-bold text-xs uppercase block mb-1">
                Tier C: Excluded Ingestion
              </span>
              <p className="text-[11px] text-space-400 mb-2">
                Catch-all contexts rejected from baseline pooling to guarantee data hygiene.
              </p>
              <div className="flex flex-wrap gap-1">
                {catalog.contexts.excluded.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded bg-space-800 text-space-400 text-[10px]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
