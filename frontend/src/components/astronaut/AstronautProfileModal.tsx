import React from 'react';
import { User, X, Rocket, Database, CheckCircle2 } from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement } from '../../types/measurement';
import { formatTimestamp } from '../../utils/formatters';

interface AstronautProfileModalProps {
  astronaut: Astronaut | null;
  measurements: Measurement[];
  isOpen: boolean;
  onClose: () => void;
  onSelectForMonitoring: (id: string) => void;
}

export const AstronautProfileModal: React.FC<AstronautProfileModalProps> = ({
  astronaut,
  measurements,
  isOpen,
  onClose,
  onSelectForMonitoring,
}) => {
  if (!isOpen || !astronaut) return null;

  // Filter measurements for this astronaut
  const astroMeasurements = measurements.filter((m) => m.astronaut_id === astronaut.id);
  const syntheticCount = astroMeasurements.filter((m) => m.is_synthetic).length;
  const empiricalCount = astroMeasurements.length - syntheticCount;

  // Unique sources
  const sources = Array.from(new Set(astroMeasurements.map((m) => m.source)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl bg-space-900 border border-space-600 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-space-400 hover:bg-space-800 hover:text-space-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 border-b border-space-700/80 pb-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-space-800 border border-telemetry-cyan text-telemetry-cyan shadow-hud-glow">
            <User className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-mono text-lg font-bold text-space-100">
                {astronaut.name}
              </h3>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-space-800 text-telemetry-cyan border border-space-700">
                {astronaut.id}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-space-300">
              {astronaut.crew_role}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="mt-5 space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          {/* Mission & Profile Specs - Exact API Fields */}
          <div className="rounded-lg bg-space-850 p-4 border border-space-700">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-space-400 mb-3 flex items-center gap-2">
              <Rocket className="h-4 w-4 text-telemetry-cyan" />
              Mission Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-space-900 border border-space-750">
                <span className="text-space-400">MISSION NAME:</span>
                <span className="font-bold text-space-100">{astronaut.mission_name}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-space-900 border border-space-750">
                <span className="text-space-400">FLIGHT DAY:</span>
                <span className="font-bold text-telemetry-amber">D+{astronaut.mission_day}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-space-900 border border-space-750">
                <span className="text-space-400">ASSIGNED ROLE:</span>
                <span className="font-bold text-space-200">{astronaut.crew_role}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-space-900 border border-space-750">
                <span className="text-space-400">RECORD CREATED:</span>
                <span className="text-space-300">{formatTimestamp(astronaut.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Telemetry Provenance & Measurement Summary */}
          <div className="rounded-lg bg-space-850 p-4 border border-space-700">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-space-400 mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-telemetry-emerald" />
              Telemetry Data Provenance &amp; Volume
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-center">
              <div className="p-3 rounded bg-space-900 border border-space-750">
                <span className="text-[10px] text-space-400 block mb-1">TOTAL RECORDS</span>
                <span className="text-xl font-bold text-space-100">{astroMeasurements.length}</span>
              </div>
              <div className="p-3 rounded bg-space-900 border border-blue-500/20">
                <span className="text-[10px] text-blue-400 block mb-1">EMPIRICAL DATA</span>
                <span className="text-xl font-bold text-blue-300">{empiricalCount}</span>
              </div>
              <div className="p-3 rounded bg-space-900 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 block mb-1">SYNTHETIC DATA</span>
                <span className="text-xl font-bold text-amber-300">{syntheticCount}</span>
              </div>
            </div>

            {/* Sourced Hardware Subsystems */}
            <div className="mt-3 pt-3 border-t border-space-750 text-xs font-mono">
              <span className="text-space-400 text-[11px] block mb-1.5 uppercase tracking-wide">
                Originating Sensors &amp; Studies:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sources.length > 0 ? (
                  sources.map((src) => (
                    <span
                      key={src}
                      className="px-2 py-0.5 rounded bg-space-900 border border-space-700 text-[11px] text-space-300"
                    >
                      {src}
                    </span>
                  ))
                ) : (
                  <span className="text-space-500 text-[11px]">No active telemetry sensor linked.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 flex items-center justify-between pt-3 border-t border-space-700/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 font-mono text-xs text-space-300 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSelectForMonitoring(astronaut.id);
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded bg-telemetry-cyan hover:bg-telemetry-cyan/90 font-mono text-xs font-bold text-space-950 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Select as Active Focus</span>
          </button>
        </div>
      </div>
    </div>
  );
};
