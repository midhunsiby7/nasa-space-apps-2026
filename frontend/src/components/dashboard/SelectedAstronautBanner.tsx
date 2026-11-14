import React from 'react';
import { User, Calendar, Shield, ExternalLink } from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement } from '../../types/measurement';
import { formatProvenance, getMetricMeta } from '../../utils/formatters';

interface SelectedAstronautBannerProps {
  astronaut: Astronaut;
  latestMeasurements: Record<string, Measurement>;
  onOpenDetails: () => void;
}

export const SelectedAstronautBanner: React.FC<SelectedAstronautBannerProps> = ({
  astronaut,
  latestMeasurements,
  onOpenDetails,
}) => {
  const measurementList = Object.values(latestMeasurements);
  const hasSynthetic = measurementList.some((m) => m.is_synthetic);
  const provInfo = formatProvenance(hasSynthetic);

  // Take up to 4 key vitals for the quick banner
  const priorityKeys = [
    'heart_rate',
    'spo2',
    'body_temperature',
    'respiratory_rate',
    'blood_pressure_systolic',
    'blood_oxygen',
    'core_temperature',
  ];

  const displayVitals = priorityKeys
    .map((k) => latestMeasurements[k])
    .filter((m): m is Measurement => Boolean(m))
    .slice(0, 4);

  return (
    <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Astronaut Metadata */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-space-800 border border-telemetry-cyan/40 text-telemetry-cyan">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-base sm:text-lg font-bold text-space-100">
                {astronaut.name}
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-space-800 text-telemetry-cyan border border-space-700">
                {astronaut.id}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${provInfo.badgeClass}`}>
                {provInfo.shortLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs font-mono text-space-300">
              <span className="text-space-200">{astronaut.crew_role}</span>
              <span className="text-space-500">•</span>
              <span className="text-telemetry-cyan">{astronaut.mission_name}</span>
              <span className="text-space-500">•</span>
              <span className="flex items-center gap-1 text-space-300">
                <Calendar className="h-3 w-3 text-space-400" />
                Mission Day {astronaut.mission_day}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Vitals Pill Bar + Action */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {displayVitals.map((m) => {
            const meta = getMetricMeta(m.measurement_type, m.unit);
            return (
              <div
                key={m.measurement_type}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-space-900 border border-space-700 font-mono text-xs"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="text-[11px] text-space-400">{meta.shortLabel}:</span>
                <span className="font-semibold text-space-100">{m.value}</span>
                <span className="text-[10px] text-space-500">{m.unit}</span>
              </div>
            );
          })}

          <button
            onClick={onOpenDetails}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs font-mono text-space-200 transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-telemetry-cyan" />
            <span>Profile Specs</span>
            <ExternalLink className="h-3 w-3 text-space-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
