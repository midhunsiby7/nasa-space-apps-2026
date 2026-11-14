import React, { useState } from 'react';
import {
  Activity,
  RotateCw,
  Heart,
  Droplet,
  Thermometer,
  Zap,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { getMetricMeta, formatDataQuality, formatProvenance } from '../../utils/formatters';

interface AnatomyViewportProps {
  astronaut: Astronaut | null;
  measurements: Measurement[];
  selectedMetric?: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  onSwitchToChart: () => void;
}

type AnatomicalRegion = 'cardiopulmonary' | 'core' | 'systemic' | 'cranial';

export const AnatomyViewport: React.FC<AnatomyViewportProps> = ({
  astronaut,
  measurements,
  selectedMetric: _selectedMetric,
  onSelectMetric,
  onSwitchToChart,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<AnatomicalRegion>('cardiopulmonary');
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [pitchAngle, setPitchAngle] = useState<number>(0);

  // Map regions to measurement types
  const regionMetrics: Record<AnatomicalRegion, MeasurementType> = {
    cardiopulmonary: 'heart_rate',
    core: 'core_temperature',
    systemic: 'radiation_dose',
    cranial: 'blood_oxygen',
  };

  const activeMetricType = regionMetrics[selectedRegion];
  const meta = getMetricMeta(activeMetricType);

  // Latest measurement for this metric
  const latest = measurements
    .filter((m) => m.measurement_type === activeMetricType)
    .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())[0];

  const quality = latest ? formatDataQuality(latest.data_quality) : null;
  const provenance = latest ? formatProvenance(latest.is_synthetic) : null;

  const handleRegionClick = (region: AnatomicalRegion) => {
    setSelectedRegion(region);
    onSelectMetric(regionMetrics[region]);
  };

  return (
    <div className="space-y-5">
      {/* Viewport Header */}
      <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-telemetry-cyan" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                3D Anatomical Telemetry Viewport
              </h3>
              <span className="rounded bg-telemetry-cyan/15 px-2 py-0.5 font-mono text-[10px] text-telemetry-cyan border border-telemetry-cyan/30">
                CANVAS INTEGRATION READY
              </span>
            </div>
            <p className="font-mono text-xs text-space-400 mt-1">
              Select anatomical zones to inspect localized physiological sensors. Architecture prepared for WebGL / Three.js.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRotationAngle((prev) => (prev + 45) % 360);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5 text-telemetry-cyan" />
              <span>Rotate Yaw ({rotationAngle}°)</span>
            </button>
            <button
              onClick={() => {
                setRotationAngle(0);
                setPitchAngle(0);
              }}
              className="px-2.5 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-400 hover:text-space-200"
              title="Reset View Vector"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: 3D Wireframe Mannequin Canvas Container */}
        <div className="lg:col-span-2 relative rounded-lg bg-space-950/90 border border-space-750 p-6 flex flex-col items-center justify-center min-h-[460px] overflow-hidden shadow-hud-card telemetry-grid">
          {/* Overlay HUD indicators */}
          <div className="absolute top-4 left-4 font-mono text-[11px] text-space-400 space-y-1 z-10">
            <div>TARGET: <span className="text-space-100 font-bold">{astronaut?.name || 'ASTRONAUT STANDBY'}</span></div>
            <div>COORDINATES: <span className="text-telemetry-cyan">X: 0.00 Y: {rotationAngle}° Z: {pitchAngle}°</span></div>
            <div>STATUS: <span className="text-telemetry-emerald">TELEMETRY LINK ACTIVE</span></div>
          </div>

          <div className="absolute top-4 right-4 z-10">
            <span className="font-mono text-[10px] text-space-400 px-2 py-1 rounded bg-space-900/80 border border-space-700">
              FRAME RATE: 60 FPS
            </span>
          </div>

          {/* Interactive Biomechanical Wireframe Mannequin */}
          <div
            className="relative transition-transform duration-500 ease-out select-none"
            style={{
              transform: `perspective(800px) rotateY(${rotationAngle * 0.4}deg) rotateX(${pitchAngle}deg)`,
            }}
          >
            {/* SVG Wireframe Mannequin */}
            <svg
              width="220"
              height="380"
              viewBox="0 0 220 380"
              className="drop-shadow-2xl"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Head / Cranial */}
              <circle
                cx="110"
                cy="40"
                r="24"
                stroke={selectedRegion === 'cranial' ? '#38bdf8' : '#3c527a'}
                strokeWidth={selectedRegion === 'cranial' ? '2.5' : '1.5'}
                fill="#101725"
                className="cursor-pointer transition-colors"
                onClick={() => handleRegionClick('cranial')}
              />
              {/* Neck */}
              <line x1="110" y1="64" x2="110" y2="76" stroke="#3c527a" strokeWidth="2" />

              {/* Torso / Cardiopulmonary */}
              <path
                d="M75 76 L145 76 L135 150 L85 150 Z"
                stroke={selectedRegion === 'cardiopulmonary' ? '#f43f5e' : '#3c527a'}
                strokeWidth={selectedRegion === 'cardiopulmonary' ? '2.5' : '1.5'}
                fill={selectedRegion === 'cardiopulmonary' ? 'rgba(244, 63, 94, 0.12)' : '#101725'}
                className="cursor-pointer transition-colors"
                onClick={() => handleRegionClick('cardiopulmonary')}
              />

              {/* Abdomen / Core Temperature */}
              <path
                d="M85 150 L135 150 L125 210 L95 210 Z"
                stroke={selectedRegion === 'core' ? '#f59e0b' : '#3c527a'}
                strokeWidth={selectedRegion === 'core' ? '2.5' : '1.5'}
                fill={selectedRegion === 'core' ? 'rgba(245, 158, 11, 0.12)' : '#101725'}
                className="cursor-pointer transition-colors"
                onClick={() => handleRegionClick('core')}
              />

              {/* Left Arm */}
              <path
                d="M75 76 L40 140 L30 200"
                stroke={selectedRegion === 'systemic' ? '#a855f7' : '#273856'}
                strokeWidth="2"
                strokeLinecap="round"
                className="cursor-pointer"
                onClick={() => handleRegionClick('systemic')}
              />
              {/* Right Arm */}
              <path
                d="M145 76 L180 140 L190 200"
                stroke={selectedRegion === 'systemic' ? '#a855f7' : '#273856'}
                strokeWidth="2"
                strokeLinecap="round"
                className="cursor-pointer"
                onClick={() => handleRegionClick('systemic')}
              />

              {/* Left Leg */}
              <path
                d="M95 210 L85 290 L80 360"
                stroke={selectedRegion === 'systemic' ? '#a855f7' : '#273856'}
                strokeWidth="2"
                strokeLinecap="round"
                className="cursor-pointer"
                onClick={() => handleRegionClick('systemic')}
              />
              {/* Right Leg */}
              <path
                d="M125 210 L135 290 L140 360"
                stroke={selectedRegion === 'systemic' ? '#a855f7' : '#273856'}
                strokeWidth="2"
                strokeLinecap="round"
                className="cursor-pointer"
                onClick={() => handleRegionClick('systemic')}
              />

              {/* Hotspot: Heart / Cardiopulmonary */}
              <circle
                cx="118"
                cy="105"
                r="6"
                fill="#f43f5e"
                className="animate-ping opacity-75"
              />
              <circle
                cx="118"
                cy="105"
                r="5"
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth="1.5"
                className="cursor-pointer"
                onClick={() => handleRegionClick('cardiopulmonary')}
              />

              {/* Hotspot: Core Temp */}
              <circle
                cx="110"
                cy="175"
                r="5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="1.5"
                className="cursor-pointer"
                onClick={() => handleRegionClick('core')}
              />

              {/* Hotspot: Cranial */}
              <circle
                cx="110"
                cy="40"
                r="4"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="1.5"
                className="cursor-pointer"
                onClick={() => handleRegionClick('cranial')}
              />
            </svg>
          </div>

          {/* Hotspot Legend Footer */}
          <div className="absolute bottom-3 inset-x-4 flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] bg-space-900/80 px-3 py-1.5 rounded border border-space-700/60">
            <span className="text-space-400">Click Zones:</span>
            <button
              onClick={() => handleRegionClick('cardiopulmonary')}
              className={`flex items-center gap-1 ${selectedRegion === 'cardiopulmonary' ? 'text-rose-400 font-bold' : 'text-space-300'}`}
            >
              <Heart className="h-3 w-3" /> Cardiopulmonary
            </button>
            <button
              onClick={() => handleRegionClick('core')}
              className={`flex items-center gap-1 ${selectedRegion === 'core' ? 'text-amber-400 font-bold' : 'text-space-300'}`}
            >
              <Thermometer className="h-3 w-3" /> Core Vitals
            </button>
            <button
              onClick={() => handleRegionClick('cranial')}
              className={`flex items-center gap-1 ${selectedRegion === 'cranial' ? 'text-sky-400 font-bold' : 'text-space-300'}`}
            >
              <Droplet className="h-3 w-3" /> Oxygen / Cranial
            </button>
            <button
              onClick={() => handleRegionClick('systemic')}
              className={`flex items-center gap-1 ${selectedRegion === 'systemic' ? 'text-purple-400 font-bold' : 'text-space-300'}`}
            >
              <Zap className="h-3 w-3" /> Systemic Dose
            </button>
          </div>
        </div>

        {/* Right 1 Col: Selected Region Telemetry Inspector */}
        <div className="rounded-lg bg-space-850 p-5 border border-space-700/80 shadow-hud-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-space-700/60 mb-4">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-space-400">
                Zone Telemetry Inspector
              </span>
              <span className="font-mono text-xs text-telemetry-cyan font-bold uppercase">
                {selectedRegion}
              </span>
            </div>

            {/* Metric Overview */}
            <div className="space-y-4 font-mono">
              <div>
                <span className="text-xs text-space-400 block mb-1">BOUND METRIC CHANNEL:</span>
                <span className="text-sm font-bold text-space-100 flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  {meta.label}
                </span>
                <p className="text-[11px] text-space-400 mt-1 leading-relaxed">
                  {meta.description}
                </p>
              </div>

              {/* Latest Value Card */}
              <div className="rounded-lg bg-space-900 p-4 border border-space-750">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-space-400">CURRENT VALUE:</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-space-100">
                      {latest ? latest.value : '—'}
                    </span>
                    <span className="text-xs text-space-400 font-normal">
                      {latest ? latest.unit : meta.unit}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-space-800">
                  <div>
                    <span className="text-space-500 block">QUALITY:</span>
                    <span className="text-space-300 font-semibold">{quality?.label || 'NOMINAL'}</span>
                  </div>
                  <div>
                    <span className="text-space-500 block">ORIGIN:</span>
                    <span className="text-space-300 font-semibold">{provenance?.shortLabel || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Sourced Hardware Information */}
              <div className="rounded-lg bg-space-900/60 p-3 border border-space-750 text-xs">
                <span className="text-[11px] text-space-400 block mb-1">TRANSMITTING SENSOR:</span>
                <span className="text-space-200">{latest?.source || 'BioHarness v3 Sensor Array'}</span>
                {latest?.context && (
                  <p className="text-[11px] text-space-400 mt-1 italic">
                    Context: {latest.context}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-space-700/60 mt-4">
            <button
              onClick={onSwitchToChart}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-telemetry-cyan hover:bg-telemetry-cyan/90 font-mono text-xs font-bold text-space-950 transition-colors"
            >
              <Activity className="h-4 w-4" />
              <span>Plot Full Time-Series Telemetry</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
