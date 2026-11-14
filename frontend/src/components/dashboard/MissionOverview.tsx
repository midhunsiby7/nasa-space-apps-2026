import React from 'react';
import {
  Rocket,
  ShieldCheck,
  Users,
  Activity,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Brain,
  Bell,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement } from '../../types/measurement';
import { ConnectionState } from '../../types/api';
import { AssessmentResponse } from '../../types/assessment';

interface MissionOverviewProps {
  astronauts: Astronaut[];
  totalAstronauts: number;
  measurements: Measurement[];
  totalMeasurements: number;
  selectedAstronaut: Astronaut | null;
  connectionState?: ConnectionState;
  activeAlertsCount?: number;
  staleTelemetryCount?: number;
  latestAssessment?: AssessmentResponse | null;
  onExploreRoster: () => void;
  onViewTelemetry: () => void;
  onViewIntelligence: () => void;
  onViewAlerts: () => void;
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
  connectionState = 'connected',
  activeAlertsCount = 0,
  staleTelemetryCount = 0,
  latestAssessment = null,
  onExploreRoster,
  onViewTelemetry,
  onViewIntelligence,
  onViewAlerts,
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
      {/* High-Level Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Crew Roster */}
        <div
          onClick={onExploreRoster}
          className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card cursor-pointer hover:border-space-600 transition-colors"
        >
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Active Crew</span>
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

        {/* Health Intelligence Status */}
        <div
          onClick={onViewIntelligence}
          className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card cursor-pointer hover:border-space-600 transition-colors"
        >
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Health Status Tier</span>
            <Brain className="h-4 w-4 text-telemetry-cyan" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-mono text-lg font-bold uppercase ${
                latestAssessment?.overall_classification === 'routine'
                  ? 'text-telemetry-emerald'
                  : latestAssessment?.overall_classification === 'needs_attention'
                  ? 'text-telemetry-amber'
                  : latestAssessment?.overall_classification === 'medical_review_recommended'
                  ? 'text-telemetry-rose'
                  : 'text-space-200'
              }`}
            >
              {latestAssessment ? latestAssessment.overall_classification.replace(/_/g, ' ') : 'NOMINAL'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono truncate">
            {selectedAstronaut ? selectedAstronaut.name : 'Crew overview'}
          </p>
        </div>

        {/* Operational Alerts */}
        <div
          onClick={onViewAlerts}
          className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card cursor-pointer hover:border-space-600 transition-colors"
        >
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Active Alerts</span>
            <Bell className={`h-4 w-4 ${activeAlertsCount > 0 ? 'text-telemetry-rose animate-bounce' : 'text-space-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-mono text-3xl font-bold ${
                activeAlertsCount > 0 ? 'text-telemetry-rose' : 'text-telemetry-emerald'
              }`}
            >
              {activeAlertsCount}
            </span>
            <span className="text-xs text-space-400 font-mono">Unresolved</span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            {activeAlertsCount > 0 ? 'Immediate operator attention required' : 'No critical deviations pending'}
          </p>
        </div>

        {/* Telemetry Stream Freshness */}
        <div
          onClick={onViewTelemetry}
          className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card cursor-pointer hover:border-space-600 transition-colors"
        >
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Telemetry Stream</span>
            <Activity className="h-4 w-4 text-telemetry-emerald" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-space-100">
              {totalMeasurements}
            </span>
            <span className="text-xs text-space-400 font-mono">Packets</span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            {staleTelemetryCount > 0 ? (
              <span className="text-telemetry-amber font-semibold">⚠️ {staleTelemetryCount} stream(s) stale</span>
            ) : (
              <span className="text-telemetry-emerald">● {loadedCount} loaded in view</span>
            )}
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
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-telemetry-cyan" />
              <h2 className="text-base font-bold uppercase tracking-wide text-space-100">
                COSMOLOOKUP Mission Observation &amp; Intelligence Deck
              </h2>
            </div>
            {selectedAstronaut ? (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-space-400">
                <span>Crew Focus: <strong className="text-telemetry-cyan font-bold">{selectedAstronaut.name}</strong></span>
                <span>•</span>
                <span>Role: <strong className="text-space-200">{selectedAstronaut.crew_role}</strong></span>
                <span>•</span>
                <span>Mission: <strong className="text-space-200">{selectedAstronaut.mission_name}</strong></span>
                <span>•</span>
                <span>Flight Day: <strong className="text-telemetry-amber">Day {selectedAstronaut.mission_day}</strong></span>
              </div>
            ) : (
              <p className="mt-1 text-xs text-space-300 max-w-2xl leading-relaxed">
                Real-time physiological observation, personal baseline tracking, and explainable trend intelligence for deep-space missions.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onViewIntelligence}
              className="px-3.5 py-2 rounded bg-telemetry-cyan/20 hover:bg-telemetry-cyan/30 border border-telemetry-cyan/50 text-xs text-telemetry-cyan font-semibold transition-colors flex items-center gap-1.5"
            >
              <Brain className="h-3.5 w-3.5" />
              <span>Health Intelligence</span>
            </button>
            <button
              onClick={onViewTelemetry}
              className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs text-space-100 transition-colors"
            >
              Telemetry Stream
            </button>
            <button
              onClick={onViewAlerts}
              className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs text-space-200 transition-colors flex items-center gap-1.5"
            >
              <Bell className="h-3.5 w-3.5 text-telemetry-rose" />
              <span>Alerts Hub ({activeAlertsCount})</span>
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
              className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs text-space-300 transition-colors"
            >
              3D Anatomy
            </button>
            {onOpenCatalog && (
              <button
                onClick={onOpenCatalog}
                className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs text-space-300 transition-colors"
              >
                Measurement Catalog
              </button>
            )}
            <button
              onClick={onExploreRoster}
              className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs text-space-200 transition-colors"
            >
              Crew Roster
            </button>
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
export default MissionOverview;
