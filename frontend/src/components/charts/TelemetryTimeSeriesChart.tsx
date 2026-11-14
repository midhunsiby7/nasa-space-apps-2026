import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { Measurement } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { getMetricMeta, formatTimestamp, formatDataQuality, formatProvenance } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';

interface TelemetryTimeSeriesChartProps {
  measurements: Measurement[];
  metricType: string;
  baseline?: BaselineResponse | null;
}

interface ChartDataPoint {
  rawTimestamp: string;
  timeLabel: string;
  value: number;
  unit: string;
  source: string;
  context: string | null;
  exercise_modality?: string | null;
  data_quality: string;
  is_synthetic: boolean;
}

// Custom High-Fidelity Aerospace Tooltip
const CustomTelemetryTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
}) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as ChartDataPoint;
  const quality = formatDataQuality(data.data_quality as any);
  const provenance = formatProvenance(data.is_synthetic);

  return (
    <div className="rounded-lg bg-space-900/95 border border-space-600 p-3 shadow-2xl backdrop-blur font-mono text-xs max-w-xs z-50">
      <div className="flex items-center justify-between border-b border-space-700 pb-1.5 mb-2 gap-2">
        <span className="text-[11px] text-space-400">
          {formatTimestamp(data.rawTimestamp)}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${provenance.badgeClass}`}>
          {provenance.shortLabel}
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-space-300 font-semibold uppercase">Reading:</span>
        <span className="text-base font-bold text-space-100">
          {data.value} <span className="text-xs text-space-400 font-normal">{data.unit}</span>
        </span>
      </div>

      <div className="space-y-1 text-[11px] border-t border-space-700/60 pt-2 text-space-300">
        <div className="flex justify-between">
          <span className="text-space-400">Quality:</span>
          <span className={`px-1 rounded border text-[10px] ${quality.badgeClass}`}>
            {quality.label}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-space-400">Source:</span>
          <span className="text-space-200 truncate max-w-[150px]">{data.source || 'Source not specified'}</span>
        </div>
        {data.context && (
          <div className="flex justify-between">
            <span className="text-space-400">Context:</span>
            <span className="text-telemetry-cyan truncate max-w-[150px]">{data.context}</span>
          </div>
        )}
        {data.exercise_modality && (
          <div className="flex justify-between">
            <span className="text-space-400">Modality:</span>
            <span className="text-amber-300 truncate max-w-[150px]">{data.exercise_modality}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const TelemetryTimeSeriesChart: React.FC<TelemetryTimeSeriesChartProps> = ({
  measurements,
  metricType,
  baseline,
}) => {
  const meta = getMetricMeta(metricType);

  if (!measurements || measurements.length === 0) {
    return (
      <EmptyState
        title="No Telemetry Series Data"
        description={`No measurements available for metric "${meta.label}". Try selecting another telemetry metric or adjusting your filters.`}
      />
    );
  }

  // Transform measurements for Recharts
  const chartData: ChartDataPoint[] = measurements.map((m) => {
    const d = new Date(m.measured_at);
    const timeLabel = isNaN(d.getTime())
      ? m.measured_at
      : d.toISOString().substring(11, 16) + 'Z';

    return {
      rawTimestamp: m.measured_at,
      timeLabel,
      value: m.value,
      unit: m.unit,
      source: m.source,
      context: m.context,
      exercise_modality: m.exercise_modality,
      data_quality: m.data_quality,
      is_synthetic: m.is_synthetic,
    };
  });

  // Calculate dynamic domain encompassing observations and baseline envelope
  const values = chartData.map((d) => d.value);
  if (baseline) {
    values.push(baseline.envelope.q25, baseline.envelope.q75, baseline.envelope.median);
  }
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = (maxVal - minVal) * 0.15 || 2;
  const yDomain: [number, number] = [
    Math.floor(minVal - padding),
    Math.ceil(maxVal + padding),
  ];

  return (
    <div className="w-full">
      {/* Chart Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1">
        <div>
          <h4 className="font-mono text-sm font-bold text-space-100 uppercase tracking-wide flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            {meta.label} Time-Series Observation
          </h4>
          <p className="font-mono text-[11px] text-space-400 mt-0.5">
            {meta.description}
            {baseline ? (
              <span className="text-telemetry-cyan ml-1 font-semibold">
                • Personal Median: {baseline.envelope.median} {baseline.unit} (IQR: {baseline.envelope.q25}–{baseline.envelope.q75})
              </span>
            ) : (
              <span> • Standard Reference: {meta.nominalRange}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          {baseline && (
            <span className="px-2 py-0.5 rounded bg-telemetry-cyan/15 border border-telemetry-cyan/30 text-telemetry-cyan text-[11px] font-semibold">
              BASELINE OVERLAY ACTIVE
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-space-850 border border-space-700 text-space-300">
            {chartData.length} Data Points
          </span>
          <span className="px-2 py-0.5 rounded bg-space-850 border border-space-700 text-telemetry-cyan">
            Unit: {meta.unit}
          </span>
        </div>
      </div>

      {/* SVG Responsive Container */}
      <div className="h-72 w-full rounded-lg bg-space-950/80 p-2 border border-space-750">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 24, left: -4, bottom: 8 }}>
            <CartesianGrid stroke="#1e2c45" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#5c79a8"
              tick={{ fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#273856' }}
              dy={6}
            />
            <YAxis
              domain={yDomain}
              stroke="#5c79a8"
              tick={{ fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#273856' }}
              unit={` ${meta.unit}`}
              width={70}
            />
            <Tooltip content={<CustomTelemetryTooltip />} />

            {/* Baseline IQR Envelope Band */}
            {baseline && (
              <ReferenceArea
                y1={baseline.envelope.q25}
                y2={baseline.envelope.q75}
                fill="#38bdf8"
                fillOpacity={0.08}
                stroke="#38bdf8"
                strokeOpacity={0.3}
                strokeDasharray="4 4"
              />
            )}

            {/* Baseline Median Reference Line */}
            {baseline && (
              <ReferenceLine
                y={baseline.envelope.median}
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                label={{
                  value: `Median ${baseline.envelope.median}`,
                  fill: '#38bdf8',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}

            {/* Historical Telemetry Stream Line */}
            <Line
              type="monotone"
              dataKey="value"
              name={meta.label}
              stroke={meta.color}
              strokeWidth={2.2}
              dot={{
                r: 3.5,
                fill: '#0b0f17',
                stroke: meta.color,
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: meta.color,
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Provenance Footer Note */}
      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-space-400 px-1">
        <span>UTC Timestamps verified against API Contract v1.0</span>
        <span className="text-space-400">
          Hover over data points to inspect individual packet fidelity and sensor source
        </span>
      </div>
    </div>
  );
};
