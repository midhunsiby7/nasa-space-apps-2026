import React, { useState, useMemo } from 'react';
import {
  Activity,
  LineChart,
  Info,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Measurement, MeasurementType } from '../../types/measurement';
import { AnatomicalRegionId, ANATOMICAL_REGIONS } from './anatomyRegistry';
import { getMetricMeta, formatTimestamp, formatDataQuality, formatProvenance } from '../../utils/formatters';

interface RegionTelemetryInspectorProps {
  regionId: AnatomicalRegionId;
  measurements: Measurement[];
  onSelectMetric: (metric: MeasurementType) => void;
  onNavigateToChart: (metric: MeasurementType) => void;
}

export const RegionTelemetryInspector: React.FC<RegionTelemetryInspectorProps> = ({
  regionId,
  measurements,
  onSelectMetric,
  onNavigateToChart,
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
  }, [effectiveChannel, regionMeasurements]);

  const meta = effectiveChannel ? getMetricMeta(effectiveChannel, latestObservation?.unit) : null;
  const quality = latestObservation ? formatDataQuality(latestObservation.data_quality) : null;
  const provenance = latestObservation ? formatProvenance(latestObservation.is_synthetic) : null;

  return (
    <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header: Region Label & Anatomical System */}
        <div className="border-b border-space-700/60 pb-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded bg-space-800 border border-space-700 text-space-300">
              {regionDef.system}
            </span>
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: regionDef.color }}
            />
          </div>
          <h3 className="font-mono text-base font-bold text-space-100 mt-2">
            {regionDef.label}
          </h3>
          <p className="font-mono text-xs text-space-300 mt-1 leading-relaxed">
            {regionDef.description}
          </p>
        </div>

        {/* Scientific Rationale & Nuance */}
        <div className="rounded bg-space-900/60 p-3 border border-space-750 text-xs font-mono text-space-300 space-y-1.5">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-telemetry-cyan shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-space-200 block uppercase">
                Scientific Rationale:
              </span>
              <p className="text-[11px] text-space-400 leading-relaxed">
                {regionDef.scientificRationale}
              </p>
            </div>
          </div>
          {regionDef.notes && (
            <p className="text-[10px] text-space-500 italic border-t border-space-800 pt-1.5">
              Notice: {regionDef.notes}
            </p>
          )}
        </div>

        {/* Region Channels Selector (if multiple metrics mapped) */}
        {regionDef.telemetryKeys.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-space-400">
                Associated Telemetry Channels ({regionDef.telemetryKeys.length})
              </span>
              <span className="text-[10px] font-mono text-space-500">
                {availableMetricKeys.length} Available in Stream
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {regionDef.telemetryKeys.map((key) => {
                const kMeta = getMetricMeta(key);
                const isSelected = effectiveChannel === key;
                const isAvailable = availableMetricKeys.includes(key);

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveChannel(key);
                      onSelectMetric(key);
                    }}
                    className={`flex items-center justify-between p-2 rounded text-left font-mono text-xs border transition-colors ${
                      isSelected
                        ? 'bg-space-800 text-space-100 border-telemetry-cyan font-semibold shadow-sm'
                        : 'bg-space-900/60 text-space-400 border-space-700/60 hover:bg-space-800/40 hover:text-space-200'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <span className="block truncate">{kMeta.label}</span>
                      <span className="text-[10px] text-space-500">{kMeta.unit}</span>
                    </div>
                    {isAvailable ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-telemetry-emerald shrink-0" />
                    ) : (
                      <span className="text-[10px] text-space-500 uppercase shrink-0">Off-duty</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Observation Card or Empty State */}
        {latestObservation && meta ? (
          <div className="rounded-lg bg-space-900 p-4 border border-space-700 space-y-3 font-mono">
            <div className="flex items-baseline justify-between border-b border-space-800 pb-2.5">
              <div>
                <span className="text-[10px] text-space-400 uppercase tracking-wide block">
                  Latest Observation:
                </span>
                <span className="text-sm font-bold text-space-100 flex items-center gap-1.5 mt-0.5">
                  <Activity className="h-3.5 w-3.5 text-telemetry-cyan" />
                  {meta.label}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-space-100">
                  {latestObservation.value}
                </span>
                <span className="text-xs text-space-400 font-normal ml-1">
                  {latestObservation.unit}
                </span>
              </div>
            </div>

            {/* Quality & Provenance Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-space-950/60 border border-space-800">
                <span className="text-space-500 text-[10px] block mb-0.5">DATA QUALITY</span>
                <span className={`px-1 rounded border text-[10px] inline-block ${quality?.badgeClass}`}>
                  {quality?.label}
                </span>
              </div>
              <div className="p-2 rounded bg-space-950/60 border border-space-800">
                <span className="text-space-500 text-[10px] block mb-0.5">PROVENANCE</span>
                <span className={`px-1 rounded border text-[10px] inline-block ${provenance?.badgeClass}`}>
                  {provenance?.shortLabel}
                </span>
              </div>
            </div>

            {/* Sensor & Context */}
            <div className="space-y-1 text-xs pt-1 text-space-300">
              <div className="flex justify-between text-[11px]">
                <span className="text-space-400">Sensor Origin:</span>
                <span className="text-space-200 truncate max-w-[170px]">{latestObservation.source}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-space-400">Observed At:</span>
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

        {/* Future Baseline & Trend Engine Slot (Phase 2 Baseline Specification Ready) */}
        <div className="rounded-lg bg-space-900/30 p-3 border border-space-750 font-mono text-[11px] text-space-400 space-y-1">
          <div className="flex items-center justify-between text-space-300">
            <span className="font-semibold flex items-center gap-1.5 text-space-300">
              <TrendingUp className="h-3.5 w-3.5 text-telemetry-amber" />
              Personal Baseline &amp; Trend Engine
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              Phase 2 Design
            </span>
          </div>
          <p className="text-[10px] text-space-500 leading-relaxed">
            Architectural slots prepared for robust deviation (<code className="text-space-400">Z_IQR</code>) and in-flight baseline evaluation per <code className="text-space-400">PHASE_2_BASELINE_DESIGN.md</code>.
          </p>
        </div>
      </div>

      {/* Action Footer: Historical Telemetry Chart Navigation */}
      <div className="pt-4 border-t border-space-700/60 mt-4">
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
