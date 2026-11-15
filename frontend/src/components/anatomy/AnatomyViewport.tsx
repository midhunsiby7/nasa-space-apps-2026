import React, { useState, useMemo } from 'react';
import {
  Activity,
  Layers,
  RotateCcw,
  Box,
  AlertTriangle,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation } from '../../types/trend';
import { AlertResponse } from '../../types/alert';
import { AssessmentResponse } from '../../types/assessment';
import {
  AnatomyComponentId,
  AnatomyViewMode,
  ANATOMY_COMPONENTS,
} from './anatomyModel';
import { deriveAnatomyWarnings } from './anatomyWarnings';
import { AnatomyScene } from './AnatomyScene';
import { AnatomySchematic2D } from './AnatomySchematic2D';
import { AnatomyModeSwitch } from './AnatomyModeSwitch';
import { ComponentDetailDrawer } from './ComponentDetailDrawer';
import { OperationalView } from '../astronaut/OperationalView';
import { SensorDetailsDrawer } from '../sensors/SensorDetailsDrawer';
import { DailyExerciseRoutine } from '../exercise/DailyExerciseRoutine';
import { DailyHealthReminderModal } from '../reminders/DailyHealthReminderModal';
import { CompactMissionOverview } from '../dashboard/CompactMissionOverview';

interface AnatomyViewportProps {
  astronaut: Astronaut | null;
  measurements: Measurement[];
  baselines?: BaselineResponse[];
  trends?: TrendObservation[];
  alerts?: AlertResponse[];
  assessment?: AssessmentResponse | null;
  selectedMetric?: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  onNavigateToBaselines?: (metric: MeasurementType) => void;
  onNavigateToCatalog?: (metric: MeasurementType) => void;
  onNavigateToResearch?: (bodySystem?: string) => void;
}

type RightDrawerType = 'none' | 'sensors' | 'exercise';

