import React, { useState, useEffect } from 'react';
import {
  Activity,
  RotateCcw,
  Box,
  Layers,
  Compass,
  Heart,
  Wind,
  Thermometer,
  Brain,
  Bone,
  Footprints,
  Info,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import {
  AnatomicalRegionId,
  ANATOMICAL_REGIONS,
  ANATOMICAL_REGION_LIST,
} from './anatomyRegistry';
import { AnatomyScene } from './AnatomyScene';
import { RegionTelemetryInspector } from './RegionTelemetryInspector';

interface AnatomyViewportProps {
  astronaut: Astronaut | null;
  measurements: Measurement[];
  selectedMetric?: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  onSwitchToChart: () => void;
  onNavigateToBaselines?: (metric: MeasurementType) => void;
}

export const AnatomyViewport: React.FC<AnatomyViewportProps> = ({
  astronaut,
  measurements,
  selectedMetric,
  onSelectMetric,
  onSwitchToChart,
  onNavigateToBaselines,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<AnatomicalRegionId>('cardiovascular');
  const [hoveredRegion, setHoveredRegion] = useState<AnatomicalRegionId | null>(null);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [cameraResetKey, setCameraResetKey] = useState<number>(0);

  // Sync selectedRegion if selectedMetric matches a specific region
  useEffect(() => {
    if (!selectedMetric) return;
    const matchingRegion = ANATOMICAL_REGION_LIST.find((r) =>
      r.telemetryKeys.includes(selectedMetric)
    );
    if (matchingRegion && matchingRegion.id !== selectedRegion) {
      setSelectedRegion(matchingRegion.id);
    }
  }, [selectedMetric]);

  const handleRegionSelect = (regionId: AnatomicalRegionId) => {
    setSelectedRegion(regionId);
    const regionDef = ANATOMICAL_REGIONS[regionId];
    if (regionDef.telemetryKeys.length > 0) {
      onSelectMetric(regionDef.telemetryKeys[0]);
    }
  };

  const handleResetCamera = () => {
    setCameraResetKey((prev) => prev + 1);
  };

  const handleNavigateToChart = (metric: MeasurementType) => {
    onSelectMetric(metric);
    onSwitchToChart();
  };

  const activeRegionDef = ANATOMICAL_REGIONS[selectedRegion];

  // Map icon per region for accessibility buttons
  const getRegionIcon = (id: AnatomicalRegionId) => {
    switch (id) {
      case 'cardiovascular':
        return <Heart className="h-3.5 w-3.5 text-rose-400" />;
      case 'respiratory':
        return <Wind className="h-3.5 w-3.5 text-emerald-400" />;
      case 'thermoregulation':
        return <Thermometer className="h-3.5 w-3.5 text-amber-400" />;
      case 'cranial':
        return <Brain className="h-3.5 w-3.5 text-sky-400" />;
      case 'musculoskeletal':
        return <Bone className="h-3.5 w-3.5 text-purple-400" />;
      case 'lower_limbs':
        return <Footprints className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* HUD Header & Control Panel */}
      <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-telemetry-cyan" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                3D Anatomical Telemetry Explorer
              </h3>
              <span className="rounded bg-telemetry-emerald/15 px-2 py-0.5 font-mono text-[10px] text-telemetry-emerald border border-telemetry-emerald/30">
                THREE.JS / WEBGL ACTIVE
              </span>
              <span className="hidden sm:inline-block rounded bg-space-800 px-2 py-0.5 font-mono text-[10px] text-space-400 border border-space-700">
                ORBIT CONTROLS
              </span>
            </div>
            <p className="font-mono text-xs text-space-400 mt-1">
              Interactive 3D anatomical model connecting spaceflight physiological telemetry to organ systems. Rotate, inspect, and drill down into biological channels.
            </p>
          </div>

          {/* 3D Viewport Action Toolbar */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setIsWireframe((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                isWireframe
                  ? 'bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan'
                  : 'bg-space-800 hover:bg-space-750 border-space-700 text-space-300'
              }`}
              title="Toggle Wireframe Matrix"
            >
              <Box className="h-3.5 w-3.5" />
              <span>{isWireframe ? 'Shaded Mesh' : 'Wireframe'}</span>
            </button>

            <button
              onClick={handleResetCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 transition-colors"
              title="Re-center camera perspective"
            >
              <RotateCcw className="h-3.5 w-3.5 text-telemetry-cyan" />
              <span>Reset View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): 3D Anatomy Viewport Canvas */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative rounded-lg bg-space-950 border border-space-750 overflow-hidden shadow-hud-card">
            {/* Top-Left HUD Status Overlay */}
            <div className="absolute top-3.5 left-4 z-10 pointer-events-none font-mono text-[11px] text-space-400 space-y-1 bg-space-950/80 p-2 rounded border border-space-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-space-500">SUBJECT:</span>
                <span className="text-space-100 font-bold">
                  {astronaut?.name || 'ASTRONAUT STANDBY'}
                </span>
                {astronaut?.mission_name && (
                  <span className="text-telemetry-cyan font-mono text-[10px]">
                    [{astronaut.mission_name} D+{astronaut.mission_day}]
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-space-500">ACTIVE REGION:</span>
                <span
                  className="font-bold uppercase"
                  style={{ color: activeRegionDef.color }}
                >
                  {activeRegionDef.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-space-500">CHANNELS MAPPED:</span>
                <span className="text-space-200 font-bold">
                  {activeRegionDef.telemetryKeys.length > 0
                    ? `${activeRegionDef.telemetryKeys.length} Sensor Feeds`
                    : 'No telemetry assigned'}
                </span>
              </div>
            </div>

            {/* Top-Right HUD Navigation Instructions */}
            <div className="absolute top-3.5 right-4 z-10 pointer-events-none hidden sm:block">
              <div className="font-mono text-[10px] text-space-400 bg-space-950/85 px-2.5 py-1.5 rounded border border-space-800 backdrop-blur-sm space-y-0.5">
                <div className="flex items-center gap-1 text-space-300">
                  <Compass className="h-3 w-3 text-telemetry-cyan" />
                  <span className="font-semibold text-space-200">INTERACTIVE 3D HUD</span>
                </div>
                <div>Left Click + Drag: Orbit</div>
                <div>Scroll Wheel: Zoom in/out</div>
                <div>Click Organ: Focus Region</div>
              </div>
            </div>

            {/* WebGL 3D Canvas */}
            <AnatomyScene
              selectedRegion={selectedRegion}
              onSelectRegion={handleRegionSelect}
              hoveredRegion={hoveredRegion}
              onHoverRegion={setHoveredRegion}
              isWireframe={isWireframe}
              cameraResetKey={cameraResetKey}
            />

            {/* Canvas Bottom-Left Mini Status */}
            <div className="absolute bottom-3 left-4 z-10 pointer-events-none font-mono text-[10px] text-space-500">
              COSMOLOOKUP 3D ANATOMICAL ENGINE // OPENGL ES 3.0 / WEBGL
            </div>
          </div>

          {/* Accessible Anatomical Region Selector Buttons (outside canvas for WCAG / keyboard accessibility) */}
          <div className="rounded-lg bg-space-900 p-3 border border-space-750">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-semibold text-space-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-telemetry-cyan" />
                Select Anatomical Region
              </span>
              <span className="font-mono text-[10px] text-space-500">
                Click zone or use keyboard tabs
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ANATOMICAL_REGION_LIST.map((region) => {
                const isSelected = selectedRegion === region.id;
                const channelCount = region.telemetryKeys.length;

                return (
                  <button
                    key={region.id}
                    onClick={() => handleRegionSelect(region.id)}
                    className={`flex items-center justify-between p-2 rounded text-left transition-all font-mono text-xs border ${
                      isSelected
                        ? 'bg-space-800 border-telemetry-cyan/80 text-space-100 shadow-sm'
                        : 'bg-space-850 hover:bg-space-800 border-space-750 text-space-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getRegionIcon(region.id)}
                      <div className="truncate">
                        <div
                          className="font-semibold text-[11px] truncate"
                          style={isSelected ? { color: region.color } : undefined}
                        >
                          {region.label.split(' ')[0]}
                        </div>
                        <div className="text-[9px] text-space-500 truncate">
                          {region.system.split('&')[0]}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1.5 ${
                        channelCount > 0
                          ? 'bg-space-750 text-space-200'
                          : 'bg-space-800 text-space-500'
                      }`}
                      title={`${channelCount} mapped telemetry channels`}
                    >
                      {channelCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Contextual Region Telemetry Inspector */}
        <div className="lg:col-span-5">
          <RegionTelemetryInspector
            regionId={selectedRegion}
            measurements={measurements}
            astronautId={astronaut?.id}
            onSelectMetric={onSelectMetric}
            onNavigateToChart={handleNavigateToChart}
            onNavigateToBaselines={onNavigateToBaselines}
          />
        </div>
      </div>

      {/* Provenance & Scientific Methodology Footer Card */}
      <div className="rounded-lg bg-space-900/70 p-4 border border-space-750/70 text-space-300 font-mono text-xs">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-telemetry-cyan shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-space-100 text-xs uppercase tracking-wider block">
              Biomechanical Telemetry Mapping Methodology
            </span>
            <p className="text-[11px] text-space-400 leading-relaxed">
              In accordance with NASA human research standards, telemetry is mapped directly to authoritative sensor sources. Peripheral proxy sensors (e.g., pulse oximetry, ambulatory cuffs) are classified accurately. Anatomical regions without active flight telemetry feeds (such as lower limb venous dynamics or musculoskeletal bone remodeling) transparently indicate zero active feeds without fabricating speculative sensor readings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
