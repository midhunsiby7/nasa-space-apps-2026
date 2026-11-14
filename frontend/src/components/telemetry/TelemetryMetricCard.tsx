import React from 'react';
import { Clock } from 'lucide-react';
import { Measurement } from '../../types/measurement';
import { getMetricMeta, formatDataQuality, formatProvenance, formatTimeShort } from '../../utils/formatters';

interface TelemetryMetricCardProps {
  measurementType: string;
  latestMeasurement?: Measurement;
  isActive: boolean;
  onSelect: () => void;
}

export const TelemetryMetricCard: React.FC<TelemetryMetricCardProps> = ({
  measurementType,
  latestMeasurement,
  isActive,
  onSelect,
}) => {
  const meta = getMetricMeta(measurementType);
  const quality = latestMeasurement ? formatDataQuality(latestMeasurement.data_quality) : null;
  const provenance = latestMeasurement ? formatProvenance(latestMeasurement.is_synthetic) : null;

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg p-4 border transition-all ${
        isActive
          ? 'bg-space-850 border-telemetry-cyan shadow-hud-glow'
          : 'bg-space-900/80 border-space-700/80 hover:border-space-600 hover:bg-space-850/60 shadow-hud-card'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-space-300">
          {meta.label}
        </span>
        {provenance && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${provenance.badgeClass}`}>
            {provenance.shortLabel}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-extrabold text-space-100">
            {latestMeasurement ? latestMeasurement.value : '—'}
          </span>
          <span className="font-mono text-xs text-space-400">
            {latestMeasurement ? latestMeasurement.unit : meta.unit}
          </span>
        </div>

        {quality && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${quality.badgeClass}`}>
            {quality.label}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1 pt-2 border-t border-space-700/50 text-[11px] font-mono text-space-400">
        <div className="flex items-center justify-between">
          <span className="truncate max-w-[130px]">{latestMeasurement?.source || 'No signal'}</span>
          {latestMeasurement && (
            <span className="flex items-center gap-1 text-space-400 shrink-0">
              <Clock className="h-3 w-3" />
              {formatTimeShort(latestMeasurement.measured_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
