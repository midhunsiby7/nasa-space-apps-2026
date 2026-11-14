import React from 'react';
import {
  Users,
  Activity,
  Brain,
  Bell,
  Heart,
  Droplet,
  Thermometer,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertOctagon,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { AssessmentResponse } from '../../types/assessment';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation, TelemetryFreshnessResponse } from '../../types/trend';
import { AlertResponse } from '../../types/alert';

interface MissionOverviewProps {
  astronauts: Astronaut[];
  measurements: Measurement[];
  selectedAstronaut: Astronaut | null;
  activeAlertsCount?: number;
  staleTelemetryCount?: number;
  latestAssessment?: AssessmentResponse | null;
  baselines?: BaselineResponse[];
  trends?: TrendObservation[];
  alerts?: AlertResponse[];
  freshness?: TelemetryFreshnessResponse | null;
  onExploreRoster: () => void;
  onViewTelemetry: () => void;
  onViewIntelligence: () => void;
  onViewAlerts: () => void;
  onOpenAnatomy: () => void;
  onSelectAstronaut?: (id: string) => void;
  onSelectMetric?: (metric: MeasurementType) => void;
}

export const MissionOverview: React.FC<MissionOverviewProps> = ({
  astronauts,
  measurements,
  selectedAstronaut,
  activeAlertsCount = 0,
  staleTelemetryCount = 0,
  latestAssessment = null,
  baselines = [],
  trends = [],
  alerts = [],
  freshness = null,
  onExploreRoster,
  onViewTelemetry,
  onViewIntelligence,
  onViewAlerts,
  onOpenAnatomy,
  onSelectAstronaut,
  onSelectMetric,
}) => {
  // Aggregate unique missions
  const missions = Array.from(new Set(astronauts.map((a) => a.mission_name)));
  const totalMeasurements = measurements.length;
  const syntheticCount = measurements.filter((m) => m.is_synthetic).length;
  const empiricalCount = totalMeasurements - syntheticCount;

  // Selected astronaut active alerts
  const astronautAlerts = selectedAstronaut
    ? alerts.filter((a) => a.astronaut_id === selectedAstronaut.id && a.status === 'active')
    : [];

  // Group latest measurement for selected astronaut
  const latestByMetric: Record<string, Measurement> = {};
  measurements.forEach((m) => {
    if (!latestByMetric[m.measurement_type] || new Date(m.measured_at) > new Date(latestByMetric[m.measurement_type].measured_at)) {
      latestByMetric[m.measurement_type] = m;
    }
  });

  // Baselines and trends maps
  const baselineMap: Record<string, BaselineResponse> = {};
  baselines.forEach((b) => {
    if (b.is_active) baselineMap[b.measurement_type] = b;
  });

  const trendMap: Record<string, TrendObservation> = {};
  trends.forEach((t) => {
    trendMap[t.measurement_type] = t;
  });

  const coreMetrics: {
    type: MeasurementType;
    label: string;
    unit: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      type: 'heart_rate',
      label: 'Heart Rate',
      unit: 'bpm',
      icon: <Heart className="h-4 w-4 text-rose-400" />,
      color: '#f43f5e',
    },
    {
      type: 'blood_oxygen',
      label: 'SpO2 Oxygen',
      unit: '%',
      icon: <Droplet className="h-4 w-4 text-sky-400" />,
      color: '#38bdf8',
    },
    {
      type: 'core_temperature',
      label: 'Core Temperature',
      unit: '°C',
      icon: <Thermometer className="h-4 w-4 text-amber-400" />,
      color: '#f59e0b',
    },
    {
      type: 'radiation_dose',
      label: 'Ionizing Radiation',
      unit: 'mSv',
      icon: <Zap className="h-4 w-4 text-purple-400" />,
      color: '#c084fc',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Top High-Level Mission KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Crew */}
        <div
          onClick={onExploreRoster}
          className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card cursor-pointer hover:border-space-600 transition-colors"
        >
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

        {/* Health Status Tier */}
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
            {activeAlertsCount > 0 ? 'Immediate operator review required' : 'All parameters nominal'}
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
              <span className="text-telemetry-emerald">
                ● {empiricalCount} emp / {syntheticCount} syn {freshness ? `(${freshness.total_metrics - freshness.stale_count}/${freshness.total_metrics} fresh)` : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 2. Selected Astronaut Operational Health Cockpit */}
      {selectedAstronaut && (
        <div className="rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-space-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-space-800 border border-telemetry-cyan/40 text-telemetry-cyan">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-base font-bold text-space-100">
                    {selectedAstronaut.name}
                  </h3>
                  <span className="font-mono text-xs text-space-400">({selectedAstronaut.id})</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-800 text-telemetry-cyan border border-space-700">
                    {selectedAstronaut.mission_name} • D+{selectedAstronaut.mission_day}
                  </span>
                </div>
                <p className="font-mono text-xs text-space-400">
                  {selectedAstronaut.crew_role} • Health Cockpit &amp; Intra-Individual Envelopes
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onOpenAnatomy}
                className="px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs font-mono text-telemetry-cyan transition-colors flex items-center gap-1.5"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>3D Anatomy</span>
              </button>
              <button
                onClick={onViewIntelligence}
                className="px-3 py-1.5 rounded bg-telemetry-cyan/20 hover:bg-telemetry-cyan/30 border border-telemetry-cyan/50 text-xs font-mono text-telemetry-cyan font-semibold transition-colors flex items-center gap-1.5"
              >
                <Brain className="h-3.5 w-3.5" />
                <span>Full Intelligence</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Key Physiological Telemetry Cards with Personal Baselines & Trend Velocity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {coreMetrics.map((m) => {
              const latest = latestByMetric[m.type];
              const base = baselineMap[m.type];
              const tr = trendMap[m.type];

              const currentVal = latest ? latest.value : null;
              const medianVal = base ? base.envelope.median : null;
              const q25 = base ? base.envelope.q25 : null;
              const q75 = base ? base.envelope.q75 : null;

              return (
                <div
                  key={m.type}
                  onClick={() => {
                    if (onSelectMetric) onSelectMetric(m.type);
                    onViewTelemetry();
                  }}
                  className="rounded-lg bg-space-900/80 border border-space-750 p-3.5 hover:border-space-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-space-400 mb-1.5">
                    <span className="font-mono text-xs font-semibold text-space-300 flex items-center gap-1.5">
                      {m.icon}
                      {m.label}
                    </span>
                    <span className="text-[10px] font-mono text-space-400">{m.unit}</span>
                  </div>

                  {/* Current Value */}
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-mono text-2xl font-bold text-space-100">
                      {currentVal !== null ? (currentVal < 1 ? currentVal.toFixed(3) : currentVal.toFixed(1)) : '—'}
                    </span>
                    {tr && (
                      <div
                        className={`flex items-center gap-1 font-mono text-[11px] font-bold ${
                          tr.trend_direction === 'increasing'
                            ? 'text-telemetry-rose'
                            : tr.trend_direction === 'decreasing'
                            ? 'text-sky-400'
                            : 'text-telemetry-emerald'
                        }`}
                      >
                        {tr.trend_direction === 'increasing' ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : tr.trend_direction === 'decreasing' ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                        <span>{tr.trend_direction.toUpperCase()}</span>
                      </div>
                    )}
                  </div>

                  {/* Baseline Envelope Comparison */}
                  <div className="mt-2.5 pt-2 border-t border-space-800 text-[11px] font-mono text-space-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Personal Median:</span>
                      <span className="text-telemetry-cyan font-semibold">
                        {medianVal !== null ? (medianVal < 1 ? medianVal.toFixed(3) : medianVal.toFixed(1)) : 'Calculating'} {m.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-space-500">
                      <span>Interquartile (Q25–Q75):</span>
                      <span>
                        {q25 !== null && q75 !== null ? `${q25.toFixed(1)} – ${q75.toFixed(1)}` : 'In-flight'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Urgent Alerts for Selected Astronaut */}
          {astronautAlerts.length > 0 && (
            <div className="rounded-lg bg-telemetry-rose/10 border border-telemetry-rose/40 p-3.5 text-xs font-mono">
              <div className="flex items-center justify-between text-telemetry-rose font-bold mb-2">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4" />
                  <span>URGENT ATTENTION ALERTS ({astronautAlerts.length})</span>
                </div>
                <button
                  onClick={onViewAlerts}
                  className="text-[11px] underline hover:text-rose-300"
                >
                  Manage in Alerts Hub &rarr;
                </button>
              </div>
              <div className="space-y-1.5">
                {astronautAlerts.slice(0, 2).map((alt) => (
                  <div
                    key={alt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-space-900/60 border border-telemetry-rose/30 text-space-200"
                  >
                    <div>
                      <span className="font-bold text-telemetry-rose mr-2">[{alt.severity.toUpperCase()}]</span>
                      <span>{alt.title}: {alt.explanation}</span>
                    </div>
                    <span className="text-[10px] text-space-400 shrink-0">
                      Status: {alt.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Deep-Space Missions Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-space-400">
            Active Exploration Missions &amp; Crew
          </h3>
          <span className="text-[11px] font-mono text-space-500">
            Click crew member to switch monitoring focus
          </span>
        </div>
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
                  {crewInMission.map((a) => {
                    const isSelected = selectedAstronaut?.id === a.id;
                    return (
                      <li
                        key={a.id}
                        onClick={() => onSelectAstronaut && onSelectAstronaut(a.id)}
                        className={`flex items-center justify-between text-xs font-mono p-1.5 rounded cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-space-800 text-telemetry-cyan border border-telemetry-cyan/30'
                            : 'text-space-300 hover:bg-space-800/50 hover:text-space-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isSelected ? (
                            <UserCheck className="h-3.5 w-3.5 text-telemetry-cyan shrink-0" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-space-600 shrink-0" />
                          )}
                          <span className="truncate">{a.name}</span>
                        </div>
                        <span className="text-[11px] text-space-400 shrink-0">Day {a.mission_day}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
