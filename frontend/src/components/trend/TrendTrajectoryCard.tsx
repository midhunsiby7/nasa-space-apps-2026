import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { TrendObservation, TrendDirection, FreshnessStatus } from '../../types/trend';

interface TrendTrajectoryCardProps {
  trend: TrendObservation;
}

export const TrendTrajectoryCard: React.FC<TrendTrajectoryCardProps> = ({ trend }) => {
  const renderDirectionBadge = (direction: TrendDirection) => {
    switch (direction) {
      case 'stable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-telemetry-emerald/15 text-telemetry-emerald border border-telemetry-emerald/30">
            <Minus className="h-3 w-3" />
            Stable
          </span>
        );
      case 'increasing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-telemetry-amber/15 text-telemetry-amber border border-telemetry-amber/30">
            <TrendingUp className="h-3 w-3" />
            Trending Up
          </span>
        );
      case 'decreasing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-telemetry-cyan/15 text-telemetry-cyan border border-telemetry-cyan/30">
            <TrendingDown className="h-3 w-3" />
            Trending Down
          </span>
        );
      case 'sustained_deviation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-telemetry-rose/20 text-telemetry-rose border border-telemetry-rose/40 animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            Sustained Shift
          </span>
        );
      case 'insufficient_data':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-space-800 text-space-400 border border-space-700">
            <Clock className="h-3 w-3" />
            Insufficient Data
          </span>
        );
    }
  };

  const renderFreshnessBadge = (status: FreshnessStatus, hours: number | null | undefined, expected: number) => {
    if (status === 'fresh') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-telemetry-emerald/10 text-telemetry-emerald border border-telemetry-emerald/30">
          <span className="h-1.5 w-1.5 rounded-full bg-telemetry-emerald animate-pulse" />
          Fresh ({hours !== null && hours !== undefined ? `${hours.toFixed(1)}h` : '<1h'} / max {expected}h)
        </span>
      );
    }
    if (status === 'stale') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-telemetry-amber/15 text-telemetry-amber border border-telemetry-amber/30 font-semibold">
          <Clock className="h-2.5 w-2.5" />
          STALE ({hours !== null && hours !== undefined ? `${hours.toFixed(1)}h` : '?'} / exp {expected}h)
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono text-space-500">
        Currency: Unknown
      </span>
    );
  };

  return (
    <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card transition-all hover:border-space-600">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="font-mono text-sm font-bold uppercase tracking-wider text-space-100 block">
            {trend.measurement_type.replace(/_/g, ' ')}
          </span>
          <span className="text-[11px] font-mono text-space-400">
            Context: <span className="text-space-200">{trend.context}</span>
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          {renderDirectionBadge(trend.trend_direction)}
          {renderFreshnessBadge(trend.freshness_status, trend.hours_since_last_observation, trend.expected_interval_hours)}
        </div>
      </div>

      {/* Observation vs Personal Median */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 my-2 border-y border-space-800 bg-space-900/40 rounded px-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-space-400 block">
            Latest Telemetry
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-mono font-bold text-space-100">
              {trend.current_value !== null && trend.current_value !== undefined
                ? trend.current_value.toFixed(trend.current_value < 1 ? 3 : 1)
                : '—'}
            </span>
            <span className="text-[10px] font-mono text-space-400">{trend.unit}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-space-400 block">
            Baseline Median
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-mono font-bold text-telemetry-cyan">
              {trend.baseline_median !== null && trend.baseline_median !== undefined
                ? trend.baseline_median.toFixed(trend.baseline_median < 1 ? 3 : 1)
                : '—'}
            </span>
            <span className="text-[10px] font-mono text-space-400">{trend.unit}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-space-400 block">
            Sen's Slope (24h)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-mono font-bold text-space-200">
              {trend.sens_slope !== null && trend.sens_slope !== undefined
                ? `${trend.sens_slope > 0 ? '+' : ''}${trend.sens_slope.toFixed(2)}`
                : '—'}
            </span>
            <span className="text-[10px] font-mono text-space-400">{trend.unit}/24h</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-space-400 block">
            Standardized Robust Z
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-base font-mono font-bold ${
                trend.robust_z !== null && trend.robust_z !== undefined && Math.abs(trend.robust_z) > 1.5
                  ? 'text-telemetry-amber'
                  : 'text-telemetry-emerald'
              }`}
            >
              {trend.robust_z !== null && trend.robust_z !== undefined
                ? `${trend.robust_z > 0 ? '+' : ''}${trend.robust_z.toFixed(2)} σ`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Explanation text */}
      <p className="text-xs text-space-300 font-mono leading-relaxed mt-2">
        {trend.explanation}
      </p>

      {/* Consecutive deviations / alert footnote */}
      {trend.consecutive_deviations > 0 && (
        <div className="mt-2 text-[10px] font-mono text-telemetry-amber flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>
            {trend.consecutive_deviations} consecutive deviation(s) exceeding |Z| &gt; 1.5 personal boundary.
          </span>
        </div>
      )}
    </div>
  );
};
