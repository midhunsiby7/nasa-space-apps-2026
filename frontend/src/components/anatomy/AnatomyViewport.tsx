import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Maximize2,
  Minimize2,
  Compass,
  Sliders,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation } from '../../types/trend';
import { AlertResponse } from '../../types/alert';
import { AssessmentResponse } from '../../types/assessment';
import {
  AnatomicalStructureId,
  AnatomicalSystemId,
  ANATOMICAL_STRUCTURES,
  ANATOMICAL_STRUCTURE_LIST,
  ANATOMICAL_SYSTEM_LIST,
} from './anatomyRegistry';
import { AnatomyScene, CameraViewAngle } from './AnatomyScene';
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
}) => {
  const [selectedStructure, setSelectedStructure] = useState<AnatomicalStructureId | null>('heart');
  const [hoveredStructure, setHoveredStructure] = useState<AnatomicalStructureId | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [viewAngle, setViewAngle] = useState<CameraViewAngle>(null);
  const [isNonAnatomicalOpen, setIsNonAnatomicalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isIsolated, setIsIsolated] = useState<boolean>(false);
  const [shellOpacity, setShellOpacity] = useState<number>(0.16);
  const [isOrganTreeOpen, setIsOrganTreeOpen] = useState<boolean>(false);

  // System visibility state (all enabled by default)
  const [visibleSystems, setVisibleSystems] = useState<Record<AnatomicalSystemId, boolean>>({
    cardiovascular: true,
    respiratory: true,
    nervous: true,
    digestive: true,
    urinary: true,
    muscular: true,
    skeletal: true,
    integumentary: true,
  });

  const viewportContainerRef = useRef<HTMLDivElement>(null);

  // Active structure configuration
  const activeStructureConfig = selectedStructure
    ? ANATOMICAL_STRUCTURES[selectedStructure] || ANATOMICAL_STRUCTURES['heart']
    : ANATOMICAL_STRUCTURES['heart'];

  // Fullscreen API toggle with fallback
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && viewportContainerRef.current) {
      if (viewportContainerRef.current.requestFullscreen) {
        viewportContainerRef.current
          .requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(() => setIsFullscreen((prev) => !prev));
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } else if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(() => setIsFullscreen(false));
      } else {
        setIsFullscreen(false);
      }
    } else {
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  // Listen for native browser fullscreen changes and keyboard shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && e.target === document.body) {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && e.target === document.body) {
        handleCameraAngle('reset');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, toggleFullscreen]);

  // System visibility helpers
  const toggleSystemVisibility = (sysId: AnatomicalSystemId) => {
    setVisibleSystems((prev) => ({
      ...prev,
      [sysId]: !prev[sysId],
    }));
  };

  const showAllSystems = () => {
    setVisibleSystems({
      cardiovascular: true,
      respiratory: true,
      nervous: true,
      digestive: true,
      urinary: true,
      muscular: true,
      skeletal: true,
      integumentary: true,
    });
    setIsIsolated(false);
  };

  const isolateSystem = (sysId: AnatomicalSystemId) => {
    const next: Record<AnatomicalSystemId, boolean> = {
      cardiovascular: false,
      respiratory: false,
      nervous: false,
      digestive: false,
      urinary: false,
      muscular: false,
      skeletal: false,
      integumentary: false,
    };
    next[sysId] = true;
    setVisibleSystems(next);
  };

  const handleCameraAngle = (angle: CameraViewAngle) => {
    setViewAngle(angle);
    setResetTrigger((prev) => prev + 1);
  };

  const getSystemIcon = (id: AnatomicalSystemId) => {
    switch (id) {
      case 'cardiovascular':
        return <Heart className="h-3.5 w-3.5" />;
      case 'respiratory':
        return <Wind className="h-3.5 w-3.5" />;
      case 'nervous':
        return <Sparkles className="h-3.5 w-3.5" />;
      case 'digestive':
        return <Thermometer className="h-3.5 w-3.5" />;
      case 'urinary':
        return <ShieldAlert className="h-3.5 w-3.5" />;
      case 'muscular':
        return <Zap className="h-3.5 w-3.5" />;
      case 'skeletal':
        return <Layers className="h-3.5 w-3.5" />;
      case 'integumentary':
        return <Eye className="h-3.5 w-3.5" />;
      default:
        return <Activity className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div
      ref={viewportContainerRef}
      className={`relative transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#070d19] w-screen h-screen flex flex-col p-3 overflow-hidden'
          : 'space-y-4'
      }`}
    >
      {/* Viewport Control Bar */}
      <div className="rounded-lg border border-space-700 bg-space-850 p-3 shadow-hud-card">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Activity className="h-4 w-4 text-telemetry-cyan" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                COSMOLOOKUP 3D Human Anatomy Atlas
              </h3>
              <span className="rounded bg-telemetry-cyan/15 px-2 py-0.5 font-mono text-[10px] text-telemetry-cyan border border-telemetry-cyan/30">
                {viewMode === '3d' ? '3D PBR ANATOMICAL MESH' : '2D SCHEMATIC'}
              </span>
              {astronaut && (
                <span className="rounded bg-space-800 px-2 py-0.5 font-mono text-[10px] text-space-300 border border-space-700">
                  Crew: <strong className="text-space-100">{astronaut.name}</strong> ({astronaut.id})
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-space-400 mt-1">
              Select internal organs, skeletal framework, or vascular trees to inspect live physiological telemetry, baselines, and flight countermeasures.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode((prev) => (prev === '3d' ? '2d' : '3d'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 transition-colors"
              title="Toggle between 3D Spatial Canvas and 2D Schematic"
            >
              <Box className="h-3.5 w-3.5 text-telemetry-cyan" />
              <span>{viewMode === '3d' ? 'Switch to 2D' : 'Switch to 3D'}</span>
            </button>

            {/* Organ Index Tree Button */}
            <button
              onClick={() => setIsOrganTreeOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                isOrganTreeOpen
                  ? 'bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan font-bold'
                  : 'bg-space-800 hover:bg-space-750 border-space-700 text-space-300'
              }`}
              title="Open accessible anatomical structures index"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Anatomy Index</span>
            </button>

            {/* Wireframe Toggle (in 3D mode) */}
            {viewMode === '3d' && (
              <button
                onClick={() => setIsWireframe((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono transition-colors ${
                  isWireframe
                    ? 'bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan font-bold'
                    : 'bg-space-800 hover:bg-space-750 border-space-700 text-space-300'
                }`}
                title="Toggle mesh wireframe visualization"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>{isWireframe ? 'Wireframe: ON' : 'Wireframe'}</span>
              </button>
            )}

            {/* Isolate Selected Organ Toggle */}
            {viewMode === '3d' && (
              <button
                onClick={() => setIsIsolated((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono transition-colors ${
                  isIsolated
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-space-800 hover:bg-space-750 border-space-700 text-space-300'
                }`}
                title="Isolate selected organ and ghost non-selected structures"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{isIsolated ? 'Isolated' : 'Isolate'}</span>
              </button>
            )}

            {/* Reset Camera View */}
            {viewMode === '3d' && (
              <button
                onClick={() => handleCameraAngle('reset')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-300 hover:text-space-100"
                title="Reset Camera Orientation [R]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset View</span>
              </button>
            )}

            {/* Prominent FULLSCREEN Button */}
            <button
              onClick={toggleFullscreen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono font-bold transition-all ${
                isFullscreen
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-telemetry-cyan/20 hover:bg-telemetry-cyan/30 border-telemetry-cyan/50 text-telemetry-cyan'
              }`}
              title="Toggle Fullscreen Anatomy Inspection [F]"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Fullscreen View</span>
                </>
              )}
            </button>

            {/* Non-Anatomical Channels */}
            <button
              onClick={() => setIsNonAnatomicalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 text-xs font-mono text-purple-200 transition-colors"
              title="View non-anatomical channels (Radiation, ECLSS, Sleep)"
            >
              <Radio className="h-3.5 w-3.5 text-purple-400" />
              <span>Habitat Channels</span>
            </button>
          </div>
        </div>

        {/* 360-Degree Camera Angle Presets Toolbar */}
        {viewMode === '3d' && (
          <div className="mt-3 pt-2.5 border-t border-space-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-wider text-space-400 mr-1 flex items-center gap-1">
                <Compass className="h-3 w-3 text-telemetry-cyan" />
                360° Angles:
              </span>
              <button
                onClick={() => handleCameraAngle('front')}
                className="rounded px-2.5 py-1 font-mono text-xs bg-space-800 hover:bg-space-700 text-space-200 border border-space-700 hover:border-telemetry-cyan/50"
              >
                Front View
              </button>
              <button
                onClick={() => handleCameraAngle('back')}
                className="rounded px-2.5 py-1 font-mono text-xs bg-space-800 hover:bg-space-700 text-space-200 border border-space-700 hover:border-telemetry-cyan/50"
              >
                Back View
              </button>
              <button
                onClick={() => handleCameraAngle('left')}
                className="rounded px-2.5 py-1 font-mono text-xs bg-space-800 hover:bg-space-700 text-space-200 border border-space-700 hover:border-telemetry-cyan/50"
              >
                Left Side
              </button>
              <button
                onClick={() => handleCameraAngle('right')}
                className="rounded px-2.5 py-1 font-mono text-xs bg-space-800 hover:bg-space-700 text-space-200 border border-space-700 hover:border-telemetry-cyan/50"
              >
                Right Side
              </button>
            </div>

            {/* Shell Opacity Controller */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-space-400">Skin Contour:</span>
              <button
                onClick={() => setShellOpacity((prev) => (prev > 0 ? 0.0 : 0.16))}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                  shellOpacity > 0
                    ? 'bg-space-800 border-space-700 text-space-300'
                    : 'bg-space-900 border-space-800 text-space-500'
                }`}
              >
                {shellOpacity > 0 ? 'Visible' : 'Hidden'}
              </button>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={shellOpacity}
                onChange={(e) => setShellOpacity(parseFloat(e.target.value))}
                className="w-16 accent-telemetry-cyan cursor-pointer"
                title={`Outer Shell Opacity: ${Math.round(shellOpacity * 100)}%`}
              />
            </div>
          </div>
        )}

        {/* Anatomical Systems Exploration Bar */}
        <div className="mt-2.5 pt-2 border-t border-space-800 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-space-400 mr-1 flex items-center gap-1">
            <Layers className="h-3 w-3 text-space-400" />
            Systems:
          </span>
          {ANATOMICAL_SYSTEM_LIST.map((sys) => {
            const isVisible = visibleSystems[sys.id] !== false;
            return (
              <div key={sys.id} className="inline-flex rounded border border-space-800 overflow-hidden">
                <button
                  onClick={() => toggleSystemVisibility(sys.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs transition-colors ${
                    isVisible
                      ? 'bg-space-800 text-space-100'
                      : 'bg-space-900/50 text-space-500 opacity-60'
                  }`}
                  style={{
                    borderLeft: isVisible ? `2px solid ${sys.color}` : '2px solid transparent',
                  }}
                  title={`Toggle ${sys.label} visibility`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: isVisible ? sys.color : '#475569' }}
                  />
                  {getSystemIcon(sys.id)}
                  <span>{sys.label.split(' ')[0]}</span>
                </button>
                <button
                  onClick={() => isolateSystem(sys.id)}
                  className="px-1.5 py-1 font-mono text-[9px] bg-space-850 hover:bg-space-750 text-space-400 hover:text-telemetry-cyan border-l border-space-800"
                  title={`Isolate ${sys.label} (hide all other systems)`}
                >
                  Solo
                </button>
              </div>
            );
          })}
          <button
            onClick={showAllSystems}
            className="rounded px-2 py-1 font-mono text-[10px] text-telemetry-cyan hover:bg-space-800 border border-telemetry-cyan/30 ml-auto"
          >
            Show All
          </button>
        </div>
      </div>

      {/* Accessible Organ Selector Drawer / Panel */}
      {isOrganTreeOpen && (
        <div className="rounded-lg border border-telemetry-cyan/30 bg-space-900 p-4 shadow-hud-card">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-space-800">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-telemetry-cyan" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-space-200">
                Non-3D Accessible Anatomical Structure Index
              </h4>
            </div>
            <button
              onClick={() => setIsOrganTreeOpen(false)}
              className="rounded p-1 text-space-400 hover:text-space-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {ANATOMICAL_STRUCTURE_LIST.map((struct) => {
              const isSelected = selectedStructure === struct.id;
              return (
                <button
                  key={struct.id}
                  onClick={() => {
                    setSelectedStructure(struct.id);
                    setIsOrganTreeOpen(false);
                  }}
                  className={`flex flex-col items-start p-2.5 rounded border text-left font-mono transition-all ${
                    isSelected
                      ? 'bg-space-800 border-telemetry-cyan text-space-100 shadow-md'
                      : 'bg-space-850 hover:bg-space-800 border-space-700 text-space-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: struct.color }}
                    />
                    <span className="text-xs font-bold truncate">{struct.label}</span>
                  </div>
                  <span className="text-[10px] text-space-400 mt-1 truncate">
                    {struct.systemLabel}
                  </span>
                  <span
                    className={`mt-1.5 text-[9px] px-1 rounded ${
                      struct.isContinuousTelemetryAvailable
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {struct.isContinuousTelemetryAvailable ? 'Streaming Active' : 'Periodic'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Layout (Split between 3D Canvas and Contextual Inspector) */}
      <div
        className={`grid gap-4 ${
          isFullscreen
            ? 'flex-1 grid-cols-1 lg:grid-cols-12 min-h-0 h-full overflow-hidden'
            : 'grid-cols-1 lg:grid-cols-12 min-h-[620px]'
        }`}
      >
        {/* Left / Central Column: 3D Scene or 2D Schematic */}
        <div
          className={`flex flex-col rounded-lg border border-space-700 bg-space-900 shadow-hud-card overflow-hidden ${
            isFullscreen ? 'lg:col-span-8 h-full' : 'lg:col-span-7 min-h-[520px]'
          }`}
        >
          {/* Viewport Top Status Banner */}
          <div className="flex items-center justify-between border-b border-space-800 bg-space-850 px-3.5 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: activeStructureConfig.color }}
              />
              <span className="font-mono text-xs font-bold text-space-200 uppercase tracking-wider">
                {activeStructureConfig.label}
              </span>
              <span className="font-mono text-[10px] text-space-400">
                ({activeStructureConfig.systemLabel})
              </span>
            </div>

            <div className="font-mono text-[10px] text-space-400 hidden sm:block">
              {viewMode === '3d'
                ? 'Left Drag: Orbit 360° • Scroll: Zoom • Right Drag: Pan • Click Mesh: Inspect'
                : 'Interactive 2D Telemetry Schematic'}
            </div>
          </div>

          {/* Rendering Canvas Container */}
          <div className="relative flex-1 w-full h-full min-h-[480px]">
            {viewMode === '3d' ? (
              <AnatomyScene
                selectedStructure={selectedStructure}
                onSelectStructure={setSelectedStructure}
                hoveredStructure={hoveredStructure}
                onHoverStructure={setHoveredStructure}
                visibleSystems={visibleSystems}
                isWireframe={isWireframe}
                shellOpacity={shellOpacity}
                isIsolated={isIsolated}
                viewAngle={viewAngle}
                onViewAngleApplied={() => setViewAngle(null)}
                onFallbackTo2D={() => setViewMode('2d')}
                resetTrigger={resetTrigger}
              />
            ) : (
              /* 2D Schematic Fallback */
              <div className="flex h-full w-full flex-col items-center justify-center p-4 bg-gradient-to-b from-[#070d19] via-[#0b1424] to-[#050a14]">
                <svg
                  viewBox="0 0 400 500"
                  className="h-full max-h-[440px] w-auto drop-shadow-lg select-none"
                >
                  <path
                    d="M 200 40 Q 230 40 230 70 Q 230 100 215 110 L 255 130 L 285 240 L 270 245 L 245 155 L 235 240 L 245 360 L 230 470 L 210 470 L 215 280 L 200 280 L 185 280 L 190 470 L 170 470 L 155 360 L 165 240 L 155 155 L 130 245 L 115 240 L 145 130 L 185 110 Q 170 100 170 70 Q 170 40 200 40 Z"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {/* Cranium / Brain */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedStructure('brain_spinal_cord')}
                  >
                    <ellipse
                      cx="200"
                      cy="75"
                      rx="30"
                      ry="35"
                      fill={selectedStructure === 'brain_spinal_cord' ? '#06b6d4' : '#1e293b'}
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                    />
                    <text x="200" y="78" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="monospace">
                      BRAIN
                    </text>
                  </g>
                  {/* Heart */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedStructure('heart')}
                  >
                    <circle
                      cx="195"
                      cy="175"
                      r="16"
                      fill={selectedStructure === 'heart' ? '#dc2626' : '#991b1b'}
                      stroke="#f43f5e"
                      strokeWidth="2"
                    />
                    <text x="195" y="179" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">
                      HEART
                    </text>
                  </g>
                  {/* Lungs */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedStructure('lungs')}
                  >
                    <ellipse
                      cx="165"
                      cy="175"
                      rx="14"
                      ry="24"
                      fill={selectedStructure === 'lungs' ? '#10b981' : '#064e3b'}
                      stroke="#10b981"
                      strokeWidth="1.5"
                    />
                    <ellipse
                      cx="230"
                      cy="175"
                      rx="14"
                      ry="24"
                      fill={selectedStructure === 'lungs' ? '#10b981' : '#064e3b'}
                      stroke="#10b981"
                      strokeWidth="1.5"
                    />
                    <text x="165" y="178" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">
                      LUNG
                    </text>
                    <text x="230" y="178" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">
                      LUNG
                    </text>
                  </g>
                  {/* Liver */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedStructure('liver')}
                  >
                    <ellipse
                      cx="180"
                      cy="215"
                      rx="20"
                      ry="12"
                      fill={selectedStructure === 'liver' ? '#f59e0b' : '#78350f'}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    <text x="180" y="218" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">
                      LIVER
                    </text>
                  </g>
                  {/* Skeleton */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedStructure('skeleton')}
                  >
                    <line x1="200" y1="110" x2="200" y2="280" stroke="#a855f7" strokeWidth="3" />
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

            {/* In-Canvas HUD Overlay Info */}
            <div className="pointer-events-none absolute bottom-3 left-3 max-w-sm rounded bg-space-950/90 backdrop-blur border border-space-700/70 p-2.5 font-mono text-[10px] text-space-300 space-y-1">
              <div>
                <span className="text-telemetry-cyan font-bold">Selected Structure:</span>{' '}
                <span className="text-space-100 font-bold">{activeStructureConfig.label}</span>
              </div>
              <p className="text-[9px] text-space-400 leading-tight">
                Scientific Reference: Illustrative 3D visualization. Not a patient-specific CAD model or clinical pathology diagnosis.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Anatomical Information & Telemetry Inspector */}
        <div
          className={`flex flex-col ${
            isFullscreen ? 'lg:col-span-4 h-full min-h-0' : 'lg:col-span-5 h-[620px]'
          }`}
        >
          <RegionTelemetryInspector
            structureId={selectedStructure}
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
            onDeselect={() => setSelectedStructure(null)}
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
