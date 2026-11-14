import React, { useState } from 'react';
import {
  Activity,
  Layers,
  RotateCcw,
  Box,
  Radio,
  Eye,
  Heart,
  Thermometer,
  Wind,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation } from '../../types/trend';
import { AlertResponse } from '../../types/alert';
import { AssessmentResponse } from '../../types/assessment';
import {
  AnatomicalRegionId,
  ANATOMICAL_REGIONS,
  ANATOMICAL_REGION_LIST,
} from './anatomyRegistry';
import { AnatomyScene } from './AnatomyScene';
import { RegionTelemetryInspector } from './RegionTelemetryInspector';
import { NonAnatomicalDataDrawer } from './NonAnatomicalDataDrawer';

interface AnatomyViewportProps {
  astronaut: Astronaut | null;
  measurements: Measurement[];
  baselines?: BaselineResponse[];
  trends?: TrendObservation[];
  alerts?: AlertResponse[];
  assessment?: AssessmentResponse | null;
  selectedMetric?: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  onSwitchToChart: () => void;
  onNavigateToBaselines?: (metric: MeasurementType) => void;
  onNavigateToCatalog?: (metric: MeasurementType) => void;
  onNavigateToResearch?: (bodySystem?: string) => void;
}

export const AnatomyViewport: React.FC<AnatomyViewportProps> = ({
  astronaut,
  measurements,
  baselines = [],
  trends = [],
  alerts = [],
  assessment = null,
  selectedMetric,
  onSelectMetric,
  onSwitchToChart,
  onNavigateToBaselines,
  onNavigateToCatalog,
  onNavigateToResearch,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<AnatomicalRegionId>('cardiovascular');
  const [hoveredRegion, setHoveredRegion] = useState<AnatomicalRegionId | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [isNonAnatomicalOpen, setIsNonAnatomicalOpen] = useState<boolean>(false);

  const activeRegionConfig = ANATOMICAL_REGIONS[selectedRegion];

  // Helper to map region icons
  const getRegionIcon = (id: AnatomicalRegionId) => {
    switch (id) {
      case 'cardiovascular':
        return <Heart className="h-3.5 w-3.5" />;
      case 'respiratory':
        return <Wind className="h-3.5 w-3.5" />;
      case 'thermoregulation':
        return <Thermometer className="h-3.5 w-3.5" />;
      case 'ocular':
        return <Eye className="h-3.5 w-3.5" />;
      case 'neurological':
        return <Sparkles className="h-3.5 w-3.5" />;
      case 'musculoskeletal':
        return <Layers className="h-3.5 w-3.5" />;
      default:
        return <Activity className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Viewport Control Bar */}
      <div className="rounded-lg border border-space-700 bg-space-850 p-3.5 shadow-hud-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-telemetry-cyan" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                Interactive Anatomical Telemetry Navigator
              </h3>
              <span className="rounded bg-telemetry-cyan/15 px-2 py-0.5 font-mono text-[10px] text-telemetry-cyan border border-telemetry-cyan/30">
                {viewMode === '3d' ? '3D HOLOGRAPHIC MESH' : '2D SCHEMATIC'}
              </span>
            </div>
            <p className="font-mono text-xs text-space-400 mt-1">
              Select anatomical zones to inspect telemetry sensors, baseline operational envelopes, and trend trajectories.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle (3D vs 2D) */}
            <button
              onClick={() => setViewMode((prev) => (prev === '3d' ? '2d' : '3d'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 transition-colors"
              title="Toggle between 3D Spatial Canvas and 2D Schematic"
            >
              <Box className="h-3.5 w-3.5 text-telemetry-cyan" />
              <span>{viewMode === '3d' ? 'Switch to 2D' : 'Switch to 3D'}</span>
            </button>

            {/* Wireframe Toggle (only in 3D mode) */}
            {viewMode === '3d' && (
              <button
                onClick={() => setIsWireframe((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                  isWireframe
                    ? 'bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan font-bold'
                    : 'bg-space-800 hover:bg-space-750 border-space-700 text-space-300'
                }`}
                title="Toggle mesh wireframe visualization"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>{isWireframe ? 'Wireframe: ON' : 'Wireframe: OFF'}</span>
              </button>
            )}

            {/* Reset Camera View */}
            {viewMode === '3d' && (
              <button
                onClick={() => setResetTrigger((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-300 hover:text-space-100"
                title="Reset Camera Orientation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset View</span>
              </button>
            )}

            {/* Open Non-Anatomical Data Drawer */}
            <button
              onClick={() => setIsNonAnatomicalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 text-xs font-mono text-purple-200 transition-colors"
              title="View non-anatomical channels (Radiation, ECLSS, Sleep)"
            >
              <Radio className="h-3.5 w-3.5 text-purple-400" />
              <span>Non-Anatomical Channels</span>
            </button>
          </div>
        </div>

        {/* Region Fast Selection Pills */}
        <div className="mt-3 pt-3 border-t border-space-800 flex flex-wrap gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-space-400 self-center mr-1">
            Focus Zone:
          </span>
          {ANATOMICAL_REGION_LIST.map((reg) => {
            const isSelected = selectedRegion === reg.id;
            return (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                onMouseEnter={() => setHoveredRegion(reg.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                  isSelected
                    ? 'bg-space-700 text-space-100 font-bold border'
                    : 'bg-space-900/70 text-space-400 hover:bg-space-800 hover:text-space-200 border border-space-800'
                }`}
                style={{
                  borderColor: isSelected ? reg.color : undefined,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: reg.color }}
                />
                {getRegionIcon(reg.id)}
                <span>{reg.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
        {/* Left Column: 3D Holographic Scene or 2D Schematic */}
        <div className="lg:col-span-7 flex flex-col rounded-lg border border-space-700 bg-space-900 shadow-hud-card overflow-hidden min-h-[500px]">
          {/* Viewport Top Status Banner */}
          <div className="flex items-center justify-between border-b border-space-800 bg-space-850 px-3.5 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: activeRegionConfig.color }}
              />
              <span className="font-mono text-xs font-bold text-space-200 uppercase tracking-wider">
                {activeRegionConfig.label}
              </span>
              <span className="font-mono text-[10px] text-space-400">
                ({activeRegionConfig.system})
              </span>
            </div>

            <div className="font-mono text-[10px] text-space-400 hidden sm:block">
              {viewMode === '3d'
                ? 'Left Drag: Orbit • Scroll: Zoom • Right Drag: Pan'
                : 'Interactive 2D Telemetry Mannequin'}
            </div>
          </div>

          {/* Interactive Rendering Canvas */}
          <div className="relative flex-1 min-h-[460px] w-full">
            {viewMode === '3d' ? (
              <AnatomyScene
                selectedRegion={selectedRegion}
                onSelectRegion={setSelectedRegion}
                hoveredRegion={hoveredRegion}
                onHoverRegion={setHoveredRegion}
                isWireframe={isWireframe}
                onFallbackTo2D={() => setViewMode('2d')}
                resetTrigger={resetTrigger}
              />
            ) : (
              /* 2D Schematic Fallback Mannequin */
              <div className="flex h-full w-full flex-col items-center justify-center p-4 bg-gradient-to-b from-space-950 via-space-900 to-space-950">
                <svg
                  viewBox="0 0 400 500"
                  className="h-full max-h-[440px] w-auto drop-shadow-lg select-none"
                >
                  {/* Outer Silhouette Guide */}
                  <path
                    d="M 200 40 Q 230 40 230 70 Q 230 100 215 110 L 255 130 L 285 240 L 270 245 L 245 155 L 235 240 L 245 360 L 230 470 L 210 470 L 215 280 L 200 280 L 185 280 L 190 470 L 170 470 L 155 360 L 165 240 L 155 155 L 130 245 L 115 240 L 145 130 L 185 110 Q 170 100 170 70 Q 170 40 200 40 Z"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* 1. Cranium / Neurological Region */}
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedRegion('neurological')}
                    onMouseEnter={() => setHoveredRegion('neurological')}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <ellipse
                      cx="200"
                      cy="75"
                      rx="30"
                      ry="35"
                      fill={selectedRegion === 'neurological' ? '#06b6d4' : '#083344'}
                      fillOpacity={selectedRegion === 'neurological' ? 0.75 : hoveredRegion === 'neurological' ? 0.5 : 0.25}
                      stroke="#06b6d4"
                      strokeWidth={selectedRegion === 'neurological' ? 3 : 1.5}
                    />
                    <text x="200" y="80" textAnchor="middle" fill="#e0f2fe" fontSize="10" fontFamily="monospace">
                      BRAIN
                    </text>
                  </g>

                  {/* 2. Bilateral Ocular Region */}
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedRegion('ocular')}
                    onMouseEnter={() => setHoveredRegion('ocular')}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <circle
                      cx="190"
                      cy="70"
                      r="6"
                      fill={selectedRegion === 'ocular' ? '#38bdf8' : '#075985'}
                      fillOpacity={selectedRegion === 'ocular' ? 0.9 : 0.4}
                      stroke="#38bdf8"
                      strokeWidth={selectedRegion === 'ocular' ? 2 : 1}
                    />
                    <circle
                      cx="210"
                      cy="70"
                      r="6"
                      fill={selectedRegion === 'ocular' ? '#38bdf8' : '#075985'}
                      fillOpacity={selectedRegion === 'ocular' ? 0.9 : 0.4}
                      stroke="#38bdf8"
                      strokeWidth={selectedRegion === 'ocular' ? 2 : 1}
                    />
                  </g>

                  {/* 3. Pulmonary / Respiratory Region (Lungs) */}
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedRegion('respiratory')}
                    onMouseEnter={() => setHoveredRegion('respiratory')}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <path
                      d="M 172 135 C 160 145 155 175 172 195 C 185 195 190 175 190 145 Z"
                      fill={selectedRegion === 'respiratory' ? '#10b981' : '#064e3b'}
                      fillOpacity={selectedRegion === 'respiratory' ? 0.75 : hoveredRegion === 'respiratory' ? 0.5 : 0.25}
                      stroke="#10b981"
                      strokeWidth={selectedRegion === 'respiratory' ? 2.5 : 1}
                    />
                    <path
                      d="M 228 135 C 240 145 245 175 228 195 C 215 195 210 175 210 145 Z"
                      fill={selectedRegion === 'respiratory' ? '#10b981' : '#064e3b'}
                      fillOpacity={selectedRegion === 'respiratory' ? 0.75 : hoveredRegion === 'respiratory' ? 0.5 : 0.25}
                      stroke="#10b981"
                      strokeWidth={selectedRegion === 'respiratory' ? 2.5 : 1}
                    />
                    <text x="200" y="142" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontFamily="monospace">
                      PULMONARY
                    </text>
                  </g>

                  {/* 4. Cardiovascular Region (Heart & Aortic Root) */}
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedRegion('cardiovascular')}
                    onMouseEnter={() => setHoveredRegion('cardiovascular')}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <path
                      d="M 195 155 C 190 145 180 150 185 165 C 190 175 200 185 200 185 C 200 185 210 175 215 165 C 220 150 210 145 205 155 C 200 160 200 160 195 155 Z"
                      fill={selectedRegion === 'cardiovascular' ? '#f43f5e' : '#881337'}
                      fillOpacity={selectedRegion === 'cardiovascular' ? 0.85 : hoveredRegion === 'cardiovascular' ? 0.6 : 0.35}
                      stroke="#f43f5e"
                      strokeWidth={selectedRegion === 'cardiovascular' ? 3 : 1.5}
                    />
                    <text x="200" y="172" textAnchor="middle" fill="#ffe4e6" fontSize="9" fontFamily="monospace">
                      CARDIAC
                    </text>
                  </g>

                  {/* 5. Core Thermoregulation Region (Viscera / GI) */}
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedRegion('thermoregulation')}
                    onMouseEnter={() => setHoveredRegion('thermoregulation')}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <rect
                      x="175"
                      y="200"
                      width="50"
                      height="40"
                      rx="8"
                      fill={selectedRegion === 'thermoregulation' ? '#f59e0b' : '#78350f'}
                      fillOpacity={selectedRegion === 'thermoregulation' ? 0.75 : hoveredRegion === 'thermoregulation' ? 0.5 : 0.25}
                      stroke="#f59e0b"
                      strokeWidth={selectedRegion === 'thermoregulation' ? 2.5 : 1}
                    />
                    <text x="200" y="224" textAnchor="middle" fill="#fef3c7" fontSize="9" fontFamily="monospace">
                      CORE TEMP
                    </text>
                  </g>

                  {/* 6. Musculoskeletal Framework (Spine & Limbs) */}
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedRegion('musculoskeletal')}
                    onMouseEnter={() => setHoveredRegion('musculoskeletal')}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    {/* Spine Column */}
                    <line
                      x1="200"
                      y1="110"
                      x2="200"
                      y2="245"
                      stroke={selectedRegion === 'musculoskeletal' ? '#c084fc' : '#581c87'}
                      strokeWidth={selectedRegion === 'musculoskeletal' ? 4 : 2}
                      strokeDasharray="3 3"
                    />
                    {/* Extremities Outline */}
                    <path
                      d="M 145 130 L 120 240 M 255 130 L 280 240 M 180 250 L 175 460 M 220 250 L 225 460"
                      stroke={selectedRegion === 'musculoskeletal' ? '#c084fc' : '#581c87'}
                      strokeWidth={selectedRegion === 'musculoskeletal' ? 3 : 1.5}
                    />
                    <text x="200" y="270" textAnchor="middle" fill="#f3e8ff" fontSize="9" fontFamily="monospace">
                      SKELETAL
                    </text>
                  </g>
                </svg>
                <p className="font-mono text-[11px] text-space-400 mt-2">
                  Click any anatomical sector to inspect telemetry, operational baselines, and flight protocols.
                </p>
              </div>
            )}

            {/* In-Canvas HUD Overlay Info & Scientific Guardrail */}
            <div className="pointer-events-none absolute bottom-3 left-3 max-w-sm rounded bg-space-950/90 backdrop-blur border border-space-700/70 p-2 font-mono text-[10px] text-space-300 space-y-1">
              <div>
                <span className="text-telemetry-cyan font-bold">Active Sector:</span>{' '}
                <span className="text-space-100">{activeRegionConfig.label}</span>
              </div>
              <p className="text-[9px] text-space-400 leading-tight">
                Illustrative spatial navigation model — not an anatomically accurate CAD model or clinical pathology diagnostic representation.
              </p>
              {viewMode === '3d' && (
                <p className="text-[9px] text-space-500 leading-tight italic">
                  Visualizer notice: Heart pulsation (~72 bpm) and lung respiration (~14 bpm) are reference pacing animations, not live astronaut telemetry waveforms.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Region Telemetry & Clinical Intelligence Inspector */}
        <div className="lg:col-span-5 h-[580px]">
          <RegionTelemetryInspector
            regionId={selectedRegion}
            astronaut={astronaut}
            measurements={measurements}
            baselines={baselines}
            trends={trends}
            alerts={alerts}
            assessment={assessment}
            selectedMetric={selectedMetric}
            onSelectMetric={onSelectMetric}
            onNavigateToChart={(m) => {
              onSelectMetric(m);
              onSwitchToChart();
            }}
            onNavigateToBaselines={onNavigateToBaselines}
            onNavigateToCatalog={onNavigateToCatalog}
            onNavigateToResearch={onNavigateToResearch}
          />
        </div>
      </div>

      {/* Non-Anatomical Channels Drawer */}
      <NonAnatomicalDataDrawer
        isOpen={isNonAnatomicalOpen}
        onClose={() => setIsNonAnatomicalOpen(false)}
        measurements={measurements}
        trends={trends}
        alerts={alerts}
        onSelectMetric={onSelectMetric}
        onNavigateToChart={(m) => {
          onSelectMetric(m);
          onSwitchToChart();
        }}
      />
    </div>
  );
};
export default AnatomyViewport;
