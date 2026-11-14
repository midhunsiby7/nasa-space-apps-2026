import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Info,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Measurement, MeasurementType } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { AnatomicalRegionId, ANATOMICAL_REGIONS } from './anatomyRegistry';
import { apiClient } from '../../services/apiClient';
import { getMetricMeta, formatTimestamp, formatDataQuality, formatProvenance } from '../../utils/formatters';

interface RegionTelemetryInspectorProps {
  regionId: AnatomicalRegionId;
  measurements: Measurement[];
  astronautId?: string | null;
  onSelectMetric: (metric: MeasurementType) => void;
  onNavigateToChart: (metric: MeasurementType) => void;
  onNavigateToBaselines?: (metric: MeasurementType) => void;
}

export const RegionTelemetryInspector: React.FC<RegionTelemetryInspectorProps> = ({
  regionId,
  measurements,
  astronautId,
  onSelectMetric,
  onNavigateToChart,
  onNavigateToBaselines,
}) => {
  const regionDef = ANATOMICAL_REGIONS[regionId];

  // Measurements matching this region's telemetry keys
  const regionMeasurements = useMemo(() => {
    return measurements.filter((m) => regionDef.telemetryKeys.includes(m.measurement_type));
  }, [measurements, regionDef]);

  // Available distinct metric keys present in loaded data for this region
  const availableMetricKeys = useMemo(() => {
    return Array.from(new Set(regionMeasurements.map((m) => m.measurement_type)));
  }, [regionMeasurements]);

  // Active channel selected within this region
  const [activeChannel, setActiveChannel] = useState<MeasurementType | null>(() => {
    return regionDef.telemetryKeys.length > 0 ? regionDef.telemetryKeys[0] : null;
  });

  // Keep active channel in sync if region changes
  const effectiveChannel = useMemo(() => {
    if (activeChannel && regionDef.telemetryKeys.includes(activeChannel)) {
      return activeChannel;
    }
    return regionDef.telemetryKeys.length > 0 ? regionDef.telemetryKeys[0] : null;
  }, [activeChannel, regionDef]);

  // Latest observation for effective channel
  const latestObservation = useMemo(() => {
    if (!effectiveChannel) return null;
    return regionMeasurements
      .filter((m) => m.measurement_type === effectiveChannel)
      .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())[0] || null;
  }, [regionMeasurements, effectiveChannel]);

  // Fetch personal baseline for this channel
  const [baseline, setBaseline] = useState<BaselineResponse | null>(null);

  useEffect(() => {
    if (!astronautId || !effectiveChannel) {
      setBaseline(null);
      return;
    }
    let isMounted = true;
    apiClient
      .getAstronautBaselineByType(astronautId, effectiveChannel, 'resting_cabin')
      .then((b) => {
        if (isMounted) setBaseline(b);
      })
      .catch(() => {
        if (isMounted) setBaseline(null);
      });

    return () => {
      isMounted = false;
    };
  }, [astronautId, effectiveChannel]);

  const meta = effectiveChannel ? getMetricMeta(effectiveChannel) : null;
  const quality = latestObservation ? formatDataQuality(latestObservation.data_quality) : null;
  const provenance = latestObservation ? formatProvenance(latestObservation.is_synthetic) : null;

  const handleChannelChange = (metric: MeasurementType) => {
    setActiveChannel(metric);
    onSelectMetric(metric);
  };

  return (
    <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header with Anatomical Zone Label */}
        <div className="flex items-center justify-between pb-3 border-b border-space-700/60">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-space-400 block">
              Zone Telemetry Inspector
            </span>
            <span
              className="font-mono text-sm font-bold uppercase"
              style={{ color: regionDef.color }}
            >
              {regionDef.label}
            </span>
          </div>

          <span className="font-mono text-[10px] text-space-400 px-2 py-0.5 rounded bg-space-900 border border-space-700">
            {regionDef.system}
          </span>
        </div>

        {/* Scientific Rationale Banner */}
        <p className="font-mono text-xs text-space-300 leading-relaxed bg-space-900/60 p-3 rounded border border-space-800">
          {regionDef.scientificRationale}
        </p>

        {/* Scientific Limitation or Peripheral Proxy Notice */}
        {regionDef.hasPeripheralProxy && (
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="font-mono text-[11px] text-amber-300 leading-tight">
              {regionDef.notes}
            </p>
          </div>
        )}

        {/* Channel Selection Tabs (if multiple channels mapped) */}
        {regionDef.telemetryKeys.length > 0 && (
          <div>
            <span className="font-mono text-[11px] font-semibold text-space-400 uppercase tracking-wider block mb-1.5">
              Mapped Telemetry Feeds ({regionDef.telemetryKeys.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {regionDef.telemetryKeys.map((key) => {
                const isSelected = effectiveChannel === key;
                const hasData = availableMetricKeys.includes(key);
                const channelMeta = getMetricMeta(key);

                return (
                  <button
                    key={key}
                    onClick={() => handleChannelChange(key)}
                    className={`px-2.5 py-1 rounded font-mono text-xs transition-colors flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan font-bold'
                        : 'bg-space-900 hover:bg-space-800 border-space-750 text-space-300'
                    }`}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: channelMeta.color }}
                    />
                    <span>{channelMeta.shortLabel}</span>
                    {!hasData && (
                      <span className="text-[9px] text-space-500" title="No samples in dataset">
                        (standby)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Metric Observation Card */}
        {effectiveChannel && latestObservation && meta ? (
          <div className="rounded-lg bg-space-900 p-4 border border-space-750 font-mono space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-space-500 block uppercase">
                  ACTIVE FEED // {effectiveChannel}
                </span>
                <span className="text-xs font-bold text-space-100">{meta.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-space-100">
                  {latestObservation.value}
                </span>
                <span className="text-xs text-space-400">{latestObservation.unit}</span>
              </div>
            </div>

            {/* Quality & Provenance Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-space-800">
              <div>
                <span className="text-space-500 block text-[10px]">DATA QUALITY:</span>
                <span className={`px-1.5 py-0.2 rounded border text-[10px] inline-block mt-0.5 ${quality?.badgeClass}`}>
                  {quality?.label}
                </span>
              </div>
              <div>
                <span className="text-space-500 block text-[10px]">DATA PROVENANCE:</span>
                <span className={`px-1.5 py-0.2 rounded border text-[10px] inline-block mt-0.5 ${provenance?.badgeClass}`}>
                  {provenance?.shortLabel}
                </span>
              </div>
            </div>

            {/* Hardware Sensor Source */}
            <div className="pt-2 border-t border-space-800 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-space-500">Origin Sensor:</span>
                <span className="text-space-200 truncate max-w-[170px]" title={latestObservation.source}>
                  {latestObservation.source || 'Source not specified'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-space-500">Observed At:</span>
                <span className="text-space-300 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(latestObservation.measured_at)}
                </span>
              </div>
              {latestObservation.context && (
                <div className="text-[11px] text-space-400 italic pt-1 border-t border-space-800/60">
                  Context: {latestObservation.context}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-space-900/50 p-6 border border-dashed border-space-700 text-center space-y-2">
            <AlertCircle className="h-7 w-7 text-space-500 mx-auto" />
            <h4 className="font-mono text-xs font-semibold text-space-300 uppercase">
              No Measurement Data Available For This Region
            </h4>
            <p className="font-mono text-[11px] text-space-400 max-w-xs mx-auto leading-relaxed">
              {regionDef.telemetryKeys.length > 0
                ? `No telemetry records found for ${regionDef.label} in the current dataset.`
                : `No physiological telemetry sensors are currently streaming from ${regionDef.label}.`}
            </p>
          </div>
        )}

        {/* Phase 4 Personal Operational Envelope Integration */}
        <div className="rounded-lg bg-space-900/80 p-3.5 border border-space-750 font-mono text-[11px] text-space-400 space-y-2">
          <div className="flex items-center justify-between text-space-300">
            <span className="font-semibold flex items-center gap-1.5 text-space-200">
              <TrendingUp className="h-3.5 w-3.5 text-telemetry-cyan" />
              Personal Operational Baseline
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-telemetry-emerald/15 border border-telemetry-emerald/30 text-telemetry-emerald font-bold">
              v2b-iqr
            </span>
          </div>

          {baseline ? (
            <div className="space-y-1 pt-1 border-t border-space-800 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-space-500">Median Reference ($Q_2$):</span>
                <span className="text-telemetry-cyan font-bold">{baseline.envelope.median} {baseline.unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-space-500">Interquartile Range ($Q_1$–$Q_3$):</span>
                <span className="text-space-200">[{baseline.envelope.q25} – {baseline.envelope.q75}]</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-space-500">
                <span>Sample Cohort: {baseline.envelope.sample_count} pts</span>
                <span>Context: {baseline.context}</span>
              </div>

              {onNavigateToBaselines && effectiveChannel && (
                <button
                  onClick={() => onNavigateToBaselines(effectiveChannel)}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-telemetry-cyan text-[11px] transition-colors"
                >
                  <ShieldCheck className="h-3 w-3" />
                  <span>Inspect Full Baseline Envelope</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-space-500 leading-relaxed">
              Operational reference envelope derived via non-parametric order statistics. Baseline activates upon calculation.
            </p>
          )}
        </div>
      </div>

      {/* Action Footer: Historical Telemetry Chart Navigation */}
      <div className="pt-4 border-t border-space-700/60 mt-4 space-y-2">
        {effectiveChannel && latestObservation ? (
          <button
            onClick={() => onNavigateToChart(effectiveChannel)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-telemetry-cyan hover:bg-telemetry-cyan/90 font-mono text-xs font-bold text-space-950 transition-colors shadow-hud-glow"
          >
            <LineChart className="h-4 w-4" />
            <span>Plot Historical Telemetry Chart</span>
          </button>
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-space-800 text-space-500 font-mono text-xs cursor-not-allowed border border-space-700"
          >
            <LineChart className="h-4 w-4" />
            <span>Telemetry Channel Standby</span>
          </button>
        )}
      </div>
    </div>
  );
};
