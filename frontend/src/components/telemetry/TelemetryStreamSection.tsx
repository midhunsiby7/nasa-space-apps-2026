import React, { useState, useMemo } from 'react';
import { Table, Eye, Layers } from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation } from '../../types/trend';
import { TelemetryMetricCard } from './TelemetryMetricCard';
import { MissionDayScrubber } from './MissionDayScrubber';
import { TelemetryTimeSeriesChart } from '../charts/TelemetryTimeSeriesChart';
import { formatTimestamp, formatDataQuality, formatProvenance } from '../../utils/formatters';

interface TelemetryStreamSectionProps {
  astronaut: Astronaut | null;
  measurements: Measurement[];
  selectedMetric: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  timeFilter: 'all' | '8h' | '24h';
  onTimeFilterChange: (filter: 'all' | '8h' | '24h') => void;
  baselines?: BaselineResponse[];
  trends?: TrendObservation[];
}

export const TelemetryStreamSection: React.FC<TelemetryStreamSectionProps> = ({
  astronaut,
  measurements,
  selectedMetric,
  onSelectMetric,
  timeFilter,
  onTimeFilterChange,
  baselines = [],
  trends = [],
}) => {
  const [showRawTable, setShowRawTable] = useState(false);

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

  // Group baselines by metric
  const baselineByMetric = useMemo(() => {
    const map: Record<string, BaselineResponse> = {};
    baselines.forEach((b) => {
      if (b.is_active) {
        map[b.measurement_type] = b;
      }
    });
    return map;
  }, [baselines]);

  // Group trends by metric
  const trendByMetric = useMemo(() => {
    const map: Record<string, TrendObservation> = {};
    trends.forEach((t) => {
      map[t.measurement_type] = t;
    });
    return map;
  }, [trends]);

  // Filter measurements by metric for the chart
  const filteredForChart = useMemo(() => {
    return measurements
      .filter((m) => m.measurement_type === selectedMetric)
      .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  }, [measurements, selectedMetric]);

  const timestamps = useMemo(() => {
    return filteredForChart.map((m) => m.measured_at);
  }, [filteredForChart]);

  const coreMetricKeys: MeasurementType[] = [
    'heart_rate',
    'blood_oxygen',
    'core_temperature',
    'radiation_dose',
  ];

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards Row with Baselines & Trend Velocity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coreMetricKeys.map((key) => (
          <TelemetryMetricCard
            key={key}
            measurementType={key}
            latestMeasurement={latestByMetric[key]}
            baseline={baselineByMetric[key]}
            trend={trendByMetric[key]}
            isActive={selectedMetric === key}
            onSelect={() => onSelectMetric(key)}
          />
        ))}
      </div>

      {/* Mission Timeline Context Scrubber */}
      <MissionDayScrubber
        astronaut={astronaut}
        timeFilter={timeFilter}
        onTimeFilterChange={onTimeFilterChange}
        availableTimestamps={timestamps}
      />

      {/* Primary Chart Area */}
      <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-space-700/60">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-telemetry-cyan" />
            <h3 className="font-mono text-xs uppercase tracking-wider text-space-300 font-semibold">
              Biometric Telemetry Teleplot
            </h3>
          </div>
          <button
            onClick={() => setShowRawTable(!showRawTable)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-space-800 hover:bg-space-750 border border-space-700 font-mono text-xs text-space-300 hover:text-space-100 transition-colors"
          >
            <Table className="h-3.5 w-3.5 text-telemetry-cyan" />
            <span>{showRawTable ? 'Hide Raw Telemetry' : 'View Raw Packets'}</span>
          </button>
        </div>

        <TelemetryTimeSeriesChart
          measurements={filteredForChart}
          metricType={selectedMetric}
        />
      </div>

      {/* Raw Telemetry Data Inspector Table (Collapsible) */}
      {showRawTable && (
        <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-space-300 flex items-center gap-2">
              <Eye className="h-4 w-4 text-telemetry-emerald" />
              Raw Telemetry Ingestion Log (Matching API Contract v1.0)
            </h4>
            <span className="font-mono text-[11px] text-space-400">
              {filteredForChart.length} Records In-Memory
            </span>
          </div>

          <div className="overflow-x-auto max-h-72 border border-space-750 rounded">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-space-900 sticky top-0 border-b border-space-700 text-space-400 text-[11px]">
                <tr>
                  <th className="p-2">Timestamp (UTC)</th>
                  <th className="p-2">Metric</th>
                  <th className="p-2">Value</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Quality</th>
                  <th className="p-2">Provenance</th>
                  <th className="p-2">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-800">
                {filteredForChart.map((m) => {
                  const q = formatDataQuality(m.data_quality);
                  const p = formatProvenance(m.is_synthetic);
                  return (
                    <tr key={m.id} className="hover:bg-space-800/40 text-space-300">
                      <td className="p-2 whitespace-nowrap">{formatTimestamp(m.measured_at)}</td>
                      <td className="p-2 whitespace-nowrap">{m.measurement_type}</td>
                      <td className="p-2 font-bold text-space-100">{m.value}</td>
                      <td className="p-2 text-space-400">{m.unit}</td>
                      <td className="p-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${q.badgeClass}`}>
                          {q.label}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${p.badgeClass}`}>
                          {p.shortLabel}
                        </span>
                      </td>
                      <td className="p-2 text-space-400 truncate max-w-xs">{m.context || '—'}</td>
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
