import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  ShieldAlert,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  AnatomicalStructureId,
  ANATOMICAL_STRUCTURES,
  ANATOMICAL_SYSTEMS,
} from './anatomyRegistry';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation } from '../../types/trend';
import { AlertResponse } from '../../types/alert';
import { AssessmentResponse } from '../../types/assessment';
import {
  getMetricMeta,
  formatDataQuality,
  formatProvenance,
  formatTimestamp,
} from '../../utils/formatters';

interface RegionTelemetryInspectorProps {
  structureId?: AnatomicalStructureId | null;
  regionId?: AnatomicalStructureId;
  astronaut: Astronaut | null;
  measurements: Measurement[];
  baselines?: BaselineResponse[];
  trends?: TrendObservation[];
  alerts?: AlertResponse[];
  assessment?: AssessmentResponse | null;
  selectedMetric?: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  onNavigateToChart: (metric: MeasurementType) => void;
  onNavigateToBaselines?: (metric: MeasurementType) => void;
  onNavigateToCatalog?: (metric: MeasurementType) => void;
  onDeselect?: () => void;
}

export const RegionTelemetryInspector: React.FC<RegionTelemetryInspectorProps> = ({
  structureId,
  regionId,
  astronaut,
  measurements,
  baselines = [],
  trends = [],
  alerts = [],
  assessment = null,
  selectedMetric,
  onSelectMetric,
  onNavigateToChart,
  onNavigateToBaselines,
  onNavigateToCatalog,
  onDeselect,
}) => {
  const activeStructureKey = structureId ?? regionId ?? 'heart';
  const structure = ANATOMICAL_STRUCTURES[activeStructureKey] || ANATOMICAL_STRUCTURES['heart'];
  const systemMeta = ANATOMICAL_SYSTEMS[structure.systemId];

  // Active tab within the structure's telemetry keys
  const [internalMetric, setInternalMetric] = useState<MeasurementType | null>(
    structure.telemetryKeys.length > 0 ? structure.telemetryKeys[0] : null
  );

  // Sync internal metric if structure changes or prop changes
  const activeMetric: MeasurementType | null = useMemo(() => {
    if (structure.telemetryKeys.length === 0) return null;
    if (selectedMetric && structure.telemetryKeys.includes(selectedMetric)) {
      return selectedMetric;
    }
    if (internalMetric && structure.telemetryKeys.includes(internalMetric)) {
      return internalMetric;
    }
    return structure.telemetryKeys[0];
  }, [structure, selectedMetric, internalMetric]);

  const handleMetricTabClick = (m: MeasurementType) => {
    setInternalMetric(m);
    onSelectMetric(m);
  };

  // Find latest measurement for active metric
  const latestMeasurement = useMemo(() => {
    if (!activeMetric) return null;
    return measurements
      .filter((m) => m.measurement_type === activeMetric)
      .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())[0];
  }, [measurements, activeMetric]);

  // Find active baseline for active metric
  const baseline = useMemo(() => {
    if (!activeMetric) return null;
    return baselines.find(
      (b) => b.measurement_type === activeMetric && (b.is_active ?? true)
    );
  }, [baselines, activeMetric]);

  // Find trend observation for active metric
  const trend = useMemo(() => {
    if (!activeMetric) return null;
    return trends.find((t) => t.measurement_type === activeMetric);
  }, [trends, activeMetric]);

  // Find active/acknowledged alerts for this metric
  const regionAlerts = useMemo(() => {
    if (!activeMetric) return [];
    return alerts.filter(
      (a) => a.measurement_type === activeMetric && a.status !== 'resolved'
    );
  }, [alerts, activeMetric]);

  // Find assessment findings for this metric
  const assessmentFindings = useMemo(() => {
    if (!assessment || !activeMetric) return [];
    return assessment.findings.filter((f) => f.measurement_type === activeMetric);
  }, [assessment, activeMetric]);

  const activeMeta = activeMetric ? getMetricMeta(activeMetric) : null;
  const quality = latestMeasurement ? formatDataQuality(latestMeasurement.data_quality) : null;
  const provenance = latestMeasurement ? formatProvenance(latestMeasurement.is_synthetic) : null;

  return (
    <div className="flex h-full flex-col space-y-4 overflow-y-auto pr-1">
      {/* Structure Header Card */}
      <div className="rounded-lg border border-space-700 bg-space-850 p-4 shadow-hud-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 rounded-full ring-2 ring-space-700"
                style={{ backgroundColor: structure.color }}
              />
              <h3 className="font-mono text-base font-bold text-space-100">
                {structure.label}
              </h3>
            </div>
            <p className="font-mono text-xs text-telemetry-cyan mt-0.5 flex items-center gap-1.5">
              <span>{structure.systemLabel}</span>
              {systemMeta && (
                <span className="text-[10px] text-space-400">
                  • System ID: {systemMeta.id}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {structure.isContinuousTelemetryAvailable ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" />
                STREAMING ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                <Info className="h-3 w-3" />
                PERIODIC / OFFLINE
              </span>
            )}
            {onDeselect && (
              <button
                onClick={onDeselect}
                className="rounded px-2 py-0.5 font-mono text-[10px] text-space-400 hover:text-space-200 border border-space-700 hover:bg-space-800"
                title="Deselect organ and return to whole-body view"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Physiological Function */}
        <div className="mt-3 rounded border border-space-700/60 bg-space-900/60 p-2.5 text-xs font-mono text-space-300">
          <div className="flex items-center gap-1.5 text-telemetry-cyan font-semibold text-[11px] mb-1">
            <Activity className="h-3.5 w-3.5" />
            <span>Physiological Function:</span>
          </div>
          <p className="leading-relaxed text-space-200">{structure.physiologicalFunction}</p>
        </div>

        {/* Biomedical Rationale */}
        <div className="mt-2.5 rounded border border-space-700/40 bg-space-900/40 p-2.5 text-[11px] font-mono text-space-400">
          <div className="flex items-center gap-1.5 text-space-300 font-semibold mb-1">
            <Info className="h-3.5 w-3.5 text-telemetry-cyan" />
            <span>Spaceflight Operational Rationale:</span>
          </div>
          <p className="leading-normal">{structure.scientificRationale}</p>
          {structure.clinicalProtocolNotice && (
            <p className="mt-1.5 text-space-300 border-t border-space-800 pt-1.5 italic">
              Flight Protocol: {structure.clinicalProtocolNotice}
            </p>
          )}
        </div>

        {/* Scientific Guardrail Notice */}
        <div className="mt-2.5 flex items-start gap-2 rounded bg-space-900/90 border border-telemetry-cyan/25 p-2 text-[10px] font-mono text-space-400">
          <ShieldAlert className="h-3.5 w-3.5 text-telemetry-cyan shrink-0 mt-0.5" />
          <span>
            <strong className="text-telemetry-cyan">Scientific Visualization Notice:</strong>{' '}
            This anatomical model is an illustrative visualization and is not a patient-specific medical model or clinical diagnostic tool.
          </span>
        </div>
      </div>

      {/* CONTINUOUS TELEMETRY INSPECTION SECTION */}
      {structure.isContinuousTelemetryAvailable ? (
        <div className="space-y-4">
          {/* Metric Sub-Tabs */}
          {structure.telemetryKeys.length > 1 && (
            <div className="flex flex-wrap gap-1.5 border-b border-space-700/80 pb-2">
              {structure.telemetryKeys.map((key) => {
                const isSelected = activeMetric === key;
                const mMeta = getMetricMeta(key);
                return (
                  <button
                    key={key}
                    onClick={() => handleMetricTabClick(key)}
                    className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                      isSelected
                        ? 'bg-telemetry-cyan/20 text-telemetry-cyan border border-telemetry-cyan/40 font-bold'
                        : 'bg-space-800 text-space-300 hover:bg-space-750 hover:text-space-100 border border-space-700'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: mMeta.color }}
                    />
                    <span>{mMeta.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Current Reading & Telemetry Details */}
          {activeMetric && activeMeta && (
            <div className="rounded-lg border border-space-700 bg-space-850 p-4 shadow-hud-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity
                    className="h-4 w-4"
                    style={{ color: activeMeta.color }}
                  />
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-space-200">
                    {activeMeta.label}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  {provenance && (
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[9px] border ${provenance.badgeClass}`}
                      title={provenance.description}
                    >
                      {provenance.shortLabel}
                    </span>
                  )}
                  {quality && (
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[9px] border ${quality.badgeClass}`}
                    >
                      {quality.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Value Hero */}
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-black text-space-100">
                  {latestMeasurement !== null && latestMeasurement !== undefined
                    ? latestMeasurement.value.toFixed(1)
                    : '--'}
                </span>
                <span className="font-mono text-sm text-space-400">
                  {activeMeta.unit}
                </span>
                {astronaut && (
                  <span className="ml-auto font-mono text-[10px] text-space-400">
                    Crew: {astronaut.name} ({astronaut.id})
                  </span>
                )}
              </div>

              {/* Measurement Timestamp & Sensor Source */}
              <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-space-400 border-t border-space-800 pt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-space-500" />
                  <span>
                    {latestMeasurement
                      ? formatTimestamp(latestMeasurement.measured_at)
                      : 'No live reading'}
                  </span>
                </div>
                <div>
                  Sensor: <span className="text-space-300">{latestMeasurement?.source || 'BioHarness Telemetry Stream'}</span>
                </div>
              </div>

              {/* Baseline Comparison Envelope */}
              {baseline && baseline.envelope ? (
                <div className="mt-3 rounded border border-space-700/80 bg-space-900 p-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-space-400">Personal Baseline Envelope:</span>
                    <span className="font-bold text-telemetry-cyan">
                      {baseline.envelope.q25.toFixed(1)} – {baseline.envelope.q75.toFixed(1)} {activeMeta.unit}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-space-500">
                    <span>Median: {baseline.envelope.median.toFixed(1)} {activeMeta.unit}</span>
                    <span>Status: {baseline.maturity ? `${baseline.maturity.toUpperCase()} BASELINE` : 'ACTIVE BASELINE'}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded border border-space-800 bg-space-900/60 p-2 text-center font-mono text-[11px] text-space-500">
                  No active personal baseline computed for this astronaut.
                </div>
              )}

              {/* Trend Trajectory Observation */}
              {trend ? (
                <div className="mt-3 rounded border border-space-700/80 bg-space-900 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-space-400">Empirical Trend Direction:</span>
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-space-200">
                      {trend.trend_direction === 'increasing' && (
                        <>
                          <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-amber-400">Ascending</span>
                        </>
                      )}
                      {trend.trend_direction === 'decreasing' && (
                        <>
                          <TrendingDown className="h-3.5 w-3.5 text-telemetry-cyan" />
                          <span className="text-telemetry-cyan">Descending</span>
                        </>
                      )}
                      {trend.trend_direction === 'stable' && (
                        <>
                          <Minus className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Stable</span>
                        </>
                      )}
                      {trend.trend_direction === 'sustained_deviation' && (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                          <span className="text-rose-400">Sustained Deviation</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-space-400">
                    Sen&apos;s slope: {trend.sens_slope != null ? trend.sens_slope.toFixed(3) : '0.000'} {activeMeta.unit}/hr • Sample count: {trend.sample_count}
                  </div>
                </div>
              ) : null}

              {/* Health Alerts if any */}
              {regionAlerts.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Active Telemetry Notifications ({regionAlerts.length}):</span>
                  </div>
                  {regionAlerts.map((alt) => (
                    <div
                      key={alt.id}
                      className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs font-mono text-amber-200"
                    >
                      <div className="font-bold">{alt.title}</div>
                      <div className="text-[10px] text-amber-300 mt-0.5">{alt.explanation}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Assessment Findings if any */}
              {assessmentFindings.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-space-400 font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-telemetry-cyan" />
                    <span>Clinical Assessment Findings ({assessmentFindings.length}):</span>
                  </div>
                  {assessmentFindings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-space-700 bg-space-900/80 p-2 text-xs font-mono text-space-300"
                    >
                      <div className="text-space-200">{finding.summary}</div>
                      <div className="text-[10px] text-telemetry-cyan mt-1 flex items-center gap-2">
                        <span>Status: {finding.status}</span>
                        {finding.trend && <span>• Trend: {finding.trend}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Deep Navigation Action Links */}
              <div className="mt-4 pt-3 border-t border-space-800 flex flex-wrap gap-2">
                <button
                  onClick={() => onNavigateToChart(activeMetric)}
                  className="flex items-center gap-1.5 rounded bg-space-800 hover:bg-space-750 px-3 py-1.5 font-mono text-xs text-telemetry-cyan border border-space-700 hover:border-telemetry-cyan/50 transition-colors"
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>Telemetry Explorer</span>
                  <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />
                </button>

                {onNavigateToBaselines && (
                  <button
                    onClick={() => onNavigateToBaselines(activeMetric)}
                    className="flex items-center gap-1.5 rounded bg-space-800 hover:bg-space-750 px-3 py-1.5 font-mono text-xs text-space-300 hover:text-space-100 border border-space-700 transition-colors"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Personal Baselines</span>
                  </button>
                )}

                {onNavigateToCatalog && (
                  <button
                    onClick={() => onNavigateToCatalog(activeMetric)}
                    className="flex items-center gap-1.5 rounded bg-space-800 hover:bg-space-750 px-3 py-1.5 font-mono text-xs text-space-300 hover:text-space-100 border border-space-700 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Catalog</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* OFFLINE / PERIODIC PROTOCOL NOTICE */
        <div className="rounded-lg border border-space-700 bg-space-850 p-4 shadow-hud-card space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Info className="h-4 w-4" />
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider">
              No associated measurement available
            </h4>
          </div>

          <p className="font-mono text-xs leading-relaxed text-space-300">
            This anatomical structure is monitored through scheduled in-flight testing, countermeasure exercise logs, or pre-/post-flight clinical imaging rather than continuous telemetry streaming.
          </p>

          <div className="rounded border border-space-800 bg-space-900 p-3 space-y-2 text-xs font-mono">
            <div className="font-bold text-space-200">Operational Surveillance Protocol:</div>
            <p className="text-space-400 leading-normal">
              {structure.notes || 'Tracked through mission flight rules and periodic crew health protocols.'}
            </p>
          </div>

          {structure.clinicalProtocolNotice && (
            <div className="rounded border border-purple-500/20 bg-purple-900/10 p-2.5 text-[11px] font-mono text-purple-200">
              <span className="font-bold text-purple-300">Countermeasure Rule:</span>{' '}
              {structure.clinicalProtocolNotice}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionTelemetryInspector;