export const AnatomyViewport: React.FC<AnatomyViewportProps> = ({
  astronaut,
  measurements,
  baselines = [],
  trends = [],
  alerts = [],
  assessment = null,
  onSelectMetric,
}) => {
  // Anatomy Selection & View Mode
  const [selectedComponent, setSelectedComponent] = useState<AnatomyComponentId | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<AnatomyComponentId | null>(null);
  const [viewMode, setViewMode] = useState<AnatomyViewMode>('full');
  const [renderEngine, setRenderEngine] = useState<'3d' | '2d'>('3d');
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  // Collapsible Right Panel State
  const [rightDrawer, setRightDrawer] = useState<RightDrawerType>('none');

  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Modals
  const [isReminderOpen, setIsReminderOpen] = useState<boolean>(false);

  // Derive component-level warning states from live alerts
  const warningStates = useMemo(() => {
    return deriveAnatomyWarnings(alerts, assessment, measurements, baselines);
  }, [alerts, assessment, measurements, baselines]);

  const flaggedComponents = useMemo(
    () =>
      Object.values(ANATOMY_COMPONENTS)
        .filter((c) => c.id !== 'body_shell' && warningStates[c.id]?.level !== 'nominal')
        .sort((a, b) => Number(warningStates[b.id].level === 'critical') - Number(warningStates[a.id].level === 'critical')),
    [warningStates]
  );

  const handleComponentSelect = (compId: AnatomyComponentId) => {
    setSelectedComponent(compId);
    setIsDetailOpen(true);
    // Map to primary telemetry metric if applicable
    const comp = ANATOMY_COMPONENTS[compId];
    if (comp && comp.telemetryKeys.length > 0) {
      onSelectMetric(comp.telemetryKeys[0]);
    }
  };

  const handleResetCamera = () => {
    setSelectedComponent(null);
    setIsDetailOpen(false);
    setResetTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Viewport Control Bar */}
      <div className="rounded-lg border border-space-700 bg-space-850 p-3 shadow-hud-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title & Mode Switch */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Activity className="h-4 w-4 text-telemetry-cyan" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                Interactive 3D Human Anatomy Cockpit
              </h3>
              <span className="rounded bg-telemetry-cyan/15 px-2 py-0.5 font-mono text-[10px] text-telemetry-cyan border border-telemetry-cyan/30">
                {renderEngine === '3d' ? 'GLTF 2.0 MULTI-MESH HOLOGRAPH' : '2D SCHEMATIC PROJECTION'}
              </span>
              <span className="rounded bg-space-750 px-2 py-0.5 font-mono text-[10px] text-space-300 border border-space-650">
                13 ANATOMICAL MESHES
              </span>
            </div>
          </div>

          {/* Controls: Reset, 3D/2D switch, Wireframe */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetCamera}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-space-800 hover:bg-space-750 text-space-300 hover:text-space-100 border border-space-700 text-xs font-mono transition-colors"
              title="Reset camera framing to default full-body perspective"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Camera</span>
            </button>

            <button
              type="button"
              onClick={() => setRenderEngine(renderEngine === '3d' ? '2d' : '3d')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-space-800 hover:bg-space-750 text-telemetry-cyan border border-space-700 text-xs font-mono transition-colors"
              title="Switch between 3D Mesh and 2D Orthographic Schematic"
            >
              <Box className="h-3.5 w-3.5" />
              <span>{renderEngine === '3d' ? '2D Schematic' : '3D Hologram'}</span>
            </button>

            {renderEngine === '3d' && (
              <button
                type="button"
                onClick={() => setIsWireframe(!isWireframe)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono transition-colors ${
                  isWireframe
                    ? 'bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan'
                    : 'bg-space-800 border-space-700 text-space-300 hover:text-space-100'
                }`}
                title="Toggle wireframe topology"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Wireframe</span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Cockpit Layout: 3D anatomy is the dominant centerpiece (~66% width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 space-y-3">
          <div
            className="relative rounded-xl border border-slate-700 overflow-hidden shadow-xl w-full"
            style={{ height: 'max(720px, 80vh)', background: 'linear-gradient(to bottom, #020617, #0f172a)' }}
          >
            {renderEngine === '3d' ? (
              <AnatomyScene
                selectedComponent={selectedComponent}
                onSelectComponent={handleComponentSelect}
                hoveredComponent={hoveredComponent}
                onHoverComponent={setHoveredComponent}
                warningStates={warningStates}
                viewMode={viewMode}
                isWireframe={isWireframe}
                onFallbackTo2D={() => setRenderEngine('2d')}
                resetTrigger={resetTrigger}
              />
            ) : (
              <AnatomySchematic2D
                selectedComponent={selectedComponent}
                onSelectComponent={handleComponentSelect}
                hoveredComponent={hoveredComponent}
                onHoverComponent={setHoveredComponent}
                warningStates={warningStates}
                viewMode={viewMode}
              />
            )}

            {/* Attention tags: parts needing special care */}
            <div className="absolute top-3 left-3 z-10 flex max-w-[55%] flex-col items-start gap-1.5">
              {flaggedComponents.length === 0 ? (
                <span className="rounded-lg border border-telemetry-emerald/40 bg-space-900/90 px-3 py-1.5 font-mono text-[11px] text-telemetry-emerald">
                  ALL SYSTEMS NOMINAL
                </span>
              ) : (
                flaggedComponents.map((c) => {
                  const critical = warningStates[c.id].level === 'critical';
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleComponentSelect(c.id)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold backdrop-blur animate-pulse ${
                        critical
                          ? 'border-telemetry-rose bg-telemetry-rose/25 text-telemetry-rose'
                          : 'border-telemetry-amber bg-telemetry-amber/25 text-telemetry-amber'
                      }`}
                      title={warningStates[c.id].message}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{c.label.split(' (')[0]}: {critical ? 'CRITICAL' : 'ATTENTION'}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Click-to-open part detail popup */}
            {isDetailOpen && selectedComponent && (
              <div className="absolute top-3 right-3 bottom-3 z-20 flex w-[min(380px,calc(100%-1.5rem))] items-start">
                <ComponentDetailDrawer
                  componentId={selectedComponent}
                  onClose={() => setIsDetailOpen(false)}
                  warningState={warningStates[selectedComponent]}
                  measurements={measurements}
                  baselines={baselines}
                  trends={trends}
                  onSelectMetric={onSelectMetric}
                  onNavigateToExercise={() => {
                    setIsDetailOpen(false);
                    setRightDrawer('exercise');
                  }}
                />
              </div>
            )}

            <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-space-900/80 border border-space-800 backdrop-blur text-[10px] font-mono text-space-400">
              <span>Drag: Rotate</span>
              <span>•</span>
              <span>Scroll: Zoom</span>
              <span>•</span>
              <span>Click Part: Details</span>
            </div>
          </div>

          {/* System view options directly below the 3D model */}
          <div className="rounded-lg border border-space-700 bg-space-850 p-3 shadow-hud-card">
            <AnatomyModeSwitch currentMode={viewMode} onSelectMode={setViewMode} />
          </div>
        </div>

        {/* Side column: context drawers + operational view */}
        <div className="lg:col-span-4 space-y-4">
          {rightDrawer !== 'none' && (
            <div className="h-[560px] rounded-xl overflow-hidden border border-space-700/80 shadow-2xl">
              {rightDrawer === 'sensors' && (
                <SensorDetailsDrawer isOpen={true} onClose={() => setRightDrawer('none')} />
              )}
              {rightDrawer === 'exercise' && (
                <DailyExerciseRoutine
                  isOpen={true}
                  onClose={() => setRightDrawer('none')}
                  alerts={alerts}
                  missionDay={astronaut?.mission_day}
                  onSelectComponent={(comp) => {
                    setSelectedComponent(comp);
                    setIsDetailOpen(true);
                    setRightDrawer('none');
                  }}
                />
              )}
            </div>
          )}
          <OperationalView
            astronaut={astronaut}
            measurements={measurements}
            baselines={baselines}
            trends={trends}
            alerts={alerts}
            onSelectMetric={onSelectMetric}
            onOpenSensorDetails={() => setRightDrawer('sensors')}
            onOpenExercisePlan={() => setRightDrawer('exercise')}
            onOpenReminderModal={() => setIsReminderOpen(true)}
          />
          <CompactMissionOverview
            astronaut={astronaut}
            measurements={measurements}
            alerts={alerts}
            baselines={baselines}
            trends={trends}
          />
        </div>
      </div>

      {/* Daily Health Reminder Modal */}
      <DailyHealthReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        astronautName={astronaut?.name}
        alerts={alerts}
        measurements={measurements}
        baselines={baselines}
      />
    </div>
  );
};
