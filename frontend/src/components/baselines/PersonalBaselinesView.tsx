import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Activity,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { BaselineResponse, BaselineListResponse } from '../../types/baseline';
import { apiClient } from '../../services/apiClient';
import {
  getMetricMeta,
  formatTimestamp,
  formatDataQuality,
  formatProvenance,
  evaluateBaselineComparison,
} from '../../utils/formatters';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface PersonalBaselinesViewProps {
  astronaut: Astronaut | null;
  measurements: Measurement[];
  selectedMetric?: MeasurementType;
  onSelectMetric?: (metric: MeasurementType) => void;
  onNavigateToTelemetry?: (metric: MeasurementType) => void;
  onNavigateToAnatomy?: () => void;
}

export const PersonalBaselinesView: React.FC<PersonalBaselinesViewProps> = ({
  astronaut,
  measurements,
  selectedMetric = 'heart_rate',
  onSelectMetric,
  onNavigateToTelemetry,
  onNavigateToAnatomy,
}) => {
  const [baselines, setBaselines] = useState<BaselineResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; code: string; details?: unknown } | null>(null);

  const [activeMetric, setActiveMetric] = useState<string>(selectedMetric);
  const [selectedContext, setSelectedContext] = useState<string>('resting_cabin');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculationFeedback, setCalculationFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync active metric when prop changes
  useEffect(() => {
    if (selectedMetric && selectedMetric !== activeMetric) {
      setActiveMetric(selectedMetric);
    }
  }, [selectedMetric]);

  // Load baselines for this astronaut
  const fetchBaselines = async () => {
    if (!astronaut) return;
    setIsLoading(true);
    setError(null);
    try {
      const res: BaselineListResponse = await apiClient.getAstronautBaselines(astronaut.id);
      setBaselines(res.data);
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to retrieve astronaut baseline records.',
        code: err.code || 'BASELINE_LOAD_ERROR',
        details: err.details,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselines();
  }, [astronaut?.id]);

  // Handle recalculate / calculate baseline
  const handleCalculateBaseline = async () => {
    if (!astronaut) return;
    setIsCalculating(true);
    setCalculationFeedback(null);
    try {
      const result = await apiClient.calculateAstronautBaseline(astronaut.id, {
        measurement_type: activeMetric,
        context: selectedContext,
        include_degraded: false,
      });
      setCalculationFeedback({
        type: 'success',
        message: `Personal baseline for ${activeMetric} (${selectedContext}) calculated successfully with ${result.envelope.sample_count} observations.`,
      });
      // Refresh list
      fetchBaselines();
    } catch (err: any) {
      setCalculationFeedback({
        type: 'error',
        message: err.message || `Could not compute baseline for ${activeMetric}: Insufficient or non-comparable samples.`,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Find active baseline matching activeMetric and selectedContext
  const activeBaseline = useMemo(() => {
    return baselines.find(
      (b) =>
        b.measurement_type === activeMetric &&
        (!selectedContext || b.context === selectedContext)
    ) || null;
  }, [baselines, activeMetric, selectedContext]);

  // Find latest observation for activeMetric
  const latestObservation = useMemo(() => {
    const matching = measurements
      .filter((m) => m.measurement_type === activeMetric)
      .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime());
    return matching[0] || null;
  }, [measurements, activeMetric]);

  // Evaluate strict comparability between latest observation and active baseline
  const comparisonEval = useMemo(() => {
    if (!latestObservation) return null;
    return evaluateBaselineComparison(
      latestObservation.value,
      latestObservation.context,
      latestObservation.exercise_modality,
      latestObservation.measurement_type,
      activeBaseline
    );
  }, [latestObservation, activeBaseline]);

  const activeMeta = getMetricMeta(activeMetric);

  return (
    <div className="space-y-6">
      {/* Header & Mission Overview Bar (Workspace A) */}
      <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-telemetry-cyan" />
              <h2 className="font-mono text-base font-bold uppercase tracking-wider text-space-100">
                Personal Operational Envelopes & Physiological Baselines
              </h2>
              <span className="rounded bg-telemetry-emerald/15 px-2 py-0.5 font-mono text-[10px] text-telemetry-emerald border border-telemetry-emerald/30">
                PHASE 2B ENGINE
              </span>
            </div>
            <p className="font-mono text-xs text-space-400 mt-1.5 leading-relaxed">
              Robust non-parametric statistical baselines (Median, IQR, Gaussian robust scale IQR / 1.349) derived from intra-individual historical flight telemetry. Evaluates observations against individual operational envelopes under strictly comparable contexts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto font-mono text-xs">
            <button
              onClick={fetchBaselines}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-space-200 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-telemetry-cyan' : ''}`} />
              <span>Refresh Baselines</span>
            </button>
          </div>
        </div>

        {/* Operational Boundary Notice */}
        <div className="mt-4 p-3.5 rounded bg-space-900/80 border border-space-750 text-xs font-mono flex items-start gap-3">
          <Info className="h-4 w-4 text-telemetry-cyan shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-space-200 font-bold text-[11px] uppercase tracking-wider block">
              Decision Support Notice (v2b-iqr)
            </span>
            <p className="text-[11px] text-space-400 leading-relaxed">
              Operational envelopes represent statistical reference boundaries computed from an astronaut&apos;s own baseline cohort. They do <strong>NOT</strong> constitute medical diagnostic thresholds, aeromedical flight rules, or autonomous alerts. All clinical evaluations remain under flight surgeon purview.
            </p>
          </div>
        </div>
      </div>

      {/* Loading & Global Error States */}
      {isLoading && <LoadingSpinner label="Loading Astronaut Physiological Baseline Profiles..." size="lg" />}

      {error && !isLoading && (
        <ErrorMessage
          title={`Baseline Service Error [${error.code}]`}
          message={error.message}
          details={error.details ? JSON.stringify(error.details, null, 2) : undefined}
          onRetry={fetchBaselines}
        />
      )}

      {!isLoading && (
        <>
          {/* Main Workspaces Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Metric Selector & Current Observation vs. Personal Baseline (Workspace B & C) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Metric & Context Filter Controls */}
              <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-space-300 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-telemetry-cyan" />
                    Target Physiological Channel
                  </span>
                  <span className="text-[10px] text-space-500">
                    {baselines.length} Baseline Envelopes Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Metric Dropdown */}
                  <div>
                    <label className="text-[10px] text-space-400 block mb-1">MEASUREMENT METRIC:</label>
                    <select
                      value={activeMetric}
                      onChange={(e) => {
                        const m = e.target.value;
                        setActiveMetric(m);
                        if (onSelectMetric) onSelectMetric(m);
                      }}
                      className="w-full px-3 py-1.5 rounded bg-space-900 border border-space-700 text-xs text-space-100 focus:outline-none focus:border-telemetry-cyan"
                    >
                      <option value="heart_rate">Heart Rate (heart_rate)</option>
                      <option value="spo2">Oxygen Saturation (spo2)</option>
                      <option value="body_temperature">Body Temperature (body_temperature)</option>
                      <option value="core_temperature">Core Temperature (core_temperature)</option>
                      <option value="respiratory_rate">Respiratory Rate (respiratory_rate)</option>
                      <option value="blood_pressure_systolic">Systolic Blood Pressure</option>
                      <option value="blood_pressure_diastolic">Diastolic Blood Pressure</option>
                      <option value="sleep_duration">Sleep Duration</option>
                      <option value="radiation_dose">Radiation Dose</option>
                    </select>
                  </div>

                  {/* Context Dropdown */}
                  <div>
                    <label className="text-[10px] text-space-400 block mb-1">OPERATIONAL CONTEXT:</label>
                    <select
                      value={selectedContext}
                      onChange={(e) => setSelectedContext(e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-space-900 border border-space-700 text-xs text-space-100 focus:outline-none focus:border-telemetry-cyan"
                    >
                      <option value="resting_cabin">Resting Cabin (Habitat Tier A)</option>
                      <option value="sleep_cycle">Sleep Cycle (Circadian Tier A)</option>
                      <option value="exercise_active">Active Exercise (Countermeasure Tier A)</option>
                      <option value="exercise_recovery">Exercise Recovery (Countermeasure Tier A)</option>
                    </select>
                  </div>
                </div>

                {/* Calculate / Refresh Action */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-space-800">
                  <div className="text-[11px] text-space-400">
                    Engine: <code className="text-telemetry-cyan">v2b-iqr</code> non-parametric order statistics
                  </div>

                  <button
                    onClick={handleCalculateBaseline}
                    disabled={isCalculating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-telemetry-cyan/20 hover:bg-telemetry-cyan/30 border border-telemetry-cyan/60 text-telemetry-cyan text-xs font-bold transition-colors"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
                    <span>{isCalculating ? 'Computing Baseline...' : 'Calculate / Refresh Baseline'}</span>
                  </button>
                </div>

                {/* Calculation Feedback Banner */}
                {calculationFeedback && (
                  <div
                    className={`p-2.5 rounded text-xs border flex items-start gap-2 ${
                      calculationFeedback.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {calculationFeedback.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{calculationFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Workspace C: Current Observation vs. Personal Baseline Card */}
              <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-space-800 font-mono">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-telemetry-cyan" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-space-100">
                      Observation vs. Personal Baseline Comparison
                    </h3>
                  </div>
                  <span className="text-xs text-space-400">
                    {activeMeta.label} (<code className="text-telemetry-cyan">{activeMetric}</code>)
                  </span>
                </div>

                {latestObservation && activeBaseline ? (
                  <div className="space-y-4 font-mono">
                    {/* Numbers Comparison Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Latest Observation */}
                      <div className="p-3.5 rounded bg-space-900 border border-space-750">
                        <span className="text-[10px] text-space-400 uppercase block mb-1">
                          LATEST OBSERVATION:
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-space-100">
                            {latestObservation.value}
                          </span>
                          <span className="text-xs text-space-400">{latestObservation.unit}</span>
                        </div>
                        <div className="text-[10px] text-space-500 mt-1 truncate">
                          Observed: {formatTimestamp(latestObservation.measured_at)}
                        </div>
                      </div>

                      {/* Personal Baseline Median */}
                      <div className="p-3.5 rounded bg-space-900 border border-space-750">
                        <span className="text-[10px] text-space-400 uppercase block mb-1">
                          PERSONAL MEDIAN ($Q_2$):
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-telemetry-cyan">
                            {activeBaseline.envelope.median}
                          </span>
                          <span className="text-xs text-space-400">{activeBaseline.unit}</span>
                        </div>
                        <div className="text-[10px] text-space-500 mt-1">
                          IQR: [{activeBaseline.envelope.q25} – {activeBaseline.envelope.q75}]
                        </div>
                      </div>

                      {/* Comparison Offset (Delta) */}
                      <div className="p-3.5 rounded bg-space-900 border border-space-750">
                        <span className="text-[10px] text-space-400 uppercase block mb-1">
                          BASELINE OFFSET ($\Delta$):
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={`text-2xl font-black ${
                              comparisonEval?.isWithinIqr
                                ? 'text-telemetry-emerald'
                                : 'text-telemetry-amber'
                            }`}
                          >
                            {comparisonEval ? (comparisonEval.absoluteDelta > 0 ? `+${comparisonEval.absoluteDelta}` : comparisonEval.absoluteDelta) : '—'}
                          </span>
                          <span className="text-xs text-space-400">{activeBaseline.unit}</span>
                        </div>
                        {comparisonEval?.percentDelta !== null && comparisonEval?.percentDelta !== undefined && (
                          <div className="text-[10px] text-space-400 mt-1">
                            {comparisonEval.percentDelta > 0 ? `+${comparisonEval.percentDelta}%` : `${comparisonEval.percentDelta}%`} relative offset
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statistical Operational Envelope Graphical Bar */}
                    <div className="p-4 rounded bg-space-900/90 border border-space-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-space-400">
                        <span>Personal Operational Range (Min – Max)</span>
                        <span className="font-semibold text-space-200">
                          {activeBaseline.envelope.min_value} – {activeBaseline.envelope.max_value} {activeBaseline.unit}
                        </span>
                      </div>

                      {/* Gauge visualization of IQR and Observed Value */}
                      <div className="relative w-full h-8 bg-space-950 rounded border border-space-800 overflow-hidden flex items-center px-2">
                        {/* IQR reference envelope band */}
                        <div
                          className="absolute h-full bg-telemetry-cyan/15 border-x border-telemetry-cyan/40 flex items-center justify-center text-[9px] text-telemetry-cyan font-bold"
                          style={{
                            left: '25%',
                            width: '50%',
                          }}
                        >
                          IQR Envelope [Q1: {activeBaseline.envelope.q25} — Q3: {activeBaseline.envelope.q75}]
                        </div>

                        {/* Baseline Median Marker */}
                        <div
                          className="absolute h-full w-0.5 bg-telemetry-cyan z-10"
                          style={{ left: '50%' }}
                          title={`Personal Median: ${activeBaseline.envelope.median}`}
                        />

                        {/* Current Observation Marker */}
                        <div
                          className="absolute top-1 bottom-1 w-2.5 rounded-full bg-telemetry-emerald shadow-lg border border-white z-20 transition-all"
                          style={{
                            left: comparisonEval?.isWithinIqr ? '52%' : '78%',
                          }}
                          title={`Current Observation: ${latestObservation.value} ${latestObservation.unit}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-space-500 pt-1">
                        <span>Min: {activeBaseline.envelope.min_value}</span>
                        <span className="text-telemetry-cyan font-semibold">Median: {activeBaseline.envelope.median}</span>
                        <span>Max: {activeBaseline.envelope.max_value}</span>
                      </div>
                    </div>

                    {/* Comparability Check Status Banner */}
                    <div
                      className={`p-3 rounded border text-xs flex items-start gap-2.5 ${
                        comparisonEval?.isComparable
                          ? comparisonEval.isWithinIqr
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {comparisonEval?.isComparable ? (
                        comparisonEval.isWithinIqr ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                        ) : (
                          <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <span className="font-bold text-[11px] uppercase tracking-wider block">
                          {comparisonEval?.isComparable
                            ? comparisonEval.isWithinIqr
                              ? 'Within Intra-Individual Operational Envelope'
                              : 'Outside Interquartile Range [Q1, Q3]'
                            : 'Comparability Rejection'}
                        </span>
                        <p className="text-[11px] leading-relaxed">
                          {comparisonEval?.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded bg-space-900 border border-space-800 text-center font-mono space-y-2">
                    <HelpCircle className="h-8 w-8 text-space-500 mx-auto" />
                    <h4 className="text-xs font-bold text-space-300 uppercase">
                      Baseline Envelope Not Formulated Yet
                    </h4>
                    <p className="text-[11px] text-space-400 max-w-sm mx-auto">
                      No calculated personal baseline exists for metric <code className="text-telemetry-cyan">{activeMetric}</code> under context <code className="text-telemetry-cyan">{selectedContext}</code>.
                    </p>
                    <button
                      onClick={handleCalculateBaseline}
                      disabled={isCalculating}
                      className="mt-2 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs text-space-200"
                    >
                      Compute Initial Baseline Now
                    </button>
                  </div>
                )}
              </div>

              {/* Workspace B: Full Statistical Baseline Specification Table */}
              {activeBaseline && (
                <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card space-y-3 font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-space-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-space-200">
                      Statistical Envelope Parameters
                    </span>
                    <span className="text-[10px] text-space-400">
                      ID: <code className="text-telemetry-cyan">{activeBaseline.id}</code>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-space-900 border border-space-800">
                      <span className="text-[10px] text-space-500 block">MEDIAN ($Q_2$):</span>
                      <span className="text-sm font-bold text-space-100">{activeBaseline.envelope.median} {activeBaseline.unit}</span>
                    </div>
                    <div className="p-2.5 rounded bg-space-900 border border-space-800">
                      <span className="text-[10px] text-space-500 block">Q1 / 25TH %ILE:</span>
                      <span className="text-sm font-bold text-space-100">{activeBaseline.envelope.q25} {activeBaseline.unit}</span>
                    </div>
                    <div className="p-2.5 rounded bg-space-900 border border-space-800">
                      <span className="text-[10px] text-space-500 block">Q3 / 75TH %ILE:</span>
                      <span className="text-sm font-bold text-space-100">{activeBaseline.envelope.q75} {activeBaseline.unit}</span>
                    </div>
                    <div className="p-2.5 rounded bg-space-900 border border-space-800">
                      <span className="text-[10px] text-space-500 block">IQR SCALE:</span>
                      <span className="text-sm font-bold text-telemetry-cyan">{activeBaseline.envelope.iqr} {activeBaseline.unit}</span>
                    </div>
                    <div className="p-2.5 rounded bg-space-900 border border-space-800">
                      <span className="text-[10px] text-space-500 block">ROBUST SCALE (IQR / 1.349):</span>
                      <span className="text-sm font-bold text-space-100">{activeBaseline.envelope.robust_scale_iqr}</span>
                    </div>
                    <div className="p-2.5 rounded bg-space-900 border border-space-800">
                      <span className="text-[10px] text-space-500 block">SAMPLE MEAN ($\mu$):</span>
                      <span className="text-sm font-bold text-space-100">{activeBaseline.envelope.mean} {activeBaseline.unit}</span>
                    </div>
                    <div className="p-2.5 rounded bg-space-900 border border-space-800">
                      <span className="text-[10px] text-space-500 block">SAMPLE STD DEV ($s$):</span>
                      <span className="text-sm font-bold text-space-100">{activeBaseline.envelope.std_dev}</span>
                    </div>
                    <div className="p-2.5 rounded bg-space-900 border border-space-800">
                      <span className="text-[10px] text-space-500 block">VALID SAMPLES:</span>
                      <span className="text-sm font-bold text-telemetry-emerald">{activeBaseline.envelope.sample_count} pts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 Cols: Workspace E & F - Explainable Health Observations & Quality */}
            <div className="lg:col-span-5 space-y-6">
              {/* Workspace E: Explainable Health Observation Panel */}
              <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card space-y-4 font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-space-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-telemetry-cyan" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-space-100">
                      Explainable Health Observation
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-space-900 text-telemetry-cyan border border-space-750">
                    EVIDENCE AUDIT
                  </span>
                </div>

                {latestObservation ? (
                  <div className="space-y-3 text-xs">
                    {/* Item 1 & 2: Measurement & Value */}
                    <div className="p-3 rounded bg-space-900 border border-space-800 space-y-1">
                      <span className="text-[10px] text-space-500 block">1. TARGET OBSERVATION:</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-space-100 font-bold">{activeMeta.label}</span>
                        <span className="text-space-200 font-black text-sm">
                          {latestObservation.value} {latestObservation.unit}
                        </span>
                      </div>
                      <span className="text-[10px] text-space-400 block">
                        Measured at: {formatTimestamp(latestObservation.measured_at)}
                      </span>
                    </div>

                    {/* Item 4 & 5: Baseline & Sample Count */}
                    <div className="p-3 rounded bg-space-900 border border-space-800 space-y-1">
                      <span className="text-[10px] text-space-500 block">2. REFERENCE BASELINE USED:</span>
                      {activeBaseline ? (
                        <>
                          <div className="flex items-baseline justify-between text-space-200">
                            <span>Median: {activeBaseline.envelope.median} {activeBaseline.unit}</span>
                            <span>IQR: {activeBaseline.envelope.iqr} {activeBaseline.unit}</span>
                          </div>
                          <span className="text-[10px] text-space-400 block">
                            Derived from {activeBaseline.envelope.sample_count} comparable measurements in window.
                          </span>
                        </>
                      ) : (
                        <span className="text-space-400 italic">No baseline calculated for this context.</span>
                      )}
                    </div>

                    {/* Item 5 & 6: Comparability & Context */}
                    <div className="p-3 rounded bg-space-900 border border-space-800 space-y-1">
                      <span className="text-[10px] text-space-500 block">3. CONTEXT COMPARABILITY:</span>
                      <div className="flex items-center gap-2">
                        {comparisonEval?.isComparable ? (
                          <span className="text-telemetry-emerald font-bold">VALID COMPARISON</span>
                        ) : (
                          <span className="text-rose-400 font-bold">NON-COMPARABLE</span>
                        )}
                        <span className="text-[10px] text-space-400">
                          (Context: {latestObservation.context || 'unspecified'})
                        </span>
                      </div>
                      <p className="text-[10px] text-space-400 leading-relaxed">
                        {comparisonEval?.reason}
                      </p>
                    </div>

                    {/* Item 7 & 8: Data Quality & Hardware Sensor Source */}
                    <div className="p-3 rounded bg-space-900 border border-space-800 space-y-1">
                      <span className="text-[10px] text-space-500 block">4. SENSOR HARDWARE & QUALITY:</span>
                      <div className="flex items-center justify-between">
                        <span className="text-space-200 truncate">
                          {latestObservation.source || 'Source not specified'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] border ${formatDataQuality(latestObservation.data_quality).badgeClass}`}>
                          {formatDataQuality(latestObservation.data_quality).label}
                        </span>
                      </div>
                      {latestObservation.sensor_model && (
                        <div className="text-[10px] text-space-500">
                          Model: {latestObservation.sensor_model}
                        </div>
                      )}
                    </div>

                    {/* Item 9: Provenance & Boundaries */}
                    <div className="p-3 rounded bg-space-900 border border-space-800 space-y-1">
                      <span className="text-[10px] text-space-500 block">5. PROVENANCE & LIMITATIONS:</span>
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] border ${formatProvenance(latestObservation.is_synthetic).badgeClass}`}>
                          {formatProvenance(latestObservation.is_synthetic).label}
                        </span>
                        <span className="text-[10px] text-space-500">
                          Algorithm: v2b-iqr
                        </span>
                      </div>
                      <p className="text-[10px] text-space-500 leading-relaxed pt-1">
                        Statistical difference from personal median is an observational marker, not an autonomous flight rule or medical diagnosis.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-space-500 text-xs">
                    No active observations recorded for {activeMetric}.
                  </div>
                )}
              </div>

              {/* Workspace F: Baseline Quality & Maturity Summary */}
              {activeBaseline && (
                <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card space-y-3 font-mono">
                  <div className="flex items-center gap-2 pb-2 border-b border-space-800 text-space-200 text-xs font-bold uppercase tracking-wider">
                    <Database className="h-4 w-4 text-telemetry-cyan" />
                    <span>Baseline Cohort Quality Summary</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-space-900 border border-space-800">
                      <span className="text-[10px] text-space-500 block">NOMINAL READINGS:</span>
                      <span className="text-sm font-bold text-telemetry-emerald">
                        {activeBaseline.quality_summary.nominal}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-space-900 border border-space-800">
                      <span className="text-[10px] text-space-500 block">DEGRADED READINGS:</span>
                      <span className="text-sm font-bold text-space-300">
                        {activeBaseline.quality_summary.degraded}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-space-400 space-y-1 pt-1">
                    <div>Window Start: <span className="text-space-200">{formatTimestamp(activeBaseline.envelope.window_start || '')}</span></div>
                    <div>Window End: <span className="text-space-200">{formatTimestamp(activeBaseline.envelope.window_end || '')}</span></div>
                    <div>Calculated At: <span className="text-space-200">{formatTimestamp(activeBaseline.calculated_at)}</span></div>
                  </div>
                </div>
              )}

              {/* Cross-Module Navigation Shortcuts */}
              <div className="rounded-lg bg-space-850 p-4 border border-space-750 font-mono space-y-2">
                <span className="text-[11px] font-bold text-space-300 uppercase tracking-wider block">
                  Cross-Module Exploration
                </span>
                {onNavigateToTelemetry && (
                  <button
                    onClick={() => onNavigateToTelemetry(activeMetric)}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-space-900 hover:bg-space-800 border border-space-750 text-xs text-telemetry-cyan transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5" />
                      Plot In Historical Telemetry Explorer
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
                {onNavigateToAnatomy && (
                  <button
                    onClick={onNavigateToAnatomy}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-space-900 hover:bg-space-800 border border-space-750 text-xs text-space-200 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-telemetry-cyan" />
                      View On 3D Human Anatomy Map
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
