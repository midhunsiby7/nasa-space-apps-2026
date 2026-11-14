import React, { useState, useMemo } from 'react';
import { Table, Eye, Layers } from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
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
}

export const TelemetryStreamSection: React.FC<TelemetryStreamSectionProps> = ({
  astronaut,
  measurements,
  selectedMetric,
  onSelectMetric,
  timeFilter,
  onTimeFilterChange,
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
      {/* 4 Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coreMetricKeys.map((key) => (
          <TelemetryMetricCard
            key={key}
            measurementType={key}
            latestMeasurement={latestByMetric[key]}
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
                  <th className="p-2.5">TIMESTAMP (UTC)</th>
                  <th className="p-2.5">METRIC</th>
                  <th className="p-2.5">VALUE</th>
                  <th className="p-2.5">QUALITY</th>
                  <th className="p-2.5">PROVENANCE</th>
                  <th className="p-2.5">SOURCE</th>
                  <th className="p-2.5">OPERATIONAL CONTEXT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-800 text-space-300">
                {filteredForChart.map((record) => {
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
                        {record.source}
                      </td>
                      <td className="p-2.5 text-space-400 truncate max-w-xs">
                        {record.context || '—'}
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
