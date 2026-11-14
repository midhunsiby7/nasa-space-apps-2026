import React from 'react';
import {
  Rocket,
  ShieldCheck,
  Users,
  Activity,
  Brain,
  Bell,
  Heart,
  Droplet,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertOctagon,
  UserCheck,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { ConnectionState } from '../../types/api';
import { AssessmentResponse } from '../../types/assessment';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation, TelemetryFreshnessResponse } from '../../types/trend';
import { AlertResponse } from '../../types/alert';

interface MissionOverviewProps {
  astronauts: Astronaut[];
  totalAstronauts?: number;
  measurements: Measurement[];
  totalMeasurements?: number;
  connectionState?: ConnectionState;
  selectedAstronaut?: Astronaut | null;
  latestAssessment?: AssessmentResponse | null;
  baselines?: BaselineResponse[];
  trends?: TrendObservation[];
  freshnessReport?: TelemetryFreshnessResponse | null;
  freshness?: TelemetryFreshnessResponse | null;
  staleTelemetryCount?: number;
  activeAlertsCount?: number;
  alerts?: AlertResponse[];
  onExploreRoster: () => void;
  onExploreTelemetry?: () => void;
  onViewTelemetry?: () => void;
  onViewIntelligence: () => void;
  onViewAlerts: () => void;
  onOpenAnatomy: () => void;
  onOpenBaselines?: () => void;
  onOpenCatalog?: () => void;
  onSelectAstronaut?: (id: string) => void;
  onSelectMetric?: (metric: MeasurementType) => void;
}

