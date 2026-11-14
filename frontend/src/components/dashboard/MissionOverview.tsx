import React from 'react';
import {
  Rocket,
  Users,
  Activity,
  Brain,
  Bell,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement } from '../../types/measurement';
import { AssessmentResponse } from '../../types/assessment';

interface MissionOverviewProps {
  astronauts: Astronaut[];
  measurements: Measurement[];
  selectedAstronaut: Astronaut | null;
  activeAlertsCount?: number;
  staleTelemetryCount?: number;
  latestAssessment?: AssessmentResponse | null;
  onExploreRoster: () => void;
  onViewTelemetry: () => void;
  onViewIntelligence: () => void;
  onViewAlerts: () => void;
  onOpenAnatomy: () => void;
}

export const MissionOverview: React.FC<MissionOverviewProps> = ({
  astronauts,
  measurements,
  selectedAstronaut,
  activeAlertsCount = 0,
  staleTelemetryCount = 0,
  latestAssessment = null,
  onExploreRoster,
  onViewTelemetry,
  onViewIntelligence,
  onViewAlerts,
  onOpenAnatomy,
}) => {
  // Aggregate unique missions
  const missions = Array.from(new Set(astronauts.map((a) => a.mission_name)));
  const totalMeasurements = measurements.length;
  const syntheticCount = measurements.filter((m) => m.is_synthetic).length;
  const empiricalCount = totalMeasurements - syntheticCount;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Crew */}
        <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Monitored Crew</span>
            <Users className="h-4 w-4 text-telemetry-cyan" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-space-100">
              {astronauts.length}
            </span>
            <span className="text-xs text-space-400 font-mono">Astronauts</span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            Across {missions.length} active deep-space missions
          </p>
        </div>

        {/* Health Intelligence Status */}
        <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
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
        <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
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
              <span className="text-telemetry-emerald">● {empiricalCount} emp / {syntheticCount} syn</span>
            )}
          </p>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="rounded-lg bg-gradient-to-r from-space-850 to-space-900 border border-space-700/80 p-5 shadow-hud-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-telemetry-cyan" />
              <h2 className="text-base font-mono font-bold uppercase tracking-wide text-space-100">
                COSMOLOOKUP Mission Observation & Intelligence Deck
              </h2>
            </div>
            <p className="mt-1 text-xs text-space-300 max-w-2xl leading-relaxed">
              Real-time physiological observation, personal baseline tracking, and explainable trend intelligence for deep-space missions. Evaluate Sen's slope rates of change, inspect personal envelopes, and manage operational alerts with strict clinical safety guardrails.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onViewIntelligence}
              className="px-3.5 py-2 rounded bg-telemetry-cyan/20 hover:bg-telemetry-cyan/30 border border-telemetry-cyan/50 text-xs font-mono text-telemetry-cyan font-semibold transition-colors flex items-center gap-1.5"
            >
              <Brain className="h-3.5 w-3.5" />
              Health Intelligence
            </button>
            <button
              onClick={onViewTelemetry}
              className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs font-mono text-space-100 transition-colors"
            >
              Telemetry Stream
            </button>
            <button
              onClick={onViewAlerts}
              className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs font-mono text-space-200 transition-colors flex items-center gap-1.5"
            >
              <Bell className="h-3.5 w-3.5" />
              Alerts Hub ({activeAlertsCount})
            </button>
            <button
              onClick={onExploreRoster}
              className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs font-mono text-space-200 transition-colors"
            >
              Crew Roster
            </button>
            <button
              onClick={onOpenAnatomy}
              className="px-3.5 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs font-mono text-space-300 transition-colors"
            >
              3D Anatomy
            </button>
          </div>
        </div>
      </div>

      {/* Active Missions Breakdown */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-space-400 mb-3">
          Active Missions Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <span className="truncate max-w-[140px]">{a.name}</span>
                      <span className="text-[11px] text-space-400">Day {a.mission_day}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
