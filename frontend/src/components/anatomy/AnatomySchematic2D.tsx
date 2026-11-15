import React from 'react';
import {
  AnatomyComponentId,
  AnatomyViewMode,
} from './anatomyModel';
import { ComponentWarningState } from './anatomyWarnings';

interface AnatomySchematic2DProps {
  selectedComponent: AnatomyComponentId | null;
  onSelectComponent: (componentId: AnatomyComponentId) => void;
  hoveredComponent: AnatomyComponentId | null;
  onHoverComponent: (componentId: AnatomyComponentId | null) => void;
  warningStates: Record<AnatomyComponentId, ComponentWarningState>;
  viewMode: AnatomyViewMode;
}

export const AnatomySchematic2D: React.FC<AnatomySchematic2DProps> = ({
  selectedComponent,
  onSelectComponent,
  hoveredComponent,
  onHoverComponent,
  warningStates,
  viewMode,
}) => {
  const getFillColor = (id: AnatomyComponentId, defaultHex: string) => {
    if (selectedComponent === id) return '#06b6d4';
    if (hoveredComponent === id) return '#38bdf8';
    const warning = warningStates[id];
    if (warning?.level === 'critical') return '#f43f5e';
    if (warning?.level === 'caution') return '#f59e0b';
    return defaultHex;
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-space-900 rounded-lg border border-space-700 w-full h-[540px]">
      <div className="absolute top-3 left-4 text-xs font-mono text-space-400">
        2D ORTHOGRAPHIC SCHEMATIC PROJECTION
      </div>

      <svg
        viewBox="0 0 300 600"
        className="h-full max-h-[500px] w-auto drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.15))' }}
      >
        {/* Outer body silhouette */}
        <path
          d="M 150,30 C 130,30 120,45 120,65 C 120,85 130,95 135,100 C 115,110 80,125 75,170 C 70,215 70,280 75,340 C 78,370 85,380 90,380 C 95,380 100,340 105,300 C 110,260 115,220 120,180 C 125,180 125,320 125,370 C 125,430 115,530 115,570 C 115,585 135,585 140,570 C 145,540 148,440 150,380 C 152,440 155,540 160,570 C 165,585 185,585 185,570 C 185,530 175,430 175,370 C 175,320 175,180 180,180 C 185,220 190,260 195,300 C 200,340 205,380 210,380 C 215,380 222,370 225,340 C 230,280 230,215 225,170 C 220,125 185,110 165,100 C 170,95 180,85 180,65 C 180,45 170,30 150,30 Z"
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeDasharray="4 2"
          opacity="0.35"
        />

        {/* Central Nervous System: Brain & Spine */}
        {(viewMode === 'full' || viewMode === 'nerves') && (
          <g
            onClick={() => onSelectComponent('brain_spine')}
            onMouseEnter={() => onHoverComponent('brain_spine')}
            onMouseLeave={() => onHoverComponent(null)}
            className="cursor-pointer transition-all duration-200"
          >
            {/* Brain */}
            <circle
              cx="150"
              cy="65"
              r="22"
              fill={getFillColor('brain_spine', '#0284c7')}
              opacity="0.85"
            />
            {/* Spinal Cord */}
            <rect
              x="147"
              y="87"
              width="6"
              height="160"
              rx="3"
              fill={getFillColor('brain_spine', '#0284c7')}
              opacity="0.85"
            />
          </g>
        )}

        {/* Skeletal Framework */}
        {(viewMode === 'full' || viewMode === 'bones') && (
          <g
            onClick={() => onSelectComponent('skeleton')}
            onMouseEnter={() => onHoverComponent('skeleton')}
            onMouseLeave={() => onHoverComponent(null)}
            className="cursor-pointer transition-all duration-200"
          >
            {/* Ribcage arcs */}
            <path
              d="M 125,140 Q 150,150 175,140 M 120,155 Q 150,168 180,155 M 122,170 Q 150,184 178,170 M 125,185 Q 150,198 175,185"
              fill="none"
              stroke={getFillColor('skeleton', '#94a3b8')}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.75"
            />
            {/* Pelvis */}
            <path
              d="M 125,270 Q 150,295 175,270 L 165,300 Q 150,305 135,300 Z"
              fill={getFillColor('skeleton', '#64748b')}
              opacity="0.75"
            />
          </g>
        )}

        {/* Muscular Framework */}
        {viewMode === 'muscles' && (
          <g
            onClick={() => onSelectComponent('muscles')}
            onMouseEnter={() => onHoverComponent('muscles')}
            onMouseLeave={() => onHoverComponent(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <path
              d="M 115,120 C 100,160 100,240 115,280 C 130,285 170,285 185,280 C 200,240 200,160 185,120 Z"
              fill={getFillColor('muscles', '#f97316')}
              opacity="0.8"
            />
          </g>
        )}

        {/* Lungs */}
        {viewMode === 'full' && (
          <g
            onClick={() => onSelectComponent('lungs')}
            onMouseEnter={() => onHoverComponent('lungs')}
            onMouseLeave={() => onHoverComponent(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <ellipse
              cx="133"
              cy="165"
              rx="14"
              ry="26"
              fill={getFillColor('lungs', '#06b6d4')}
              opacity="0.8"
            />
            <ellipse
              cx="167"
              cy="165"
              rx="14"
              ry="26"
              fill={getFillColor('lungs', '#06b6d4')}
              opacity="0.8"
            />
          </g>
        )}

        {/* Heart */}
        {viewMode === 'full' && (
          <g
            onClick={() => onSelectComponent('heart')}
            onMouseEnter={() => onHoverComponent('heart')}
            onMouseLeave={() => onHoverComponent(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <circle
              cx="154"
              cy="166"
              r="12"
              fill={getFillColor('heart', '#f43f5e')}
              stroke="#ffffff"
              strokeWidth={selectedComponent === 'heart' ? '2' : '0.5'}
            />
          </g>
        )}

        {/* Liver */}
        {viewMode === 'full' && (
          <g
            onClick={() => onSelectComponent('liver')}
            onMouseEnter={() => onHoverComponent('liver')}
            onMouseLeave={() => onHoverComponent(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <polygon
              points="132,205 160,208 152,228 128,222"
              fill={getFillColor('liver', '#b45309')}
              opacity="0.85"
            />
          </g>
        )}

        {/* Stomach */}
        {viewMode === 'full' && (
          <g
            onClick={() => onSelectComponent('stomach')}
            onMouseEnter={() => onHoverComponent('stomach')}
            onMouseLeave={() => onHoverComponent(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <path
              d="M 152,210 Q 168,220 162,236 Q 150,240 148,226 Z"
              fill={getFillColor('stomach', '#fbbf24')}
              opacity="0.85"
            />
          </g>
        )}

        {/* Kidneys */}
        {viewMode === 'full' && (
          <g
            onClick={() => onSelectComponent('kidneys')}
            onMouseEnter={() => onHoverComponent('kidneys')}
            onMouseLeave={() => onHoverComponent(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <ellipse cx="134" cy="225" rx="5" ry="9" fill={getFillColor('kidneys', '#d97706')} />
            <ellipse cx="166" cy="225" rx="5" ry="9" fill={getFillColor('kidneys', '#d97706')} />
          </g>
        )}

        {/* Intestines / Sensor pill capsule */}
        {viewMode === 'full' && (
          <g
            onClick={() => onSelectComponent('intestines')}
            onMouseEnter={() => onHoverComponent('intestines')}
            onMouseLeave={() => onHoverComponent(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <rect
              x="138"
              y="238"
              width="24"
              height="24"
              rx="6"
              fill={getFillColor('intestines', '#ca8a04')}
              opacity="0.85"
            />
          </g>
        )}

        {/* Bladder */}
        {viewMode === 'full' && (
          <g
            onClick={() => onSelectComponent('bladder')}
            onMouseEnter={() => onHoverComponent('bladder')}
            onMouseLeave={() => onHoverComponent(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <circle
              cx="150"
              cy="282"
              r="8"
              fill={getFillColor('bladder', '#f59e0b')}
              opacity="0.85"
            />
          </g>
        )}
      </svg>

      <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-mono">
        <span className="flex items-center gap-1 text-space-300">
          <span className="w-2.5 h-2.5 rounded-full bg-telemetry-cyan" /> Selected
        </span>
        <span className="flex items-center gap-1 text-space-300">
          <span className="w-2.5 h-2.5 rounded-full bg-telemetry-amber" /> Caution Alert
        </span>
        <span className="flex items-center gap-1 text-space-300">
          <span className="w-2.5 h-2.5 rounded-full bg-telemetry-rose" /> Critical Alert
        </span>
      </div>
    </div>
  );
};
