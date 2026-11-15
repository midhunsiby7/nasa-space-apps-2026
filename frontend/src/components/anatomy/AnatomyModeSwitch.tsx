import React from 'react';
import { Brain, Bone, Activity, Layers, Info } from 'lucide-react';
import { AnatomyViewMode } from './anatomyModel';

interface AnatomyModeSwitchProps {
  currentMode: AnatomyViewMode;
  onSelectMode: (mode: AnatomyViewMode) => void;
  className?: string;
}

export const AnatomyModeSwitch: React.FC<AnatomyModeSwitchProps> = ({
  currentMode,
  onSelectMode,
  className = '',
}) => {
  const handleToggle = (mode: AnatomyViewMode) => onSelectMode(mode);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Anatomy system view">
        {/* Full Anatomy indicator / reset button */}
        <button
          type="button"
          onClick={() => handleToggle('full')}
          aria-pressed={currentMode === 'full'}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-mono font-medium transition-all duration-200 border ${
            currentMode === 'full'
              ? 'bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan shadow-hud-glow'
              : 'bg-space-850/80 border-space-700 text-space-300 hover:border-space-500 hover:text-space-100'
          }`}
          title="Display full multi-system anatomy"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>FULL BODY</span>
        </button>

        {/* Mode 1: Nerves */}
        <button
          type="button"
          onClick={() => handleToggle('nerves')}
          aria-pressed={currentMode === 'nerves'}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-mono font-medium transition-all duration-200 border ${
            currentMode === 'nerves'
              ? 'bg-telemetry-sky/25 border-telemetry-sky text-telemetry-sky shadow-hud-glow font-bold'
              : 'bg-space-850/80 border-space-700 text-space-300 hover:border-telemetry-sky/50 hover:text-telemetry-sky'
          }`}
          title="Filter to Central Nervous System (Brain and Spinal Cord)."
        >
          <Brain className="h-3.5 w-3.5" />
          <span>NERVES</span>
        </button>

        {/* Mode 2: Bones */}
        <button
          type="button"
          onClick={() => handleToggle('bones')}
          aria-pressed={currentMode === 'bones'}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-mono font-medium transition-all duration-200 border ${
            currentMode === 'bones'
              ? 'bg-slate-400/25 border-slate-300 text-slate-100 shadow-hud-glow font-bold'
              : 'bg-space-850/80 border-space-700 text-space-300 hover:border-slate-400/50 hover:text-slate-200'
          }`}
          title="Filter to Skeletal Framework (Axial and Appendicular)."
        >
          <Bone className="h-3.5 w-3.5" />
          <span>BONES</span>
        </button>

        {/* Mode 3: Muscles */}
        <button
          type="button"
          onClick={() => handleToggle('muscles')}
          aria-pressed={currentMode === 'muscles'}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-mono font-medium transition-all duration-200 border ${
            currentMode === 'muscles'
              ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-hud-glow font-bold'
              : 'bg-space-850/80 border-space-700 text-space-300 hover:border-amber-400/50 hover:text-amber-200'
          }`}
          title="Filter to Muscular Structures."
        >
          <Activity className="h-3.5 w-3.5" />
          <span>MUSCLES</span>
        </button>
      </div>

      {/* Geometry boundary disclosure banner */}
      <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded bg-space-900/60 border border-space-700/60 text-[11px] text-space-400 font-mono">
        <Info className="h-3.5 w-3.5 text-telemetry-cyan shrink-0 mt-0.5" />
        <span>
          <strong className="text-space-300">Anatomical Boundaries:</strong> Central nervous system only (peripheral nerves not present in 3D geometry); SANS surveillance via clinical protocol (no ocular mesh).
        </span>
      </div>
    </div>
  );
};
