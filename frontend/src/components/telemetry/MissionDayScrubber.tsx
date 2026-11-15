import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Astronaut } from '../../types/astronaut';

interface MissionDayScrubberProps {
  astronaut: Astronaut | null;
  timeFilter: 'all' | '8h' | '24h';
  onTimeFilterChange: (filter: 'all' | '8h' | '24h') => void;
  availableTimestamps: string[];
}

export const MissionDayScrubber: React.FC<MissionDayScrubberProps> = ({
  astronaut,
  timeFilter,
  onTimeFilterChange,
  availableTimestamps,
}) => {
  const earliest = availableTimestamps.length > 0 ? availableTimestamps[0] : null;
  const latest = availableTimestamps.length > 0 ? availableTimestamps[availableTimestamps.length - 1] : null;

  return (
    <div className="rounded-lg bg-space-850 p-3.5 border border-space-700/80 shadow-hud-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Mission Day Context */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-space-800 border border-space-700 text-telemetry-amber">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-space-400">
                Mission Timeline Context
              </span>
              <span className="rounded bg-telemetry-amber/15 px-1.5 py-0.2 font-mono text-[11px] font-bold text-telemetry-amber border border-telemetry-amber/30">
                {astronaut ? `MISSION DAY ${astronaut.mission_day}` : 'STANDBY'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-space-400 mt-0.5">
              {astronaut?.mission_name || 'No Mission Assigned'}
              {earliest && latest ? ` • Telemetry Interval: ${earliest.substring(11, 16)}Z to ${latest.substring(11, 16)}Z` : ''}
            </p>
          </div>
        </div>

        {/* Time Window Filters */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="text-[11px] font-mono text-space-400 mr-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Window:
          </span>
          <button
            onClick={() => onTimeFilterChange('8h')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
              timeFilter === '8h'
                ? 'bg-telemetry-cyan text-white font-bold border-telemetry-cyan'
                : 'bg-space-900 text-space-300 border-space-700 hover:bg-space-800'
            }`}
          >
            Recent 8h
          </button>
          <button
            onClick={() => onTimeFilterChange('24h')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
              timeFilter === '24h'
                ? 'bg-telemetry-cyan text-white font-bold border-telemetry-cyan'
                : 'bg-space-900 text-space-300 border-space-700 hover:bg-space-800'
            }`}
          >
            24h Window
          </button>
          <button
            onClick={() => onTimeFilterChange('all')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
              timeFilter === 'all'
                ? 'bg-telemetry-cyan text-white font-bold border-telemetry-cyan'
                : 'bg-space-900 text-space-300 border-space-700 hover:bg-space-800'
            }`}
          >
            All Points
          </button>
        </div>
      </div>
    </div>
  );
};
