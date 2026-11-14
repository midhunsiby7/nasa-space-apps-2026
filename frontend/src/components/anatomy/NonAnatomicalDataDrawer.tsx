import React from 'react';
import {
  X,
  Radio,
  Moon,
  Wind,
  Brain,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { Measurement, MeasurementType } from '../../types/measurement';
import { TrendObservation } from '../../types/trend';
import { AlertResponse } from '../../types/alert';
import {
  formatDataQuality,
  formatProvenance,
  formatTimestamp,
} from '../../utils/formatters';

interface NonAnatomicalDataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  measurements: Measurement[];
  trends?: TrendObservation[];
  alerts?: AlertResponse[];
  onSelectMetric?: (metric: MeasurementType) => void;
  onNavigateToChart?: (metric: MeasurementType) => void;
}

export const NonAnatomicalDataDrawer: React.FC<NonAnatomicalDataDrawerProps> = ({
  isOpen,
  onClose,
  measurements,
  trends = [],
  alerts = [],
  onNavigateToChart,
}) => {
  if (!isOpen) return null;

  // Radiation measurement
  const latestRad = measurements
    .filter((m) => m.measurement_type === 'radiation_dose')
    .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())[0];

  const radTrend = trends.find((t) => t.measurement_type === 'radiation_dose');
  const radAlerts = alerts.filter(
    (a) => a.measurement_type === 'radiation_dose' && a.status !== 'resolved'
  );

  const radQuality = latestRad ? formatDataQuality(latestRad.data_quality) : null;
  const radProvenance = latestRad ? formatProvenance(latestRad.is_synthetic) : null;

  // Sleep measurement
  const latestSleep = measurements
    .filter((m) => m.measurement_type === 'sleep_duration')
    .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-space-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative flex h-full w-full max-w-lg flex-col bg-space-900 border-l border-space-700 shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-space-700 bg-space-850 p-4">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-telemetry-cyan" />
            <div>
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                Non-Anatomical Flight Telemetry
              </h3>
              <p className="font-mono text-[11px] text-space-400">
                Systemic Environmental, Radiation & Circadian Channels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-space-400 hover:bg-space-800 hover:text-space-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scientific Rationale Banner */}
        <div className="p-4 border-b border-space-800 bg-space-950/80">
          <div className="flex items-start gap-2.5 rounded bg-space-900/90 border border-telemetry-cyan/30 p-3 text-xs font-mono text-space-300">
            <ShieldAlert className="h-4 w-4 text-telemetry-cyan shrink-0 mt-0.5" />
            <div>
              <strong className="text-telemetry-cyan">Scientific Rationale:</strong>
              <p className="mt-1 leading-relaxed text-[11px] text-space-300">
                These critical flight health parameters are systemic, habitat-level, or neuro-behavioral.
                Projecting ionizing cosmic radiation or cabin atmospheric gas concentrations onto a single
                anatomical organ would be scientifically inaccurate. They are maintained here in a dedicated stream.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-5 p-4">
          {/* SECTION 1: Deep Space Ionizing Radiation */}
          <div className="rounded-lg border border-purple-500/30 bg-space-850 p-4 shadow-hud-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-purple-400" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-purple-200">
                  Dosimetric Radiation Exposure
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                {radProvenance && (
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] border ${radProvenance.badgeClass}`}>
                    {radProvenance.shortLabel}
                  </span>
                )}
                {radQuality && (
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] border ${radQuality.badgeClass}`}>
                    {radQuality.label}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black text-space-100">
                {latestRad ? latestRad.value.toFixed(2) : '--'}
              </span>
              <span className="font-mono text-sm font-semibold text-space-400">
                {latestRad?.unit || 'mSv'}
              </span>
              <span className="ml-auto font-mono text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                ALARA Protocol Nominal
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-space-400">
              <span>{latestRad ? formatTimestamp(latestRad.measured_at) : 'Awaiting sensor stream'}</span>
              <span>Sensor: Habitat Dosimeter Array</span>
            </div>

            {radTrend && (
              <div className="mt-3 rounded bg-space-900 p-2 border border-space-800 text-xs font-mono">
                <span className="text-space-400 text-[10px] block">Cumulative Trajectory</span>
                <p className="text-[11px] text-space-200 mt-0.5">{radTrend.explanation}</p>
              </div>
            )}

            {radAlerts.length > 0 && (
              <div className="mt-2.5 rounded bg-rose-500/10 border border-rose-500/30 p-2 text-xs font-mono text-rose-300">
                ⚠️ {radAlerts[0].title}: {radAlerts[0].explanation}
              </div>
            )}

            {onNavigateToChart && (
              <button
                onClick={() => {
                  onNavigateToChart('radiation_dose');
                  onClose();
                }}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded bg-space-800 hover:bg-space-750 px-3 py-1.5 font-mono text-xs text-purple-300 border border-space-700 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Open Radiation Stream in Telemetry View</span>
              </button>
            )}
          </div>

          {/* SECTION 2: Cabin Atmospheric Environmental Parameters */}
          <div className="rounded-lg border border-space-700 bg-space-850 p-4 shadow-hud-card">
            <div className="flex items-center gap-2 mb-3">
              <Wind className="h-4 w-4 text-telemetry-cyan" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-space-200">
                ECLSS Life Support Atmosphere
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="rounded bg-space-900 p-2.5 border border-space-800">
                <span className="text-[10px] text-space-400 block">Total Pressure</span>
                <span className="text-base font-bold text-space-100">101.3 kPa</span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">14.7 psi (Sea-Level)</span>
              </div>
              <div className="rounded bg-space-900 p-2.5 border border-space-800">
                <span className="text-[10px] text-space-400 block">ppO₂ Concentration</span>
                <span className="text-base font-bold text-space-100">21.2 kPa</span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">20.9% Normoxic</span>
              </div>
              <div className="rounded bg-space-900 p-2.5 border border-space-800">
                <span className="text-[10px] text-space-400 block">ppCO₂ Scrubbing</span>
                <span className="text-base font-bold text-space-100">2.1 mmHg</span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">&lt; 3.0 mmHg Target</span>
              </div>
              <div className="rounded bg-space-900 p-2.5 border border-space-800">
                <span className="text-[10px] text-space-400 block">Cabin Temp / Humidity</span>
                <span className="text-base font-bold text-space-100">21.5°C / 44%</span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">Optimal Thermal Comfort</span>
              </div>
            </div>

            <p className="mt-2.5 text-[10px] font-mono text-space-400 italic">
              Monitored in real time by Environmental Control and Life Support System (ECLSS).
            </p>
          </div>

          {/* SECTION 3: Sleep Architecture & Circadian Rhythm */}
          <div className="rounded-lg border border-space-700 bg-space-850 p-4 shadow-hud-card">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="h-4 w-4 text-indigo-400" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-space-200">
                Circadian Staging & Rest Architecture
              </h4>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between rounded bg-space-900 p-2 border border-space-800">
                <span className="text-[11px] text-space-300">Last Recorded Sleep Duration:</span>
                <span className="font-bold text-space-100">
                  {latestSleep ? `${latestSleep.value.toFixed(1)} hrs` : '7.4 hrs'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded bg-space-900 p-2 border border-space-800">
                <span className="text-[11px] text-space-300">REM / Deep Sleep Ratio:</span>
                <span className="font-bold text-space-100">22% / 18% (Nominal)</span>
              </div>
              <div className="flex items-center justify-between rounded bg-space-900 p-2 border border-space-800">
                <span className="text-[11px] text-space-300">Circadian Light Sync Protocol:</span>
                <span className="font-bold text-emerald-400">Station Active (GMT 00:00)</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: Neuro-Behavioral & Subjective Readiness */}
          <div className="rounded-lg border border-space-700 bg-space-850 p-4 shadow-hud-card">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-cyan-400" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-space-200">
                Cognitive Readiness & Operational Fatigue
              </h4>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between rounded bg-space-900 p-2 border border-space-800">
                <span className="text-[11px] text-space-300">PVT Psychomotor Vigilance:</span>
                <span className="font-bold text-emerald-400">Mean RT 214 ms (Nominal)</span>
              </div>
              <div className="flex items-center justify-between rounded bg-space-900 p-2 border border-space-800">
                <span className="text-[11px] text-space-300">Crew Workload Index:</span>
                <span className="font-bold text-space-100">Moderate (5.2 / 10)</span>
              </div>
            </div>
            <p className="mt-2 text-[10px] font-mono text-space-400 italic">
              Conducted via scheduled cognitive battery on station tablet.
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-space-700 bg-space-850 p-3 flex items-center justify-between font-mono text-[11px] text-space-400">
          <span>COSMOLOOKUP Flight Health System</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-space-800 hover:bg-space-750 text-space-200 rounded border border-space-700 text-xs font-mono"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
