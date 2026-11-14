import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { AssessmentFinding } from '../../types/assessment';

interface AssessmentFindingsTableProps {
  findings: AssessmentFinding[];
  baselineVersionsUsed: Record<string, string>;
}

export const AssessmentFindingsTable: React.FC<AssessmentFindingsTableProps> = ({
  findings,
  baselineVersionsUsed,
}) => {
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'nominal':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-telemetry-emerald/15 text-telemetry-emerald border border-telemetry-emerald/30">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Nominal
          </span>
        );
      case 'elevated':
      case 'depressed':
      case 'shift':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-telemetry-amber/15 text-telemetry-amber border border-telemetry-amber/30">
            <AlertTriangle className="h-2.5 w-2.5" />
            {status.toUpperCase()}
          </span>
        );
      case 'stale':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-telemetry-rose/15 text-telemetry-rose border border-telemetry-rose/30">
            <AlertCircle className="h-2.5 w-2.5" />
            STALE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-space-800 text-space-300 border border-space-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card">
      <div className="flex items-center gap-2 mb-3 text-space-300">
        <Activity className="h-4 w-4 text-telemetry-cyan" />
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-space-100">
          Metric-Level Diagnostic Support Findings
        </h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-space-800 text-[10px] uppercase text-space-400 bg-space-900/40">
              <th className="py-2 px-3">Metric</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Current</th>
              <th className="py-2 px-3">Personal Median</th>
              <th className="py-2 px-3">Robust Z</th>
              <th className="py-2 px-3">Baseline Version</th>
              <th className="py-2 px-3">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-space-800/60">
            {findings.map((f, i) => (
              <tr key={i} className="hover:bg-space-800/40 transition-colors">
                <td className="py-2.5 px-3 font-bold text-space-100">
                  {f.measurement_type.replace(/_/g, ' ')}
                </td>
                <td className="py-2.5 px-3">
                  {renderStatusBadge(f.status)}
                </td>
                <td className="py-2.5 px-3 text-space-200">
                  {f.current_value !== null && f.current_value !== undefined
                    ? f.current_value.toFixed(f.current_value < 1 ? 3 : 1)
                    : '—'}
                </td>
                <td className="py-2.5 px-3 text-telemetry-cyan">
                  {f.baseline_median !== null && f.baseline_median !== undefined
                    ? f.baseline_median.toFixed(f.baseline_median < 1 ? 3 : 1)
                    : '—'}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={
                      f.robust_z !== null && f.robust_z !== undefined && Math.abs(f.robust_z) > 1.5
                        ? 'text-telemetry-amber font-bold'
                        : 'text-space-300'
                    }
                  >
                    {f.robust_z !== null && f.robust_z !== undefined
                      ? `${f.robust_z > 0 ? '+' : ''}${f.robust_z.toFixed(2)}`
                      : '—'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-space-400 text-[11px]">
                  {baselineVersionsUsed[f.measurement_type] || (f.baseline_version ? `v${f.baseline_version}` : '—')}
                </td>
                <td className="py-2.5 px-3 text-space-300 text-[11px] max-w-xs truncate" title={f.summary}>
                  {f.summary}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
