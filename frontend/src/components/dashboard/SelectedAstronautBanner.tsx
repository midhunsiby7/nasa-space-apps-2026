import React from 'react';
import { User, Calendar, Shield, ExternalLink, Heart, Droplet, Thermometer, Zap, Activity } from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement } from '../../types/measurement';
import { formatProvenance } from '../../utils/formatters';

interface SelectedAstronautBannerProps {
  astronaut: Astronaut;
  latestMeasurements: Record<string, Measurement>;
  onOpenDetails: () => void;
  onOpenAnatomy?: () => void;
}

export const SelectedAstronautBanner: React.FC<SelectedAstronautBannerProps> = ({
  astronaut,
  latestMeasurements,
  onOpenDetails,
  onOpenAnatomy,
}) => {
  const hr = latestMeasurements['heart_rate'];
  const spo2 = latestMeasurements['blood_oxygen'];
  const temp = latestMeasurements['core_temperature'];
  const rad = latestMeasurements['radiation_dose'];

  // Check if any metric is synthetic
  const hasSynthetic = [hr, spo2, temp, rad].some((m) => m?.is_synthetic);
  const provInfo = formatProvenance(hasSynthetic);

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

        {/* Right: Quick Vitals Pill Bar + Action */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Heart rate pill */}
          {hr && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-space-900 border border-space-700 font-mono text-xs">
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-semibold text-space-100">{hr.value}</span>
              <span className="text-[10px] text-space-400">bpm</span>
            </div>
          )}

          {/* SpO2 pill */}
          {spo2 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-space-900 border border-space-700 font-mono text-xs">
              <Droplet className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold text-space-100">{spo2.value}</span>
              <span className="text-[10px] text-space-400">%</span>
            </div>
          )}

          {/* Temp pill */}
          {temp && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-space-900 border border-space-700 font-mono text-xs">
              <Thermometer className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold text-space-100">{temp.value}</span>
              <span className="text-[10px] text-space-400">°C</span>
            </div>
          )}

          {/* Radiation pill */}
          {rad && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-space-900 border border-space-700 font-mono text-xs">
              <Zap className="h-3.5 w-3.5 text-purple-400" />
              <span className="font-semibold text-space-100">{rad.value}</span>
              <span className="text-[10px] text-space-400">mSv</span>
            </div>
          )}

          {onOpenAnatomy && (
            <button
              onClick={onOpenAnatomy}
              aria-label="Open 3D Anatomy Map"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs font-mono text-telemetry-cyan transition-colors"
              title="Navigate to 3D Anatomy Map"
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">3D Anatomy</span>
            </button>
          )}

          <button
            onClick={onOpenDetails}
            aria-label="View Astronaut Profile Specifications"
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
