import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  RefreshCw,
  Search,
  Activity,
  Info,
  X,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { TrendObservation, TelemetryFreshnessResponse, TrendDirection } from '../../types/trend';
import { BaselineResponse } from '../../types/baseline';
import { MeasurementType } from '../../types/measurement';
import { apiClient } from '../../services/apiClient';
import { TrendTrajectoryCard } from './TrendTrajectoryCard';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface TrendObservatoryProps {
  astronaut: Astronaut | null;
  trends: TrendObservation[];
  freshness: TelemetryFreshnessResponse | null;
  baselines: BaselineResponse[];
  selectedMetric: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  onNavigateToTelemetry: (metric: MeasurementType) => void;
  onNavigateToBaselines: (metric: MeasurementType) => void;
  onRefresh: () => void;
}

export const TrendObservatory: React.FC<TrendObservatoryProps> = ({
  astronaut,
  trends,
  freshness,
  baselines,
  selectedMetric,
  onSelectMetric,
  onNavigateToTelemetry,
  onNavigateToBaselines,
  onRefresh,
}) => {
  const [contextFilter, setContextFilter] = useState<string>('resting_cabin');
  const [directionFilter, setDirectionFilter] = useState<'all' | TrendDirection>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectorMetric, setInspectorMetric] = useState<TrendObservation | null>(null);
  const [isLoadingInspector, setIsLoadingInspector] = useState<boolean>(false);
  const [inspectorError, setInspectorError] = useState<string | null>(null);

  // Filter trends
  const filteredTrends = trends.filter((t) => {
    if (contextFilter !== 'all' && t.context !== contextFilter) return false;
    if (directionFilter !== 'all' && t.trend_direction !== directionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchType = t.measurement_type.toLowerCase().includes(q);
      const matchExpl = t.explanation?.toLowerCase().includes(q);
      if (!matchType && !matchExpl) return false;
    }
    return true;
  });

  const handleOpenInspector = async (trend: TrendObservation) => {
    setInspectorMetric(trend);
    setInspectorError(null);
    if (!astronaut) return;

    setIsLoadingInspector(true);
    try {
      const detailed = await apiClient.getMetricTrend(astronaut.id, trend.measurement_type, {
        context: trend.context,
        exercise_modality: trend.exercise_modality || undefined,
      });
      setInspectorMetric(detailed);
    } catch (err: any) {
      console.warn('Using existing trend observation for drilldown:', err?.message);
      setInspectorError(err?.message || 'Failed to retrieve detailed metric trajectory.');
    } finally {
      setIsLoadingInspector(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Toolbar */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-telemetry-cyan/10 border border-telemetry-cyan/30 text-telemetry-cyan">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-mono text-base font-bold uppercase tracking-wider text-space-100">
                Intra-Individual Trend Observatory
              </h2>
              <p className="font-mono text-xs text-space-400 mt-0.5">
                Evaluates physiological shifts (active focus: {selectedMetric}) across {baselines.length} registered baseline models using Sen&apos;s slope (units per 24h).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-space-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter metrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-space-800 border border-space-700 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-space-200 placeholder-space-500 focus:outline-none focus:border-telemetry-cyan"
              />
            </div>

            {/* Context Partition Filter */}
            <select
              value={contextFilter}
              onChange={(e) => setContextFilter(e.target.value)}
              aria-label="Filter trends by physiological context"
              className="bg-space-800 border border-space-700 rounded px-2.5 py-1.5 text-xs font-mono text-space-200 focus:outline-none focus:border-telemetry-cyan"
            >
              <option value="all">All Contexts</option>
              <option value="resting_cabin">Resting Cabin</option>
              <option value="exercise_active">Exercise Active</option>
              <option value="exercise_recovery">Exercise Recovery</option>
              <option value="sleep_cycle">Sleep Cycle</option>
            </select>

            {/* Direction Filter */}
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as 'all' | TrendDirection)}
              aria-label="Filter trends by trajectory direction"
              className="bg-space-800 border border-space-700 rounded px-2.5 py-1.5 text-xs font-mono text-space-200 focus:outline-none focus:border-telemetry-cyan"
            >
              <option value="all">All Trajectories</option>
              <option value="stable">Stable</option>
              <option value="increasing">Increasing</option>
              <option value="decreasing">Decreasing</option>
              <option value="sustained_deviation">Sustained Deviation</option>
              <option value="insufficient_data">Insufficient Data</option>
            </select>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              className="p-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-space-300 hover:text-space-100 transition-colors"
              title="Refresh Trends"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Freshness Status Banner */}
      {freshness && (
        <div className="rounded-lg bg-space-900 border border-space-800 p-4 shadow-hud-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-telemetry-cyan" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-space-200">
                Telemetry Currency Matrix ({freshness.total_metrics} Channels)
              </h3>
            </div>
            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
              freshness.stale_count > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {freshness.stale_count > 0 ? `${freshness.stale_count} CHANNELS STALE` : 'ALL CHANNELS FRESH'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {freshness.items.map((item) => (
              <div
                key={item.measurement_type}
                className="p-2.5 rounded bg-space-850 border border-space-800 text-xs font-mono flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-space-200 capitalize truncate">
                    {item.measurement_type.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      item.status === 'fresh'
                        ? 'bg-emerald-400 animate-pulse'
                        : item.status === 'stale'
                        ? 'bg-amber-400'
                        : 'bg-space-600'
                    }`}
                  />
                </div>
                <div className="mt-2 text-[10px] text-space-400 flex items-center justify-between">
                  <span>
                    {item.hours_since_last !== null && item.hours_since_last !== undefined
                      ? `${item.hours_since_last.toFixed(1)}h ago`
                      : 'No rec'}
                  </span>
                  <span className="text-space-500">Exp: {item.expected_interval_hours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono text-space-400">
            Showing {filteredTrends.length} of {trends.length} evaluated telemetry trends
          </span>
          <span className="text-[11px] font-mono text-space-500">
            Click any metric to inspect detailed parameters & baseline envelopes
          </span>
        </div>

        {filteredTrends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrends.map((trend) => (
              <div
                key={`${trend.measurement_type}-${trend.context}`}
                onClick={() => handleOpenInspector(trend)}
                className="cursor-pointer"
              >
                <TrendTrajectoryCard trend={trend} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-space-850 border border-space-700/80 p-8 text-center font-mono text-xs text-space-400">
            No telemetry trends match the selected filters.
          </div>
        )}
      </div>

      {/* Metric Detail Drill-Down Modal */}
      {inspectorMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-sm animate-fade-in">
          <div className="rounded-lg bg-space-900 border border-space-700 p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-space-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-telemetry-cyan block">
                  Metric Trajectory Inspector
                </span>
                <h3 className="font-mono text-lg font-bold text-space-100 uppercase mt-0.5">
                  {inspectorMetric.measurement_type.replace(/_/g, ' ')}
                </h3>
                <span className="font-mono text-xs text-space-400">
                  Context: <strong className="text-space-200">{inspectorMetric.context}</strong>
                  {inspectorMetric.exercise_modality && ` • Modality: ${inspectorMetric.exercise_modality}`}
                </span>
              </div>
              <button
                onClick={() => setInspectorMetric(null)}
                className="rounded p-1 text-space-400 hover:bg-space-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingInspector ? (
              <LoadingSpinner label="Fetching single metric trajectory from API..." />
            ) : (
              <div className="space-y-4">
                {inspectorError && (
                  <div className="rounded bg-rose-500/15 border border-rose-500/40 p-2.5 text-xs font-mono text-rose-300">
                    ⚠️ {inspectorError}
                  </div>
                )}
                {/* Analytics Key Figures */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded bg-space-850 p-3 border border-space-800">
                    <span className="text-[10px] font-mono uppercase text-space-400 block">Latest Reading</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-mono font-bold text-space-100">
                        {inspectorMetric.current_value !== null && inspectorMetric.current_value !== undefined
                          ? inspectorMetric.current_value.toFixed(1)
                          : '—'}
                      </span>
                      <span className="text-[10px] font-mono text-space-400">{inspectorMetric.unit}</span>
                    </div>
                  </div>

                  <div className="rounded bg-space-850 p-3 border border-space-800">
                    <span className="text-[10px] font-mono uppercase text-space-400 block">Baseline Median</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-mono font-bold text-telemetry-cyan">
                        {inspectorMetric.baseline_median !== null && inspectorMetric.baseline_median !== undefined
                          ? inspectorMetric.baseline_median.toFixed(1)
                          : '—'}
                      </span>
                      <span className="text-[10px] font-mono text-space-400">{inspectorMetric.unit}</span>
                    </div>
                  </div>

                  <div className="rounded bg-space-850 p-3 border border-space-800">
                    <span className="text-[10px] font-mono uppercase text-space-400 block">Sen&apos;s Slope (24h)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-mono font-bold text-space-200">
                        {inspectorMetric.sens_slope !== null && inspectorMetric.sens_slope !== undefined
                          ? `${inspectorMetric.sens_slope > 0 ? '+' : ''}${inspectorMetric.sens_slope.toFixed(2)}`
                          : '—'}
                      </span>
                      <span className="text-[10px] font-mono text-space-400">{inspectorMetric.unit}/24h</span>
                    </div>
                  </div>

                  <div className="rounded bg-space-850 p-3 border border-space-800">
                    <span className="text-[10px] font-mono uppercase text-space-400 block">Robust Z-Score</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-xl font-mono font-bold ${
                        inspectorMetric.robust_z !== null && inspectorMetric.robust_z !== undefined && Math.abs(inspectorMetric.robust_z) > 1.5
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}>
                        {inspectorMetric.robust_z !== null && inspectorMetric.robust_z !== undefined
                          ? `${inspectorMetric.robust_z > 0 ? '+' : ''}${inspectorMetric.robust_z.toFixed(2)} σ`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistical Narrative */}
                <div className="rounded bg-space-850 p-4 border border-space-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-telemetry-cyan" />
                    <span className="font-mono text-xs font-bold text-space-200">Statistical Analysis Explanation</span>
                  </div>
                  <p className="font-mono text-xs text-space-300 leading-relaxed">
                    {inspectorMetric.explanation}
                  </p>
                </div>

                {/* Evidence Gating Details */}
                <div className="rounded bg-space-850 p-4 border border-space-800 space-y-2 text-xs font-mono">
                  <span className="font-bold text-space-200 block uppercase text-[11px]">
                    Evidence & Maturity Status
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-space-300 pt-1">
                    <div>
                      <span className="text-space-500">Evaluated Observations:</span>{' '}
                      <strong>{inspectorMetric.sample_count}</strong>
                    </div>
                    <div>
                      <span className="text-space-500">Baseline Maturity:</span>{' '}
                      <strong className="capitalize">{inspectorMetric.baseline_maturity || 'Not Registered'}</strong>
                    </div>
                    <div>
                      <span className="text-space-500">Consecutive Deviations:</span>{' '}
                      <strong>{inspectorMetric.consecutive_deviations}</strong>
                    </div>
                    <div>
                      <span className="text-space-500">Sustained Shift:</span>{' '}
                      <strong>{inspectorMetric.is_sustained ? 'Yes (Alert Raised)' : 'No'}</strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-space-800">
                  <button
                    onClick={() => {
                      onSelectMetric(inspectorMetric.measurement_type as MeasurementType);
                      onNavigateToTelemetry(inspectorMetric.measurement_type as MeasurementType);
                      setInspectorMetric(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200"
                  >
                    <Activity className="h-3.5 w-3.5 text-telemetry-cyan" />
                    <span>View Telemetry Stream</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectMetric(inspectorMetric.measurement_type as MeasurementType);
                      onNavigateToBaselines(inspectorMetric.measurement_type as MeasurementType);
                      setInspectorMetric(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-xs font-mono font-bold text-emerald-300"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Inspect Personal Baseline</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default TrendObservatory;
