import React from 'react';
import { User, Calendar, Rocket, ChevronRight, Activity } from 'lucide-react';
import { Astronaut } from '../../types/astronaut';

interface AstronautCardProps {
  astronaut: Astronaut;
  isSelected: boolean;
  onSelect: () => void;
  onOpenDetails: () => void;
}

export const AstronautCard: React.FC<AstronautCardProps> = ({
  astronaut,
  isSelected,
  onSelect,
  onOpenDetails,
}) => {
  return (
    <div
      className={`rounded-lg p-4 transition-all border ${
        isSelected
          ? 'bg-space-850 border-telemetry-cyan shadow-hud-glow'
          : 'bg-space-900/90 border-space-700/80 hover:border-space-600 hover:bg-space-850/80 shadow-hud-card'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${
              isSelected
                ? 'bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan'
                : 'bg-space-800 border-space-700 text-space-300'
            }`}
          >
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-space-100">
              {astronaut.name}
            </h3>
            <span className="font-mono text-[11px] text-telemetry-cyan font-semibold">
              {astronaut.id}
            </span>
          </div>
        </div>

        {/* Mission Day Tag */}
        <div className="flex items-center gap-1 rounded bg-space-800 px-2 py-0.5 border border-space-700 font-mono text-[11px] text-space-300">
          <Calendar className="h-3 w-3 text-telemetry-amber" />
          <span>Day {astronaut.mission_day}</span>
        </div>
      </div>

      <div className="mt-3.5 space-y-1.5 border-t border-space-700/60 pt-3 text-xs font-mono">
        <div className="flex items-center justify-between text-space-300">
          <span className="text-space-400">ROLE:</span>
          <span className="font-medium text-space-200 text-right truncate max-w-[170px]">
            {astronaut.crew_role}
          </span>
        </div>
        <div className="flex items-center justify-between text-space-300">
          <span className="text-space-400">MISSION:</span>
          <span className="flex items-center gap-1 font-medium text-telemetry-cyan text-right">
            <Rocket className="h-3 w-3" />
            {astronaut.mission_name}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 pt-2">
        <button
          onClick={onSelect}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded font-mono text-xs transition-colors ${
            isSelected
              ? 'bg-telemetry-cyan text-white font-bold'
              : 'bg-space-800 hover:bg-space-750 text-space-200 border border-space-700'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>{isSelected ? 'Active Focus' : 'Monitor Vitals'}</span>
        </button>

        <button
          onClick={onOpenDetails}
          title="Inspect Full Specifications"
          className="p-1.5 rounded bg-space-800 hover:bg-space-750 text-space-300 hover:text-space-100 border border-space-700 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
