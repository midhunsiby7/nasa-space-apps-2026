import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Lock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { BaselineResponse, BaselineMaturity } from '../../types/baseline';

interface BaselineCardProps {
  baseline: BaselineResponse;
  onViewHistory?: () => void;
}

export const BaselineCard: React.FC<BaselineCardProps> = ({ baseline, onViewHistory }) => {
  const { envelope, quality_summary } = baseline;

  const renderMaturityBadge = (maturity: BaselineMaturity) => {
    switch (maturity) {
      case 'established':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-telemetry-emerald/15 text-telemetry-emerald border border-telemetry-emerald/30">
            <CheckCircle2 className="h-3 w-3" />
            Established
          </span>
        );
      case 'provisional':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-telemetry-cyan/15 text-telemetry-cyan border border-telemetry-cyan/30">
            <Clock className="h-3 w-3" />
            Provisional
          </span>
        );
      case 'insufficient':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-telemetry-amber/15 text-telemetry-amber border border-telemetry-amber/30">
            <ShieldAlert className="h-3 w-3" />
            Insufficient Data
          </span>
        );
    }
  };

  return (
    <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card transition-all hover:border-space-600">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
              {baseline.measurement_type.replace(/_/g, ' ')}
            </span>
            <span className="text-[11px] font-mono text-space-400">
              ({baseline.unit})
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono text-space-400">
              Context: <span className="text-space-200">{baseline.context}</span>
            </span>
            <span className="text-space-600">•</span>
            <span className="text-[11px] font-mono text-space-400">
              v{baseline.version}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {renderMaturityBadge(baseline.maturity)}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-space-800 text-space-300 border border-space-700">
              {baseline.baseline_type}
            </span>
            {baseline.is_finalized && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-space-800 text-space-300 border border-space-700">
                <Lock className="h-2.5 w-2.5 text-telemetry-amber" />
                Locked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Stat: Personal Median & Robust Envelope */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 my-2 border-y border-space-800 bg-space-900/40 rounded px-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-space-400 block">
            Personal Median
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-mono font-bold text-telemetry-cyan">
              {envelope.median.toFixed(envelope.median < 1 ? 3 : 1)}
            </span>
            <span className="text-[10px] font-mono text-space-400">{baseline.unit}</span>
          </div>
          <span className="text-[9px] font-mono text-space-500">Robust Location</span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-space-400 block">
            IQR (Q3 - Q1)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-mono font-bold text-space-100">
              {envelope.iqr.toFixed(envelope.iqr < 1 ? 3 : 1)}
            </span>
            <span className="text-[10px] font-mono text-space-400">{baseline.unit}</span>
          </div>
          <span className="text-[9px] font-mono text-space-500">Robust Scale</span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-space-400 block">
            Normal Range (Q1-Q3)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-mono font-bold text-space-200">
              {envelope.q25.toFixed(envelope.q25 < 1 ? 3 : 1)} – {envelope.q75.toFixed(envelope.q75 < 1 ? 3 : 1)}
            </span>
          </div>
          <span className="text-[9px] font-mono text-space-500">50% Central Mass</span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-space-400 block">
            Sample Count
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-mono font-bold text-space-100">
              {envelope.sample_count}
            </span>
            <span className="text-[10px] font-mono text-space-400">pts</span>
          </div>
          <span className="text-[9px] font-mono text-space-500">
            {quality_summary.nominal} nom / {quality_summary.degraded} deg
          </span>
        </div>
      </div>

      {/* Sensor and Site Metadata */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-space-400 gap-y-1 mt-2.5">
        <div className="flex items-center gap-3">
          {baseline.measurement_site && (
            <span>Site: <span className="text-space-300">{baseline.measurement_site}</span></span>
          )}
          {baseline.sensor_model && (
            <span>Sensor: <span className="text-space-300">{baseline.sensor_model}</span></span>
          )}
        </div>

        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="text-telemetry-cyan hover:underline text-[11px] flex items-center gap-1"
          >
            <Layers className="h-3 w-3" />
            Version History
          </button>
        )}
      </div>

      {/* Safety Boundary Notice */}
      <div className="mt-3 pt-2 border-t border-space-800 flex items-start gap-1.5 text-[10px] font-mono text-space-500">
        <HelpCircle className="h-3 w-3 text-space-400 shrink-0 mt-0.5" />
        <span>{envelope.disclaimer}</span>
      </div>
    </div>
  );
};
