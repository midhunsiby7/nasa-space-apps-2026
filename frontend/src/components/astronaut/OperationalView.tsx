import React, { useState } from 'react';
import {
  Dumbbell,
  Bell,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Minus,
  BellRing,
  Activity,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation } from '../../types/trend';
import { AlertResponse } from '../../types/alert';
import { getMetricMeta } from '../../utils/formatters';
import { deriveHealthAnomalies } from '../reminders/healthAnomalies';
import { HealthAnomalyBanner } from '../reminders/HealthAnomalyBanner';

interface OperationalViewProps {
  astronaut: Astronaut | null;
  measurements: Measurement[];
  baselines?: BaselineResponse[];
  trends?: TrendObservation[];
  alerts?: AlertResponse[];
  onSelectMetric?: (metric: MeasurementType) => void;
  onOpenSensorDetails?: () => void;
  onOpenExercisePlan: () => void;
  onOpenReminderModal: () => void;
}

export const OperationalView: React.FC<OperationalViewProps> = ({
  astronaut,
  measurements,
  baselines = [],
  trends = [],
  alerts = [],
  onSelectMetric,
  onOpenExercisePlan,
  onOpenReminderModal,
}) => {
  const [activeCheckupTab, setActiveCheckupTab] = useState<'anomalies' | 'exercise'>('anomalies');

  if (!astronaut) {
    return (
      <div className="p-4 rounded-lg border border-space-700 bg-space-900 text-center font-mono text-xs text-space-400">
        No astronaut profile loaded.
      </div>
    );
  }

  // Derive active alert status for triage badge
  const activeAlerts = alerts.filter(
    (a) => a.status === 'active' || a.status === 'acknowledged'
  );
  const criticalCount = activeAlerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'high'
  ).length;
  const cautionCount = activeAlerts.length - criticalCount;

  const triageStatus: 'nominal' | 'caution' | 'critical' =
    criticalCount > 0 ? 'critical' : cautionCount > 0 ? 'caution' : 'nominal';

  const anomalies = deriveHealthAnomalies(alerts, measurements, baselines);

  // Core Priority Vitals
  const priorityMetrics: MeasurementType[] = [
    'heart_rate',
    'blood_pressure_systolic',
    'blood_pressure_diastolic',
    'spo2',
    'core_temperature',
    'respiratory_rate',
  ];

  const getMetricData = (key: MeasurementType) => {
    const meas = measurements.find((m) => m.measurement_type === key);
    const base = baselines.find((b) => b.measurement_type === key);
    const trend = trends.find((t) => t.measurement_type === key);
    return {
      key,
      meta: getMetricMeta(key),
      measurement: meas,
      baseline: base,
      trend,
    };
  };

  const renderTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'increasing':
      case 'sustained_deviation':
        return <TrendingUp className="h-3 w-3 text-telemetry-amber inline" />;
      case 'decreasing':
        return <TrendingDown className="h-3 w-3 text-telemetry-sky inline" />;
      default:
        return <Minus className="h-3 w-3 text-space-400 inline" />;
    }
  };

  return (
    <div className="flex flex-col space-y-3 font-mono text-xs">
      {/* 1. Quick Astronaut Identification Card */}
      <div className="rounded-lg border border-space-700 bg-space-850 p-3 shadow-hud-card">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-space-100 truncate">
                {astronaut.name}
              </span>
              <span className="rounded bg-space-750 px-1.5 py-0.2 text-[9px] text-space-300 border border-space-650">
                {astronaut.id}
              </span>
            </div>
            <div className="text-[11px] text-space-300 mt-0.5">
              {astronaut.crew_role} • {astronaut.mission_name}
            </div>
            <div className="text-[10px] text-space-400 mt-0.5 flex items-center gap-2">
              <span>Day {astronaut.mission_day || 42} in microgravity</span>
              <span>•</span>
              <span className="text-telemetry-cyan font-semibold">SYNTHETIC PROFILE</span>
            </div>
          </div>

          {/* Triage Badge */}
          <div
            className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1.5 ${
              triageStatus === 'critical'
                ? 'bg-telemetry-rose/20 border-telemetry-rose text-telemetry-rose animate-pulse'
                : triageStatus === 'caution'
                ? 'bg-telemetry-amber/20 border-telemetry-amber text-telemetry-amber'
                : 'bg-telemetry-emerald/20 border-telemetry-emerald text-telemetry-emerald'
            }`}
          >
            {triageStatus === 'critical' && <AlertOctagon className="h-3 w-3" />}
            {triageStatus === 'caution' && <AlertTriangle className="h-3 w-3" />}
            {triageStatus === 'nominal' && <CheckCircle2 className="h-3 w-3" />}
            <span>{triageStatus.toUpperCase()} STATUS</span>
          </div>
        </div>
      </div>

      {/* 2. Priority Telemetry Vitals Stream */}
      <div className="rounded-lg border border-space-700 bg-space-850 p-3 shadow-hud-card">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-space-750">
          <span className="text-[10px] font-bold uppercase tracking-wider text-space-400">
            Priority Telemetry Vitals
          </span>
          <span className="text-[9px] text-space-400">
            {measurements.length} telemetry records
          </span>
        </div>

        <div className="space-y-1.5">
          {priorityMetrics.map((metricKey) => {
            const data = getMetricData(metricKey);
            const valStr = data.measurement
              ? `${data.measurement.value.toFixed(1)}`
              : '--';
            const unit = data.meta.unit;

            return (
              <div
                key={metricKey}
                onClick={() => onSelectMetric && onSelectMetric(metricKey)}
                className="group flex items-center justify-between p-1.5 rounded bg-space-900 hover:bg-space-800 border border-space-800 hover:border-telemetry-cyan/40 cursor-pointer transition-colors"
                title={`Inspect trajectory & baseline for ${data.meta.label}`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-[11px] text-space-200 truncate group-hover:text-telemetry-cyan transition-colors">
                    {data.meta.label}
                  </div>
                  {data.baseline?.envelope && (
                    <div className="text-[9px] text-space-400">
                      BL: {data.baseline.envelope.median.toFixed(1)} {unit}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-xs text-space-100 flex items-center gap-1 justify-end">
                    <span>{valStr}</span>
                    <span className="text-[9px] text-space-400 font-normal">{unit}</span>
                    {renderTrendIcon(data.trend?.trend_direction)}
                  </div>
                  {data.trend && data.trend.sens_slope != null && (
                    <div className="text-[8px] text-space-400">
                      {data.trend.sens_slope > 0 ? '+' : ''}
                      {data.trend.sens_slope.toFixed(1)}/24h
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Daily Check-up & Personalized Countermeasures Plan Card */}
      <div className="rounded-lg border border-space-700 bg-space-850 p-3 shadow-hud-card space-y-2.5">
        {/* Tab Toggle */}
        <div className="flex items-center gap-1 border-b border-space-750 pb-2">
          <button
            type="button"
            onClick={() => setActiveCheckupTab('anomalies')}
            className={`flex-1 py-1 px-2 text-center rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeCheckupTab === 'anomalies'
                ? 'bg-space-750 text-telemetry-cyan border border-space-650'
                : 'text-space-400 hover:text-space-200 hover:bg-space-800'
            }`}
          >
            Check-up &amp; Anomalies ({anomalies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCheckupTab('exercise')}
            className={`flex-1 py-1 px-2 text-center rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeCheckupTab === 'exercise'
                ? 'bg-space-750 text-telemetry-cyan border border-space-650'
                : 'text-space-400 hover:text-space-200 hover:bg-space-800'
            }`}
          >
            Personalized Exercise Plan
          </button>
        </div>

        {activeCheckupTab === 'anomalies' ? (
          <div className="space-y-2">
            <HealthAnomalyBanner anomalies={anomalies} compact />
            <button
              type="button"
              onClick={onOpenReminderModal}
              className="w-full py-1.5 px-2.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-space-200 hover:text-telemetry-cyan text-[11px] font-mono font-medium transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-telemetry-emerald" />
                <span>Open Full Check-up Checklist</span>
              </div>
              <span className="text-[9px] text-space-400 uppercase">Details &rarr;</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Daily Exercise Adherence Reminder */}
            <div
              role="alert"
              className="rounded-lg border border-telemetry-amber/50 bg-telemetry-amber/10 p-2.5 font-mono"
            >
              <div className="flex items-center gap-1.5 text-telemetry-amber font-bold text-[10px] uppercase tracking-wider mb-1">
                <BellRing className="h-3.5 w-3.5" />
                <span>Daily Exercise Adherence Reminder</span>
              </div>
              <p className="text-[10px] text-space-200 leading-snug">
                Perform 100% of prescribed exercises daily without omission to prevent microgravity musculoskeletal atrophy and cardiovascular deconditioning.
              </p>
            </div>

            {/* Quick Preventative Focus Summary */}
            <div className="space-y-1.5 text-[10px]">
              <div className="p-1.5 rounded bg-space-900 border border-space-750 flex items-center justify-between">
                <span className="font-semibold text-space-200">Bone Mineral Loss Prevention</span>
                <span className="text-telemetry-cyan font-bold">ARED High-Load</span>
              </div>
              <div className="p-1.5 rounded bg-space-900 border border-space-750 flex items-center justify-between">
                <span className="font-semibold text-space-200">Muscle Atrophy Prevention</span>
                <span className="text-telemetry-cyan font-bold">Eccentric + Calf</span>
              </div>
              <div className="p-1.5 rounded bg-space-900 border border-space-750 flex items-center justify-between">
                <span className="font-semibold text-space-200">Cardiovascular Conditioning</span>
                <span className="text-telemetry-cyan font-bold">T2 / CEVIS</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenExercisePlan}
              className="w-full py-1.5 px-2.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-space-200 hover:text-telemetry-cyan text-[11px] font-mono font-medium transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-telemetry-cyan" />
                <span>Open Complete Prescription Plan</span>
              </div>
              <span className="text-[9px] text-telemetry-cyan uppercase">NASA-STD-3001 &rarr;</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Action Buttons */}
      <div className="space-y-2 pt-0.5">
        <button
          type="button"
          onClick={onOpenExercisePlan}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700 hover:border-telemetry-cyan/50 text-space-100 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-telemetry-cyan" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Daily Countermeasures Plan
            </span>
          </div>
          <span className="text-[10px] text-telemetry-cyan">ARED / T2</span>
        </button>

        <button
          type="button"
          onClick={onOpenReminderModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700 hover:border-telemetry-cyan/50 text-space-100 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-telemetry-amber" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Daily Health Reminders
            </span>
          </div>
          <span className="text-[10px] text-telemetry-amber">ACTIVE CHECK</span>
        </button>
      </div>
    </div>
  );
};
