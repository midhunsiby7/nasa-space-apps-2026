import React from 'react';
import {
  X,
  Activity,
  AlertTriangle,
  ShieldCheck,
  BookOpen,
  Info,
  ChevronRight,
} from 'lucide-react';
import {
  AnatomyComponentId,
  ANATOMY_COMPONENTS,
} from './anatomyModel';
import { ComponentWarningState } from './anatomyWarnings';
import { Measurement, MeasurementType } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation } from '../../types/trend';
import { getMetricMeta } from '../../utils/formatters';

interface ComponentDetailDrawerProps {
  componentId: AnatomyComponentId | null;
  onClose: () => void;
  warningState?: ComponentWarningState;
  measurements?: Measurement[];
  baselines?: BaselineResponse[];
  trends?: TrendObservation[];
  onSelectMetric?: (metric: MeasurementType) => void;
  onNavigateToExercise?: () => void;
}

export const ComponentDetailDrawer: React.FC<ComponentDetailDrawerProps> = ({
  componentId,
  onClose,
  warningState,
  measurements = [],
  baselines = [],
  trends = [],
  onSelectMetric,
  onNavigateToExercise,
}) => {
  if (!componentId || !ANATOMY_COMPONENTS[componentId]) {
    return null;
  }

  const comp = ANATOMY_COMPONENTS[componentId];
  const warning = warningState || { level: 'nominal', activeAlertCount: 0 };

  // Relevant measurements for this component
  const relevantMeasurements = comp.telemetryKeys.map((key) => {
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
  });

  return (
    <div role="dialog" aria-label={`${comp.label} details`} className={`flex flex-col max-h-full bg-space-900/95 backdrop-blur border shadow-2xl w-full overflow-hidden rounded-xl animate-in fade-in zoom-in-95 duration-200 ${warning.level === 'critical' ? 'border-telemetry-rose/60' : warning.level === 'caution' ? 'border-telemetry-amber/60' : 'border-space-700/80'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-space-700 bg-space-950/80">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: comp.defaultColor }}
          />
          <div className="truncate">
            <h3 className="font-mono text-sm font-bold text-space-100 truncate">
              {comp.label}
            </h3>
            <span className="font-mono text-[11px] text-space-400">
              {comp.system}
            </span>
          </div>
          <span
            className={`ml-2 shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
              warning.level === 'critical'
                ? 'bg-telemetry-rose/20 border-telemetry-rose/50 text-telemetry-rose'
                : warning.level === 'caution'
                  ? 'bg-telemetry-amber/20 border-telemetry-amber/50 text-telemetry-amber'
                  : 'bg-telemetry-emerald/15 border-telemetry-emerald/40 text-telemetry-emerald'
            }`}
          >
            {warning.level === 'nominal' ? 'NOMINAL' : 'ATTENTION REQUIRED'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded text-space-400 hover:text-space-100 hover:bg-space-800 transition-colors"
          title="Close details" aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Warning Banner if Caution/Critical */}
        {warning.level !== 'nominal' && (
          <div
            className={`p-3 rounded border font-mono text-xs ${
              warning.level === 'critical'
                ? 'bg-telemetry-rose/15 border-telemetry-rose/40 text-telemetry-rose'
                : 'bg-telemetry-amber/15 border-telemetry-amber/40 text-telemetry-amber'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{warning.level === 'critical' ? 'CRITICAL - SPECIAL CARE NEEDED' : 'CAUTION - MONITOR CLOSELY'}</span>
            </div>
            <p className="text-space-200 text-[11px]">
              <strong>Why:</strong> {warning.message || 'System shift detected requiring clinical review.'}
            </p>
            {warning.sourceAlert?.explanation && (
              <p className="text-space-300 text-[11px] mt-1">{warning.sourceAlert.explanation}</p>
            )}
            {warning.activeAlertCount > 0 && (
              <p className="text-space-400 text-[10px] mt-1">{warning.activeAlertCount} active finding(s)</p>
            )}
          </div>
        )}

        {/* Anatomical Overview */}
        <div className="rounded border border-space-800 bg-space-850 p-3">
          <div className="text-[10px] font-mono uppercase text-space-400 mb-1">
            Anatomical Description
          </div>
          <p className="text-xs text-space-200 leading-relaxed">
            {comp.description}
          </p>
        </div>

        {/* Continuous Telemetry Status */}
        <div className="rounded border border-space-800 bg-space-850 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-space-400">
              Telemetry Availability
            </span>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                comp.isContinuousTelemetryAvailable
                  ? 'bg-telemetry-emerald/15 border-telemetry-emerald/30 text-telemetry-emerald'
                  : 'bg-space-800 border-space-700 text-space-400'
              }`}
            >
              {comp.isContinuousTelemetryAvailable ? 'CONTINUOUS STREAM ACTIVE' : 'NO CONTINUOUS SENSOR'}
            </span>
          </div>

          {comp.isContinuousTelemetryAvailable ? (
            <div className="space-y-2 mt-2">
              {relevantMeasurements.map(({ key, meta, measurement, baseline, trend }) => (
                <div
                  key={key}
                  onClick={() => onSelectMetric && onSelectMetric(key)}
                  className="p-2 rounded bg-space-900 border border-space-750 hover:border-telemetry-cyan/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-space-300 font-medium">
                      {meta.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-space-100">
                      {measurement ? `${measurement.value.toFixed(1)} ${meta.unit}` : '--'}
                    </span>
                  </div>

                  {baseline?.envelope && (
                    <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-space-400">
                      <span>Baseline Median:</span>
                      <span>
                        {baseline.envelope.median.toFixed(1)} {meta.unit} (IQR: {baseline.envelope.q25.toFixed(1)} - {baseline.envelope.q75.toFixed(1)})
                      </span>
                    </div>
                  )}

                  {trend && (
                    <div className="mt-0.5 flex items-center justify-between text-[10px] font-mono text-space-400">
                      <span>24h Trend:</span>
                      <span className={trend.trend_direction === 'increasing' || trend.trend_direction === 'sustained_deviation' ? 'text-telemetry-amber' : 'text-space-300'}>
                        {trend.trend_direction.toUpperCase()} ({trend.sens_slope != null ? `${trend.sens_slope.toFixed(2)} ${trend.unit}/24h` : '--'})
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-space-400 italic">
              NASA flight rules do not stream continuous telemetry for this anatomical region. Monitored through periodic clinical protocols and exercise countermeasure adherence.
            </p>
          )}
        </div>

        {/* Scientific Rationale in Microgravity */}
        <div className="rounded border border-space-800 bg-space-850 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-space-400 mb-1">
            <Info className="h-3.5 w-3.5 text-telemetry-cyan" />
            <span>Microgravity Adaptation Rationale</span>
          </div>
          <p className="text-xs text-space-300 leading-relaxed">
            {comp.scientificRationale}
          </p>
        </div>

        {/* Clinical Protocol & Countermeasures */}
        <div className="rounded border border-space-800 bg-space-850 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-space-400 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-telemetry-emerald" />
            <span>Flight Surgeon Clinical Protocol</span>
          </div>
          <p className="text-xs text-space-300 leading-relaxed mb-2">
            {comp.clinicalProtocolNotice}
          </p>

          {(comp.id === 'muscles' || comp.id === 'skeleton' || comp.id === 'heart') && onNavigateToExercise && (
            <button
              type="button"
              onClick={onNavigateToExercise}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-space-800 hover:bg-space-750 text-telemetry-cyan border border-telemetry-cyan/30 text-xs font-mono font-medium transition-colors"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Inspect Daily Countermeasure Prescription</span>
              <ChevronRight className="h-3.5 w-3.5 ml-auto" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono font-bold text-space-100 transition-colors"
        >
          DISMISS
        </button>

        {/* Contextual NASA Research Citation */}
        <div className="rounded border border-space-800/60 bg-space-950/60 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-space-400 mb-1">
            <BookOpen className="h-3.5 w-3.5 text-telemetry-purple" />
            <span>NASA OSDR Empirical Reference</span>
          </div>
          <p className="text-[11px] text-space-400 leading-relaxed">
            Curated NASA Open Science Data Repository (OSDR) spaceflight studies investigate {comp.system.toLowerCase()} responses under space microgravity and cosmic ionizing radiation. Research findings remain decoupled from operational crew telemetry.
          </p>
        </div>
      </div>
    </div>
  );
};
