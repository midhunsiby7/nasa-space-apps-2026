import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  Eye,
  Layers,
  Filter,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { TelemetryMetricCard } from './TelemetryMetricCard';
import { MissionDayScrubber } from './MissionDayScrubber';
import { TelemetryTimeSeriesChart } from '../charts/TelemetryTimeSeriesChart';
import { apiClient } from '../../services/apiClient';
import {
  formatTimestamp,
  formatDataQuality,
  formatProvenance,
  getMetricMeta,
} from '../../utils/formatters';

interface TelemetryStreamSectionProps {
  astronaut: Astronaut | null;
  measurements: Measurement[];
  availableMetrics: string[];
  selectedMetric: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  timeFilter: 'all' | '8h' | '24h';
  onTimeFilterChange: (filter: 'all' | '8h' | '24h') => void;
  onNavigateToBaselines?: (metric: MeasurementType) => void;
}

export const TelemetryStreamSection: React.FC<TelemetryStreamSectionProps> = ({
  astronaut,
  measurements,
  availableMetrics,
  selectedMetric,
  onSelectMetric,
  timeFilter,
  onTimeFilterChange,
  onNavigateToBaselines,
}) => {
  const [showRawTable, setShowRawTable] = useState(false);

  // Phase 3B Context & Modality Filters
  const [selectedContext, setSelectedContext] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Baseline overlay state
  const [baseline, setBaseline] = useState<BaselineResponse | null>(null);
  const [, setIsLoadingBaseline] = useState<boolean>(false);

  // Fetch baseline for this metric and context if available
  useEffect(() => {
    if (!astronaut) {
      setBaseline(null);
      return;
    }

    const loadBaseline = async () => {
      setIsLoadingBaseline(true);
      try {
        const ctx = selectedContext !== 'all' ? selectedContext : 'resting_cabin';
        const mod = selectedModality !== 'all' ? selectedModality : undefined;
        const res = await apiClient.getAstronautBaselineByType(
          astronaut.id,
          selectedMetric,
          ctx,
          mod
        );
        setBaseline(res);
      } catch {
        // Baseline not found for this combination
        setBaseline(null);
      } finally {
        setIsLoadingBaseline(false);
      }
    };

    loadBaseline();
  }, [astronaut?.id, selectedMetric, selectedContext, selectedModality]);

  // Context Taxonomy Options
  const contextFilters = [
    { id: 'all', label: 'All Contexts' },
    { id: 'resting_cabin', label: 'Resting Cabin' },
    { id: 'sleep_cycle', label: 'Sleep Cycle' },
    { id: 'exercise_active', label: 'Active Exercise' },
    { id: 'exercise_recovery', label: 'Exercise Recovery' },
    { id: 'eva_operational', label: 'EVA Operational' },
  ];

  // Exercise Modality Options
  const modalityFilters = [
    { id: 'all', label: 'All Modalities' },
    { id: 'ared_resistive', label: 'ARED Resistive' },
    { id: 'cevis_aerobic', label: 'CEVIS Aerobic' },
    { id: 't2_treadmill', label: 'T2 Treadmill' },
  ];

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSelectedContext('all');
    setSelectedModality('all');
    setSelectedCategory('all');
    onTimeFilterChange('all');
  };

  const hasActiveFilters =
    selectedContext !== 'all' ||
    selectedModality !== 'all' ||
    selectedCategory !== 'all' ||
    timeFilter !== 'all';

  // Filter measurements based on all active criteria
  const filteredMeasurements = useMemo(() => {
    return measurements.filter((m) => {
      // Metric match
      if (m.measurement_type !== selectedMetric) return false;

      // Context match
      if (selectedContext !== 'all') {
        if (!m.context || !m.context.toLowerCase().includes(selectedContext.toLowerCase())) {
          return false;
        }
      }

      // Modality match
      if (selectedModality !== 'all') {
        if (m.exercise_modality !== selectedModality) {
          return false;
        }
      }

      return true;
    });
  }, [measurements, selectedMetric, selectedContext, selectedModality]);

  // Sort filtered for chart
  const sortedForChart = useMemo(() => {
    return [...filteredMeasurements].sort(
      (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
    );
  }, [filteredMeasurements]);

  const timestamps = useMemo(() => {
    return sortedForChart.map((m) => m.measured_at);
  }, [sortedForChart]);

  // Group latest measurement for each metric
  const latestByMetric = useMemo(() => {
    const map: Record<string, Measurement> = {};
    measurements.forEach((m) => {
      if (!map[m.measurement_type] || new Date(m.measured_at) > new Date(map[m.measurement_type].measured_at)) {
        map[m.measurement_type] = m;
      }
    });
    return map;
  }, [measurements]);

  const meta = getMetricMeta(selectedMetric);

  return (
    <div className="space-y-6">
      {/* Metric Cards Row - Dynamically rendered from availableMetrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-space-400">
            Available Telemetry Channels ({availableMetrics.length})
          </h4>
          <span className="font-mono text-[10px] text-space-500">
            Click metric card to focus chart
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableMetrics.map((key) => (
            <TelemetryMetricCard
              key={key}
              measurementType={key}
              latestMeasurement={latestByMetric[key]}
              isActive={selectedMetric === key}
              onSelect={() => onSelectMetric(key)}
            />
          ))}
        </div>
      </div>

      {/* Phase 3B Context-Aware Filter Console */}
      <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-space-800">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-telemetry-cyan" />
            <span className="text-xs font-bold uppercase tracking-wider text-space-200">
              Context &amp; Modality Telemetry Filters
            </span>
            <span className="px-1.5 py-0.5 rounded bg-space-800 text-[10px] text-telemetry-cyan border border-space-700">
              PHASE 3B TAXONOMY
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-space-800 hover:bg-space-750 text-xs text-space-300 hover:text-telemetry-cyan transition-colors self-start sm:self-auto"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Operational Context Filters */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-space-500 uppercase tracking-wider block">
            Operational Context:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {contextFilters.map((ctx) => {
              const isSelected = selectedContext === ctx.id;
              return (
                <button
                  key={ctx.id}
                  onClick={() => setSelectedContext(ctx.id)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                    isSelected
                      ? 'bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan font-bold'
                      : 'bg-space-900 hover:bg-space-800 border-space-750 text-space-300'
                  }`}
                >
                  {ctx.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercise Modality Filters */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] text-space-500 uppercase tracking-wider block">
            Countermeasure Exercise Modality:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {modalityFilters.map((mod) => {
              const isSelected = selectedModality === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModality(mod.id)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                    isSelected
                      ? 'bg-telemetry-amber/20 border-telemetry-amber text-telemetry-amber font-bold'
                      : 'bg-space-900 hover:bg-space-800 border-space-750 text-space-300'
                  }`}
                >
                  {mod.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mission Timeline Context Scrubber */}
      <MissionDayScrubber
        astronaut={astronaut}
        timeFilter={timeFilter}
        onTimeFilterChange={onTimeFilterChange}
        availableTimestamps={timestamps}
      />

      {/* Primary Chart Area */}
      <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-space-700/60 font-mono">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-telemetry-cyan" />
            <h3 className="text-xs uppercase tracking-wider text-space-300 font-semibold">
              Context-Aware Telemetry Teleplot — {meta.label}
            </h3>
            {baseline && (
              <span className="px-2 py-0.5 rounded bg-telemetry-cyan/15 text-[10px] font-bold text-telemetry-cyan border border-telemetry-cyan/30">
                PERSONAL BASELINE: {baseline.envelope.median} {baseline.unit}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onNavigateToBaselines && (
              <button
                onClick={() => onNavigateToBaselines(selectedMetric)}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-telemetry-cyan/15 hover:bg-telemetry-cyan/25 border border-telemetry-cyan/50 text-telemetry-cyan text-xs font-bold transition-colors"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Compare Baseline</span>
              </button>
            )}

            <button
              onClick={() => setShowRawTable(!showRawTable)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs text-space-300 hover:text-space-100 transition-colors"
            >
              <Table className="h-3.5 w-3.5 text-telemetry-cyan" />
              <span>{showRawTable ? 'Hide Raw Telemetry' : 'View Raw Packets'}</span>
            </button>
          </div>
        </div>

        {/* Recharts Component with Optional Baseline Reference Overlay */}
        <TelemetryTimeSeriesChart
          measurements={sortedForChart}
          metricType={selectedMetric}
          baseline={baseline}
        />
      </div>

      {/* Raw Telemetry Data Inspector Table (Collapsible) */}
      {showRawTable && (
        <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-space-300 flex items-center gap-2">
              <Eye className="h-4 w-4 text-telemetry-emerald" />
              Audited Telemetry Records Retrieved From Backend
            </h4>
            <span className="font-mono text-[11px] text-space-400">
              {sortedForChart.length} Records In Filtered View
            </span>
          </div>

          <div className="overflow-x-auto max-h-72 border border-space-750 rounded">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-space-900 sticky top-0 border-b border-space-700 text-space-400 text-[11px]">
                <tr>
                  <th className="p-2.5">TIMESTAMP (UTC)</th>
                  <th className="p-2.5">METRIC TYPE</th>
                  <th className="p-2.5">VALUE</th>
                  <th className="p-2.5">QUALITY</th>
                  <th className="p-2.5">PROVENANCE</th>
                  <th className="p-2.5">SOURCE</th>
                  <th className="p-2.5">CONTEXT</th>
                  <th className="p-2.5">MODALITY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-800 text-space-300">
                {sortedForChart.map((record) => {
                  const quality = formatDataQuality(record.data_quality);
                  const provenance = formatProvenance(record.is_synthetic);
                  return (
                    <tr key={record.id} className="hover:bg-space-800/50">
                      <td className="p-2.5 whitespace-nowrap text-space-400">
                        {formatTimestamp(record.measured_at)}
                      </td>
                      <td className="p-2.5 font-bold text-space-200">
                        {record.measurement_type}
                      </td>
                      <td className="p-2.5 font-bold text-space-100 whitespace-nowrap">
                        {record.value} {record.unit}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] ${quality.badgeClass}`}>
                          {quality.label}
                        </span>
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] ${provenance.badgeClass}`}>
                          {provenance.shortLabel}
                        </span>
                      </td>
                      <td className="p-2.5 whitespace-nowrap text-space-400">
                        {record.source || 'Source not specified'}
                      </td>
                      <td className="p-2.5 text-space-400 truncate max-w-xs">
                        {record.context || '—'}
                      </td>
                      <td className="p-2.5 text-space-400 truncate max-w-xs">
                        {record.exercise_modality || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
