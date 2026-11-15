import React from 'react';
import { Rocket } from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement } from '../../types/measurement';
import { AlertResponse } from '../../types/alert';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation } from '../../types/trend';

interface CompactMissionOverviewProps {
  astronaut: Astronaut | null;
  measurements: Measurement[];
  alerts: AlertResponse[];
  baselines: BaselineResponse[];
  trends: TrendObservation[];
}

export const CompactMissionOverview: React.FC<CompactMissionOverviewProps> = ({
  astronaut,
  measurements,
  alerts,
  baselines,
  trends,
}) => {
  const activeAlerts = alerts.filter((a) => a.status === 'active' || a.status === 'acknowledged').length;
  const stats: { label: string; value: number }[] = [
    { label: 'Measurements', value: measurements.length },
    { label: 'Baselines', value: baselines.filter((b) => b.is_active).length },
    { label: 'Trends', value: trends.length },
    { label: 'Active alerts', value: activeAlerts },
  ];

  return (
    <div className="rounded-lg border border-space-700 bg-space-850 p-3 shadow-hud-card font-mono text-xs">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-space-750">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-space-400">
          <Rocket className="h-3.5 w-3.5 text-telemetry-cyan" />
          Mission Overview
        </span>
        {astronaut && (
          <span className="text-[10px] text-space-400 truncate ml-2">
            {astronaut.mission_name} • D+{astronaut.mission_day}
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {stats.map((s) => (
          <div key={s.label} className="rounded bg-space-800 border border-space-700 p-1.5 text-center">
            <div className="text-sm font-bold text-space-100">{s.value}</div>
            <div className="text-[8px] uppercase text-space-400 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
