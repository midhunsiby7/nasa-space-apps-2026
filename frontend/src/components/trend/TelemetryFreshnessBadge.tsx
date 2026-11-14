import React from 'react';
import { Clock } from 'lucide-react';
import { FreshnessStatus } from '../../types/trend';

interface TelemetryFreshnessBadgeProps {
  status: FreshnessStatus;
  hoursSinceLast?: number | null;
  expectedIntervalHours: number;
  compact?: boolean;
}

export const TelemetryFreshnessBadge: React.FC<TelemetryFreshnessBadgeProps> = ({
  status,
  hoursSinceLast,
  expectedIntervalHours,
  compact = false,
}) => {
  if (status === 'fresh') {
    return (
      <span
        title={`Telemetry current (received ${
          hoursSinceLast !== null && hoursSinceLast !== undefined ? hoursSinceLast.toFixed(1) : '<1'
        }h ago; expected interval <= ${expectedIntervalHours}h)`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-telemetry-emerald/15 text-telemetry-emerald border border-telemetry-emerald/30"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-telemetry-emerald animate-pulse" />
        {compact ? 'Current' : `Fresh (${hoursSinceLast ? `${hoursSinceLast.toFixed(1)}h` : '<1h'})`}
      </span>
    );
  }

  if (status === 'stale') {
    return (
      <span
        title={`Telemetry stale (elapsed: ${
          hoursSinceLast !== null && hoursSinceLast !== undefined ? hoursSinceLast.toFixed(1) : '?'
        }h; expected interval: <= ${expectedIntervalHours}h)`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-telemetry-amber/20 text-telemetry-amber border border-telemetry-amber/40"
      >
        <Clock className="h-3 w-3 shrink-0" />
        {compact ? 'STALE' : `Stale (${hoursSinceLast ? `${hoursSinceLast.toFixed(1)}h` : '>6h'})`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-space-400 bg-space-800 border border-space-700">
      Unknown
    </span>
  );
};
