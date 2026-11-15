import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { HealthAnomaly } from './healthAnomalies';

interface HealthAnomalyBannerProps {
  anomalies: HealthAnomaly[];
  compact?: boolean;
}

export const HealthAnomalyBanner: React.FC<HealthAnomalyBannerProps> = ({ anomalies, compact = false }) => {
  if (anomalies.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-telemetry-emerald/40 bg-telemetry-emerald/10 p-3 font-mono text-xs text-telemetry-emerald">
        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold uppercase tracking-wider">Check-in nominal</div>
          <p className="text-[11px] text-space-300 mt-0.5">
            No active alerts and no readings outside personal baselines. Continue scheduled protocol.
          </p>
        </div>
      </div>
    );
  }

  const hasCritical = anomalies.some((a) => a.severity === 'critical');
  return (
    <div
      role="alert"
      className={`rounded-lg border-2 p-3 font-mono text-xs ${
        hasCritical ? 'border-telemetry-rose bg-telemetry-rose/10' : 'border-telemetry-amber bg-telemetry-amber/10'
      }`}
    >
      <div
        className={`flex items-center gap-2 font-bold uppercase tracking-wider mb-2 ${
          hasCritical ? 'text-telemetry-rose' : 'text-telemetry-amber'
        }`}
      >
        {hasCritical ? <AlertOctagon className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        <span>
          Health anomal{anomalies.length === 1 ? 'y' : 'ies'} detected ({anomalies.length})
        </span>
      </div>
      <div className={`space-y-2 ${compact ? 'max-h-48 overflow-y-auto pr-1' : ''}`}>
        {anomalies.map((a) => (
          <div key={a.id} className="rounded border border-space-700 bg-space-900 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-space-100">{a.title}</span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                  a.severity === 'critical'
                    ? 'border-telemetry-rose text-telemetry-rose'
                    : 'border-telemetry-amber text-telemetry-amber'
                }`}
              >
                {a.severity}
              </span>
            </div>
            <div className="text-[10px] text-space-400 mt-0.5">
              Affected metric: <span className="text-space-200 font-semibold">{a.metricLabel}</span>
              {' • '}
              {a.source === 'alert' ? 'Active alert' : 'Baseline deviation'}
            </div>
            <p className="text-[11px] text-space-300 mt-1">{a.explanation}</p>
            <p className="text-[11px] text-space-100 mt-1">
              <strong>Recommendation: </strong>
              {a.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