export const MissionOverview: React.FC<MissionOverviewProps> = ({
  astronauts,
  totalAstronauts,
  measurements,
  totalMeasurements,
  freshness,
  staleTelemetryCount,
  activeAlertsCount = 0,
  connectionState = 'connected',
  selectedAstronaut,
  latestAssessment,
  baselines = [],
  trends = [],
  freshnessReport,
  alerts = [],
  onExploreRoster,
  onExploreTelemetry,
  onViewTelemetry,
  onViewIntelligence,
  onViewAlerts,
  onOpenAnatomy,
  onOpenBaselines,
  onOpenCatalog,
  onSelectAstronaut,
  onSelectMetric,
}) => {
  // Aggregate unique missions
  const missions = Array.from(new Set(astronauts.map((a) => a.mission_name)));
  const totalMeasurementsCount = totalMeasurements !== undefined ? totalMeasurements : measurements.length;
  const loadedCount = measurements.length;
  const syntheticCount = measurements.filter((m) => m.is_synthetic).length;
  const empiricalCount = loadedCount - syntheticCount;
  const activeFreshness = freshnessReport || freshness || null;
  const actualStaleCount = staleTelemetryCount ?? activeFreshness?.stale_count ?? 0;

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
      type: 'spo2',
      label: 'Oxygen Saturation (SpO₂)',
      unit: '%',
      icon: <Droplet className="h-4 w-4 text-sky-400" />,
      color: '#38bdf8',
    },
    {
      type: 'body_temperature',
      label: 'Body Temperature',
      unit: '°C',
      icon: <Thermometer className="h-4 w-4 text-amber-400" />,
      color: '#f59e0b',
    },
    {
      type: 'blood_pressure_systolic',
      label: 'Systolic Blood Pressure',
      unit: 'mmHg',
      icon: <Activity className="h-4 w-4 text-rose-400" />,
      color: '#fb7185',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Top High-Level Mission KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Monitored Crew */}
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
              {totalAstronauts !== undefined ? totalAstronauts : astronauts.length}
            </span>
            <span className="text-xs text-space-400 font-mono">Astronauts</span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            {missions.length > 0 ? `In mission ${missions.join(', ')}` : 'No mission records'}
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
            <Bell className={`h-4 w-4 ${astronautAlerts.length > 0 ? 'text-telemetry-rose animate-bounce' : 'text-space-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-mono text-3xl font-bold ${
                (activeAlertsCount || astronautAlerts.length) > 0 ? 'text-telemetry-rose' : 'text-telemetry-emerald'
              }`}
            >
              {activeAlertsCount !== undefined ? activeAlertsCount : astronautAlerts.length}
            </span>
            <span className="text-xs text-space-400 font-mono">Unresolved</span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            {astronautAlerts.length > 0 ? 'Immediate operator review required' : 'All parameters nominal'}
          </p>
        </div>

        {/* Telemetry Stream Freshness */}
        <div
          onClick={onViewTelemetry || onExploreTelemetry}
          className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card cursor-pointer hover:border-space-600 transition-colors"
        >
          <div className="flex items-center justify-between text-space-400">
            <span className="font-mono text-xs uppercase tracking-wider">Telemetry Stream</span>
            <Activity className="h-4 w-4 text-telemetry-emerald" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-space-100">
              {totalMeasurementsCount}
            </span>
            <span className="text-xs text-space-400 font-mono">Packets</span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            {actualStaleCount > 0 ? (
              <span className="text-telemetry-amber font-semibold">⚠️ {actualStaleCount} stream(s) stale</span>
            ) : (
              <span className="text-telemetry-emerald">
                ● {empiricalCount} emp / {syntheticCount} syn {activeFreshness ? `(${activeFreshness.total_metrics - activeFreshness.stale_count}/${activeFreshness.total_metrics} fresh)` : `(${loadedCount} loaded)`}
              </span>
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
              {connectionState.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-space-400 font-mono">
            FastAPI telemetry router active
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-telemetry-cyan/40 text-xs font-mono text-telemetry-cyan font-bold transition-colors"
                title="Open 3D Human Anatomy Explorer"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>3D Anatomy</span>
              </button>
              <button
                onClick={onViewTelemetry || onExploreTelemetry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 transition-colors"
                title="View Full Telemetry Stream"
              >
                <span>Telemetry</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              {onOpenBaselines && (
                <button
                  onClick={onOpenBaselines}
                  className="px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-telemetry-emerald/40 text-xs font-mono text-telemetry-emerald transition-colors flex items-center gap-1.5"
                  title="View Personal Baselines"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Baselines</span>
                </button>
              )}
              {onOpenCatalog && (
                <button
                  onClick={onOpenCatalog}
                  className="px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-purple-400/40 text-xs font-mono text-purple-300 transition-colors flex items-center gap-1.5"
                  title="View Measurement Catalog"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Catalog</span>
                </button>
              )}
              <button
                onClick={onViewIntelligence}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 transition-colors"
                title="View Health Intelligence Decision Support"
              >
                <Brain className="h-3.5 w-3.5 text-purple-400" />
                <span>Intelligence</span>
              </button>
              <button
                onClick={onViewAlerts}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 transition-colors"
                title="Open Operational Alerts Hub"
              >
                <Bell className="h-3.5 w-3.5 text-rose-400" />
                <span>Alerts ({astronautAlerts.length})</span>
              </button>
            </div>
          </div>

          {/* 4 Core Physiological Telemetry Cards with Personal Baselines & Velocity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {coreMetrics.map((metric) => {
              const reading = latestByMetric[metric.type] || (metric.type === 'spo2' ? latestByMetric['blood_oxygen'] : metric.type === 'blood_oxygen' ? latestByMetric['spo2'] : metric.type === 'body_temperature' ? latestByMetric['core_temperature'] : metric.type === 'core_temperature' ? latestByMetric['body_temperature'] : undefined);
              const baseline = baselineMap[metric.type] || (metric.type === 'spo2' ? baselineMap['blood_oxygen'] : metric.type === 'blood_oxygen' ? baselineMap['spo2'] : metric.type === 'body_temperature' ? baselineMap['core_temperature'] : metric.type === 'core_temperature' ? baselineMap['body_temperature'] : undefined);
              const trend = trendMap[metric.type] || (metric.type === 'spo2' ? trendMap['blood_oxygen'] : metric.type === 'blood_oxygen' ? trendMap['spo2'] : metric.type === 'body_temperature' ? trendMap['core_temperature'] : metric.type === 'core_temperature' ? trendMap['body_temperature'] : undefined);

              const q25 = baseline?.envelope?.q25 ?? null;
              const q75 = baseline?.envelope?.q75 ?? null;
              const median = baseline?.envelope?.median ?? null;

              const isWithinIqr =
                reading && q25 !== null && q75 !== null
                  ? reading.value >= q25 && reading.value <= q75
                  : null;

              return (
                <div
                  key={metric.type}
                  onClick={() => onSelectMetric && onSelectMetric(metric.type)}
                  className="rounded-lg bg-space-900/80 border border-space-700/60 p-3.5 hover:border-space-600 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-space-400">
                    <div className="flex items-center gap-1.5">
                      {metric.icon}
                      <span className="font-mono text-xs font-semibold group-hover:text-space-100 transition-colors">
                        {metric.label}
                      </span>
                    </div>
                    {trend && (
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        {trend.trend_direction === 'increasing' ? (
                          <span className="flex items-center text-telemetry-rose">
                            <TrendingUp className="h-3 w-3" />
                            <span>UP</span>
                          </span>
                        ) : trend.trend_direction === 'decreasing' ? (
                          <span className="flex items-center text-telemetry-cyan">
                            <TrendingDown className="h-3 w-3" />
                            <span>DOWN</span>
                          </span>
                        ) : (
                          <span className="flex items-center text-space-400">
                            <Minus className="h-3 w-3" />
                            <span>FLAT</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reading Value Hero */}
                  <div className="mt-2 flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-2xl font-bold text-space-100">
                        {reading ? reading.value : '—'}
                      </span>
                      <span className="ml-1 text-xs text-space-400 font-mono">
                        {metric.unit}
                      </span>
                    </div>

                    {/* Baseline Envelope Compliance Pill */}
                    {isWithinIqr !== null && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isWithinIqr
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {isWithinIqr ? 'WITHIN IQR' : 'OUTSIDE IQR'}
                      </span>
                    )}
                  </div>

                  {/* Intra-Individual Baseline Comparison */}
                  <div className="mt-2.5 pt-2 border-t border-space-800 text-[11px] font-mono text-space-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Baseline Median:</span>
                      <span className="text-space-200 font-semibold">
                        {median !== null ? `${median.toFixed(1)} ${metric.unit}` : 'Calculating...'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Personal IQR:</span>
                      <span className="text-space-300">
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

      {/* 3. Operational Modules Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        <div
          onClick={onViewTelemetry}
          className="p-3 rounded-lg bg-space-850 border border-space-800 hover:border-space-700 cursor-pointer transition-all space-y-1 shadow-hud-sm"
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
          onClick={onOpenBaselines || onViewIntelligence}
          className="p-3 rounded-lg bg-space-850 border border-space-800 hover:border-space-700 cursor-pointer transition-all space-y-1 shadow-hud-sm"
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
          onClick={onOpenCatalog || onViewTelemetry}
          className="p-3 rounded-lg bg-space-850 border border-space-800 hover:border-space-700 cursor-pointer transition-all space-y-1 shadow-hud-sm"
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

      {/* 4. Deep-Space Missions Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-space-400">
            Active Exploration Missions &amp; Crew
          </h3>
          <span className="text-[11px] font-mono text-space-500">
            Click crew member to switch monitoring focus
          </span>
        </div>
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
