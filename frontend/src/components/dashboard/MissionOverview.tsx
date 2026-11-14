import React from 'react';
import { Rocket, ShieldCheck, Users, Activity, TrendingUp, BookOpen, ArrowRight } from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement } from '../../types/measurement';
import { ConnectionState } from '../../types/api';

interface MissionOverviewProps {
  astronauts: Astronaut[];
  totalAstronauts: number;
  measurements: Measurement[];
  totalMeasurements: number;
  selectedAstronaut: Astronaut | null;
  connectionState: ConnectionState;
  onExploreRoster: () => void;
  onViewTelemetry: () => void;
  onOpenAnatomy: () => void;
  onOpenBaselines?: () => void;
  onOpenCatalog?: () => void;
}

export const MissionOverview: React.FC<MissionOverviewProps> = ({
  astronauts,
  totalAstronauts,
  measurements,
  totalMeasurements,
  selectedAstronaut,
  connectionState,
  onExploreRoster,
  onViewTelemetry,
  onOpenAnatomy,
  onOpenBaselines,
  onOpenCatalog,
}) => {
  const missions = Array.from(new Set(astronauts.map((a) => a.mission_name)));
  const loadedCount = measurements.length;
  const syntheticCount = measurements.filter((m) => m.is_synthetic).length;
  const empiricalCount = loadedCount - syntheticCount;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Crew */}
        <div
          onClick={onExploreRoster}
          className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card cursor-pointer hover:border-telemetry-cyan/60 transition-colors"
        >
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Monitored Crew</span>
            <Users className="h-4 w-4 text-telemetry-cyan" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-space-100">
              {totalAstronauts}
            </span>
            <span className="text-xs text-space-400 font-mono">Astronauts</span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            {missions.length > 0 ? `In mission ${missions.join(', ')}` : 'No mission records'}
          </p>
        </div>

        {/* Telemetry Observations */}
        <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Telemetry Samples</span>
            <Activity className="h-4 w-4 text-telemetry-emerald" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-space-100">
              {totalMeasurements}
            </span>
            <span className="text-xs text-space-400 font-mono">Packets</span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            {loadedCount} currently loaded into view
          </p>
        </div>

        {/* Provenance Ratio */}
        <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Data Provenance</span>
            <ShieldCheck className="h-4 w-4 text-telemetry-amber" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-telemetry-amber">
              {syntheticCount}
            </span>
            <span className="text-xs text-space-400 font-mono">Synthetic / {empiricalCount} Real</span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            NASA Space Apps model telemetry
          </p>
        </div>

        {/* Spacecraft Link */}
        <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Backend Service</span>
            <Rocket className="h-4 w-4 text-telemetry-cyan" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-mono text-xl font-bold uppercase ${
                connectionState === 'connected'
                  ? 'text-telemetry-emerald'
                  : connectionState === 'offline_demo'
                  ? 'text-telemetry-amber'
                  : 'text-rose-400'
              }`}
            >
              {connectionState.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            FastAPI telemetry router active
          </p>
        </div>
      </div>

      {/* Primary Astronaut Mission Context Card */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-space-800">
          <div>
            <span className="text-xs text-space-500 uppercase tracking-wider block">
              Active Crew Specialist Focus
            </span>
            <h2 className="text-xl font-bold text-space-100 mt-0.5">
              {selectedAstronaut?.name || 'No Astronaut Selected'}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-space-400">
              <span>Role: <strong className="text-space-200">{selectedAstronaut?.crew_role}</strong></span>
              <span>•</span>
              <span>Mission: <strong className="text-telemetry-cyan">{selectedAstronaut?.mission_name}</strong></span>
              <span>•</span>
              <span>Flight Day: <strong className="text-space-200">Day {selectedAstronaut?.mission_day}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onViewTelemetry}
              className="px-3.5 py-2 rounded bg-telemetry-cyan hover:bg-telemetry-cyan/90 text-xs font-bold text-space-950 transition-colors"
            >
              Telemetry Stream
            </button>
            {onOpenBaselines && (
              <button
                onClick={onOpenBaselines}
                className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-telemetry-cyan/50 text-xs text-telemetry-cyan transition-colors"
              >
                Personal Baselines
              </button>
            )}
            <button
              onClick={onOpenAnatomy}
              className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs text-space-200 transition-colors"
            >
              3D Anatomy Map
            </button>
            {onOpenCatalog && (
              <button
                onClick={onOpenCatalog}
                className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs text-space-300 transition-colors"
              >
                Catalog Dictionary
              </button>
            )}
          </div>
        </div>

        {/* Operational Modules Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs">
          <div
            onClick={onViewTelemetry}
            className="p-3 rounded bg-space-900 border border-space-800 hover:border-space-700 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-space-200 font-semibold">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-telemetry-cyan" />
                Telemetry Explorer
              </span>
              <ArrowRight className="h-3 w-3 text-space-500" />
            </div>
            <p className="text-[11px] text-space-400">
              Filter by operational context, countermeasure modality, and time window.
            </p>
          </div>

          <div
            onClick={onOpenBaselines}
            className="p-3 rounded bg-space-900 border border-space-800 hover:border-space-700 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-space-200 font-semibold">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-telemetry-emerald" />
                Personal Baselines
              </span>
              <ArrowRight className="h-3 w-3 text-space-500" />
            </div>
            <p className="text-[11px] text-space-400">
              Inspect statistical operational reference envelopes (Median, IQR) and explainable comparisons.
            </p>
          </div>

          <div
            onClick={onOpenCatalog}
            className="p-3 rounded bg-space-900 border border-space-800 hover:border-space-700 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-space-200 font-semibold">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                Measurement Catalog
              </span>
              <ArrowRight className="h-3 w-3 text-space-500" />
            </div>
            <p className="text-[11px] text-space-400">
              Canonical definitions, physical range guards, accepted wire aliases, and context taxonomy.
            </p>
          </div>
        </div>
      </div>

      {/* Actual Missions from API */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-space-400 mb-3">
          Active Spaceflight Missions In System
        </h3>
        {missions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {missions.map((mission) => {
              const crewInMission = astronauts.filter((a) => a.mission_name === mission);
              return (
                <div
                  key={mission}
                  className="rounded-lg bg-space-850/80 border border-space-700/70 p-4 hover:border-space-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-space-100">
                      {mission}
                    </span>
                    <span className="rounded bg-space-800 px-2 py-0.5 text-[10px] font-mono text-space-300 border border-space-700">
                      {crewInMission.length} CREW
                    </span>
                  </div>
                  <ul className="space-y-1.5 mt-3">
                    {crewInMission.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between text-xs font-mono text-space-300"
                      >
                        <span className="truncate max-w-[150px] font-medium">{a.name}</span>
                        <span className="text-[11px] text-space-400">Day {a.mission_day}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg bg-space-850 p-6 text-center border border-dashed border-space-700 text-xs font-mono text-space-400">
            No missions or astronaut records returned by backend.
          </div>
        )}
      </div>
    </div>
  );
};
