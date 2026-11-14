import React from 'react';
import { Rocket, ShieldCheck, Users, Activity, Clock } from 'lucide-react';
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
        <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
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
            <span className="text-xs text-space-400 font-mono">Records</span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            {syntheticCount > 0
              ? `${syntheticCount} synthetic / ${empiricalCount} empirical records`
              : `${loadedCount} empirical records`}
          </p>
        </div>

        {/* Current Selected Day */}
        <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Flight Elapsed Day</span>
            <Clock className="h-4 w-4 text-telemetry-amber" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-space-100">
              {selectedAstronaut ? `D+${selectedAstronaut.mission_day}` : '—'}
            </span>
            <span className="text-xs text-space-400 font-mono">
              {selectedAstronaut?.mission_name || 'Select Crew'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono truncate">
            {selectedAstronaut?.name ? `${selectedAstronaut.name} (${selectedAstronaut.crew_role})` : 'No crew selected'}
          </p>
        </div>

        {/* Backend Connection & Integrity */}
        <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Service Tier</span>
            <ShieldCheck className="h-4 w-4 text-telemetry-cyan" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-mono text-xl font-bold ${
                connectionState === 'connected'
                  ? 'text-telemetry-emerald'
                  : connectionState === 'offline_demo'
                  ? 'text-telemetry-amber'
                  : 'text-rose-400'
              }`}
            >
              {connectionState === 'connected'
                ? 'FASTAPI LIVE'
                : connectionState === 'offline_demo'
                ? 'OFFLINE DEMO'
                : 'OFFLINE'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            API v1.0 • SQLite Engine
          </p>
        </div>
      </div>

      {/* Main Mission Control Overview Card */}
      <div className="rounded-lg bg-gradient-to-r from-space-850 to-space-900 border border-space-700/80 p-5 shadow-hud-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-telemetry-cyan" />
              <h2 className="text-base font-mono font-bold uppercase tracking-wide text-space-100">
                COSMOLOOKUP Mission Observation Deck
              </h2>
            </div>
            <p className="mt-1 text-xs text-space-300 max-w-2xl leading-relaxed">
              Telemetry records retrieved from backend service via REST API v1.0. Flight surgeons and researchers can inspect time-series biometric observations, verify telemetry provenance flags (<code className="text-telemetry-cyan">is_synthetic</code>), and analyze crew health parameters.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onExploreRoster}
              className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs font-mono text-space-100 transition-colors"
            >
              Inspect Crew Roster
            </button>
            <button
              onClick={onViewTelemetry}
              className="px-3.5 py-2 rounded bg-telemetry-cyan/20 hover:bg-telemetry-cyan/30 border border-telemetry-cyan/50 text-xs font-mono text-telemetry-cyan font-semibold transition-colors"
            >
              Open Telemetry Teleplot
            </button>
            <button
              onClick={onOpenAnatomy}
              className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs font-mono text-space-200 transition-colors"
            >
              3D Anatomy Wireframe
            </button>
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
