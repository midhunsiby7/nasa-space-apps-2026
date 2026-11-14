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
import { AnatomicalRegionId, ANATOMICAL_REGIONS } from './anatomyRegistry';
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
  regionId: AnatomicalRegionId;
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
}

export const RegionTelemetryInspector: React.FC<RegionTelemetryInspectorProps> = ({
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
}) => {
  const region = ANATOMICAL_REGIONS[regionId];

  // Active tab within the region's telemetry keys
  const [internalMetric, setInternalMetric] = useState<MeasurementType | null>(
    region.telemetryKeys.length > 0 ? region.telemetryKeys[0] : null
  );

  // Sync internal metric if region changes or prop changes
  const activeMetric: MeasurementType | null = useMemo(() => {
    if (region.telemetryKeys.length === 0) return null;
    if (selectedMetric && region.telemetryKeys.includes(selectedMetric)) {
      return selectedMetric;
    }
    if (internalMetric && region.telemetryKeys.includes(internalMetric)) {
      return internalMetric;
    }
    return region.telemetryKeys[0];
  }, [region, selectedMetric, internalMetric]);

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
      (b) => b.measurement_type === activeMetric && b.is_active
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
      {/* Region Header */}
      <div className="rounded-lg border border-space-700 bg-space-850 p-4 shadow-hud-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: region.color }}
              />
              <h3 className="font-mono text-base font-bold text-space-100">
                {region.label}
              </h3>
            </div>
            <p className="font-mono text-xs text-telemetry-cyan mt-0.5">
              {region.system}
            </p>
          </div>

          <div className="flex items-center">
            {region.isContinuousTelemetryAvailable ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" />
                CONTINUOUS STREAM ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                <Info className="h-3 w-3" />
                PERIODIC / OFFLINE PROTOCOL
              </span>
            )}
          </div>
        </div>

        <p className="mt-2.5 font-mono text-xs leading-relaxed text-space-300">
          {region.description}
        </p>

        {/* Scientific Rationale Accordion/Notice */}
        <div className="mt-3 rounded border border-space-700/60 bg-space-900/60 p-2.5 text-[11px] font-mono text-space-400">
          <div className="flex items-center gap-1.5 text-telemetry-cyan font-semibold mb-1">
            <Info className="h-3.5 w-3.5" />
            <span>Biomedical & Operational Rationale:</span>
          </div>
          <p className="leading-normal">{region.scientificRationale}</p>
          {region.clinicalProtocolNotice && (
            <p className="mt-1.5 text-space-400 border-t border-space-800 pt-1.5 italic">
              Flight Protocol: {region.clinicalProtocolNotice}
            </p>
          )}
        </div>

        {/* Strict Medical Guardrail Notice */}
        <div className="mt-2.5 flex items-start gap-2 rounded bg-space-900/90 border border-telemetry-cyan/25 p-2 text-[10px] font-mono text-space-400">
          <ShieldAlert className="h-3.5 w-3.5 text-telemetry-cyan shrink-0 mt-0.5" />
          <span>
            <strong className="text-telemetry-cyan">Navigation Interface Guardrail:</strong>{' '}
            Anatomical highlighting provides spatial categorization of sensors. It is NOT an organ pathology or clinical diagnosis.
          </span>
        </div>
      </div>

      {/* CONTINUOUS TELEMETRY INSPECTION SECTION */}
      {region.isContinuousTelemetryAvailable ? (
        <div className="space-y-4">
          {/* Metric Sub-Tabs */}
          {region.telemetryKeys.length > 1 && (
            <div className="flex flex-wrap gap-1.5 border-b border-space-700/80 pb-2">
              {region.telemetryKeys.map((key) => {
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
                  {latestMeasurement !== undefined && latestMeasurement !== null
                    ? latestMeasurement.value.toFixed(1)
                    : '--'}
                </span>
                <span className="font-mono text-sm font-semibold text-space-400">
                  {latestMeasurement?.unit || activeMeta.unit}
                </span>
                {astronaut && (
                  <span className="ml-auto font-mono text-[11px] text-space-400">
                    Astronaut: <span className="text-space-200">{astronaut.name}</span>
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-space-400">
                <span>
                  Timestamp:{' '}
                  {latestMeasurement
                    ? formatTimestamp(latestMeasurement.measured_at)
                    : 'Awaiting Telemetry Packet'}
                </span>
                {latestMeasurement?.source && (
                  <span className="text-space-400">Source: {latestMeasurement.source}</span>
                )}
              </div>

              {/* Quick Jump to Chart */}
              <button
                onClick={() => onNavigateToChart(activeMetric)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded bg-space-800/80 hover:bg-space-750 px-3 py-1.5 font-mono text-xs text-telemetry-cyan border border-space-700 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Plot Time-Series Stream in Telemetry Tab</span>
              </button>
            </div>
          )}

          {/* Personal Operational Baseline Comparison */}
          <div className="rounded-lg border border-space-700 bg-space-850 p-4 shadow-hud-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-telemetry-cyan" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-space-200">
                  Personal Operational Baseline
                </h4>
              </div>
              {baseline && (
                <span className="rounded bg-space-800 px-2 py-0.5 font-mono text-[10px] text-space-300 border border-space-700">
                  {(baseline.baseline_type || 'inflight').toUpperCase()} • v{baseline.version || 1} • {baseline.maturity || 'provisional'}
                </span>
              )}
            </div>

            {baseline ? (
              <div className="space-y-2.5 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-space-900 p-2 border border-space-800">
                    <span className="text-[10px] text-space-400 block">Baseline Median</span>
                    <span className="font-bold text-space-100 text-sm">
                      {baseline.envelope.median.toFixed(1)} {baseline.unit}
                    </span>
                  </div>
                  <div className="rounded bg-space-900 p-2 border border-space-800">
                    <span className="text-[10px] text-space-400 block">IQR [Q25 – Q75]</span>
                    <span className="font-bold text-space-100 text-sm">
                      {baseline.envelope.q25.toFixed(1)} – {baseline.envelope.q75.toFixed(1)} {baseline.unit}
                    </span>
                  </div>
                </div>

                {trend?.robust_z !== undefined && trend.robust_z !== null && (
                  <div className="flex items-center justify-between rounded bg-space-900/80 p-2 border border-space-800 text-[11px]">
                    <span className="text-space-400">Robust Z-Deviation:</span>
                    <span
                      className={`font-bold ${
                        Math.abs(trend.robust_z) >= 3.0
                          ? 'text-rose-400'
                          : Math.abs(trend.robust_z) >= 2.0
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {trend.robust_z > 0 ? '+' : ''}
                      {trend.robust_z.toFixed(2)} σ (MAD-scale)
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-space-400 italic">
                  Envelope calculated from {baseline.envelope.sample_count} verified readings.
                </p>
                {onNavigateToBaselines && activeMetric && (
                  <button
                    onClick={() => onNavigateToBaselines(activeMetric)}
                    className="flex w-full items-center justify-center gap-1.5 rounded bg-telemetry-cyan/15 hover:bg-telemetry-cyan/25 border border-telemetry-cyan/40 px-2.5 py-1.5 font-mono text-xs text-telemetry-cyan font-semibold transition-colors mt-2"
                  >
                    <TrendingUp className="h-3 w-3" />
                    <span>Inspect Operational Envelopes in Baselines</span>
                  </button>
                )}
                {onNavigateToCatalog && activeMetric && (
                  <button
                    onClick={() => onNavigateToCatalog(activeMetric)}
                    className="flex w-full items-center justify-center gap-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 px-2.5 py-1.5 font-mono text-xs text-space-300 hover:text-space-100 transition-colors"
                  >
                    <span>View Metric Sanity Guards in Catalog</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="font-mono text-xs text-space-400 italic">
                No finalized operational baseline registered for this astronaut and metric yet.
              </p>
            )}
          </div>

          {/* Health Trend Intelligence */}
          <div className="rounded-lg border border-space-700 bg-space-850 p-4 shadow-hud-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-telemetry-cyan" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-space-200">
                  Trend Velocity & Trajectory
                </h4>
              </div>
              {trend && (
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  {trend.trend_direction === 'increasing' && (
                    <span className="flex items-center text-rose-400 font-bold">
                      <TrendingUp className="h-3 w-3 mr-0.5" /> INCREASING
                    </span>
                  )}
                  {trend.trend_direction === 'decreasing' && (
                    <span className="flex items-center text-amber-400 font-bold">
                      <TrendingDown className="h-3 w-3 mr-0.5" /> DECREASING
                    </span>
                  )}
                  {trend.trend_direction === 'stable' && (
                    <span className="flex items-center text-emerald-400 font-bold">
                      <Minus className="h-3 w-3 mr-0.5" /> STABLE
                    </span>
                  )}
                  {trend.trend_direction === 'sustained_deviation' && (
                    <span className="flex items-center text-purple-400 font-bold">
                      <AlertTriangle className="h-3 w-3 mr-0.5" /> SUSTAINED DEVIATION
                    </span>
                  )}
                </div>
              )}
            </div>

            {trend ? (
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between rounded bg-space-900 p-2 border border-space-800">
                  <span className="text-[11px] text-space-400">Sen&apos;s Slope Rate of Change (24h):</span>
                  <span className="font-bold text-space-200">
                    {trend.sens_slope !== null && trend.sens_slope !== undefined
                      ? `${trend.sens_slope > 0 ? '+' : ''}${trend.sens_slope.toFixed(2)} ${trend.unit} / 24h`
                      : 'N/A'}
                  </span>
                </div>
                {trend.explanation && (
                  <p className="text-[11px] leading-relaxed text-space-300 bg-space-900/50 p-2 rounded border border-space-800/60">
                    {trend.explanation}
                  </p>
                )}
              </div>
            ) : (
              <p className="font-mono text-xs text-space-400 italic">
                Trend analysis calculation requires active telemetry stream.
              </p>
            )}
          </div>

          {/* Active Alerts for this Region */}
          {regionAlerts.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-3.5 shadow-hud-card">
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs font-bold mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Active Alerts for this System ({regionAlerts.length})</span>
              </div>
              <div className="space-y-2">
                {regionAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="rounded bg-space-900/90 p-2.5 border border-amber-500/30 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-200">{alt.title}</span>
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 uppercase">
                        {alt.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-space-300 mt-1">{alt.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assessment Findings for this Metric */}
          {assessmentFindings.length > 0 && (
            <div className="rounded-lg border border-space-700 bg-space-850 p-3.5 shadow-hud-card">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-space-200 mb-2">
                Clinical Assessment Notes
              </h4>
              <div className="space-y-2">
                {assessmentFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="rounded bg-space-900 p-2.5 border border-space-800 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-telemetry-cyan uppercase">
                        {finding.status}
                      </span>
                      <span className="text-space-400">Trend: {finding.trend}</span>
                    </div>
                    <p className="text-[11px] text-space-300 mt-1">{finding.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* UNAVAILABLE TELEMETRY SECTION (MUSCULOSKELETAL & OCULAR) */
        <div className="space-y-4">
          <div className="rounded-lg border border-purple-500/40 bg-purple-950/20 p-4 shadow-hud-card">
            <div className="flex items-center gap-2 text-purple-300 font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4 text-purple-400" />
              <span>Continuous In-Flight Telemetry Unavailable</span>
            </div>

            <p className="font-mono text-xs text-space-300 mt-2.5 leading-relaxed">
              In spaceflight operational medicine, this anatomical system does not utilize continuous
              streaming wearable biosensors. Telemetry is neither missing nor failing; it is
              governed by scheduled periodic diagnostic protocols.
            </p>

            {/* Crucial Scientific Warning */}
            <div className="mt-3 rounded bg-space-900/90 border border-purple-500/30 p-2.5 font-mono text-[11px] text-purple-200">
              <strong className="text-purple-300">Operational Flight Rule:</strong> Absence of continuous telemetry
              does NOT indicate nominal physiology or zero medical risk. Microgravity progressive deconditioning
              (e.g., bone mineral demineralization or cephalad optic disc edema) requires mandatory periodic evaluation.
            </div>
          </div>

          {/* System Protocol Details */}
          <div className="rounded-lg border border-space-700 bg-space-850 p-4 shadow-hud-card font-mono text-xs space-y-3">
            <h4 className="font-bold text-space-100 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-telemetry-cyan" />
              <span>Standard Flight Medical Protocol</span>
            </h4>

            {region.id === 'ocular' && (
              <div className="space-y-2 text-space-300 text-[11px] leading-relaxed">
                <p>
                  <strong>Spaceflight-Associated Neuro-ocular Syndrome (SANS):</strong> In-flight surveillance
                  follows scheduled periodic diagnostic imaging protocols (e.g., illustrative 30-to-60 day cadence per
                  NASA Spaceflight Standard Measures protocol; specific schedule defined by mission flight rules) via
                  bilateral Optical Coherence Tomography (OCT) scans, dilated funduscopic imaging, and visual acuity charts.
                </p>
                <p className="text-space-400 italic">
                  Data provenance: Periodic ophthalmology imaging packets are transmitted to Ground Flight Surgeons at Johnson Space Center (JSC).
                </p>
              </div>
            )}

            {region.id === 'musculoskeletal' && (
              <div className="space-y-2 text-space-300 text-[11px] leading-relaxed">
                <p>
                  <strong>Axial Skeleton & Muscle Mass Preservation:</strong> Managed under NASA flight rules allocating
                  2.5 hours total daily exercise time, comprising ~60–90 minutes of dedicated resistive loading on ARED
                  (Advanced Resistive Exercise Device), ~30–45 minutes of aerobic conditioning on the T2 Treadmill or
                  CEVIS cycle ergometer, plus setup and personal hygiene.
                </p>
                <p className="text-space-400 italic">
                  Bone mineral density (BMD) is formally evaluated via pre-flight and post-flight dual-energy X-ray absorptiometry (DXA).
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-space-800 flex items-center justify-between text-[10px] text-space-400">
              <span>Flight Protocol Standard: NASA-STD-3001 & Standard Measures</span>
              <span className="text-telemetry-cyan">Protocol Schedule Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
