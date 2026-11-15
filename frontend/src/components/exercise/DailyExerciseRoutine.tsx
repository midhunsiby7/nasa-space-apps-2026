import React from 'react';
import {
  X,
  Dumbbell,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Layers,
  BellRing,
  BookOpen,
} from 'lucide-react';
import { AlertResponse } from '../../types/alert';
import { AnatomyComponentId } from '../anatomy/anatomyModel';

export interface ExerciseSession {
  id: string;
  modality: 'ared_resistive' | 't2_treadmill' | 'cevis_aerobic' | 'recovery';
  title: string;
  targetDurationMinutes: number;
  scheduledUtc: string;
  targetSystems: AnatomyComponentId[];
  protocolDescription: string;
  workloadTarget: string;
  targetMuscles: string;
}

export const DAILY_SCHEDULE: ExerciseSession[] = [
  {
    id: 'ex-01',
    modality: 'ared_resistive',
    title: 'ARED High-Load Resistive Session',
    targetDurationMinutes: 60,
    scheduledUtc: '13:30 - 14:30 UTC',
    targetSystems: ['muscles', 'skeleton'],
    protocolDescription:
      'Standard 4-exercise high-load resistive protocol: Deadlift (3x10), Back Squat (3x10), Heel Raises (3x15), Overhead Press (3x10). Preserves bone mineral density and antigravity muscle volume.',
    workloadTarget: '65% to 80% 1-Repetition Maximum',
    targetMuscles: 'Erector spinae, gluteus maximus, quadriceps, soleus, gastrocnemius',
  },
  {
    id: 'ex-02',
    modality: 't2_treadmill',
    title: 'T2 Treadmill Axial Loading & Aerobic Run',
    targetDurationMinutes: 35,
    scheduledUtc: '16:00 - 16:35 UTC',
    targetSystems: ['heart', 'muscles', 'skeleton'],
    protocolDescription:
      'Harness bungee loading set to 75% body weight equivalent. Interval cadence: 5 min warm-up, 20 min interval running (7.5 - 9.0 km/h), 5 min cool-down. Provides axial skeletal impact loading.',
    workloadTarget: '70% to 85% HR max reserve',
    targetMuscles: 'Lower extremities, axial skeletal column, cardiovascular pump',
  },
  {
    id: 'ex-03',
    modality: 'cevis_aerobic',
    title: 'CEVIS Cycle Ergometer Conditioning',
    targetDurationMinutes: 30,
    scheduledUtc: 'Alternative / Standby',
    targetSystems: ['heart', 'lungs'],
    protocolDescription:
      'Microgravity cycle ergometer cardiovascular endurance training. Constant cadence 60-70 RPM with stepped resistance.',
    workloadTarget: '150 - 200 Watts',
    targetMuscles: 'Quadriceps, hamstrings, cardiovascular endurance',
  },
];

export interface RiskPlan {
  id: string;
  risk: string;
  target: string;
  system: AnatomyComponentId;
  prescription: string[];
  evidence: string;
}

export const PERSONALIZED_PLAN: RiskPlan[] = [
  {
    id: 'bone',
    risk: 'Bone demineralization',
    target: 'Hip, lumbar spine, pelvis, calcaneus',
    system: 'skeleton',
    prescription: [
      'ARED heavy-load squat and deadlift 6 days/week, progressing 65% to 80% 1RM (3 x 10, add load only when form is held).',
      'Heel raises 3 x 15 every ARED session for calcaneal and tibial loading.',
      'T2 treadmill at 75-100% body-weight harness load, 3-4 days/week, for axial impact loading.',
      'Maintain dietary calcium/vitamin D and the 2.5 L daily fluid target to limit renal stone risk from bone mineral release.',
    ],
    evidence:
      'Without countermeasures, spaceflight bone loss in weight-bearing sites is on the order of 1% or more per month; high-load resistive exercise with adequate nutrition substantially reduces it (NASA Human Research Program bone evidence reports; NASA-STD-3001 exercise countermeasure requirements; NASA OSDR rodent and human bone studies).',
  },
  {
    id: 'muscle',
    risk: 'Muscle atrophy',
    target: 'Quadriceps, soleus, gastrocnemius, erector spinae, gluteals',
    system: 'muscles',
    prescription: [
      'Alternate ARED upper/lower emphasis with progressive overload; hold repetition tempo 2 s concentric / 2 s eccentric.',
      'Never skip calf work: soleus and gastrocnemius lose volume fastest in microgravity.',
      'Include 5 min of mobility and core stabilisation after each resistive session.',
      'Re-test strength weekly and increase load when the final repetitions are completed with margin.',
    ],
    evidence:
      'Antigravity muscle volume and strength decline rapidly in unloaded flight; ISS crews on ARED-based programmes retain markedly more muscle than earlier low-load regimes (NASA HRP muscle evidence reports; NASA-STD-3001 Vol. 1 crew health and performance standards; NASA OSDR muscle transcriptomics datasets).',
  },
  {
    id: 'cardio',
    risk: 'Cardiovascular deconditioning and orthostatic intolerance',
    target: 'Heart, arteries, lungs',
    system: 'heart',
    prescription: [
      'Aerobic work 5-6 days/week: T2 intervals at 70-85% HR reserve alternating with CEVIS at 60-70 RPM.',
      'Include one high-intensity interval session weekly (4 x 4 min near 85-90% HR max) if telemetry is nominal.',
      'Hydrate and take fluid/salt loading as prescribed in the 24 h before landing to protect orthostatic tolerance.',
      'Record resting heart rate and blood pressure each morning; a sustained rise from your personal baseline should be reported.',
    ],
    evidence:
      'Plasma volume loss and cardiac remodelling in microgravity reduce aerobic capacity and orthostatic tolerance; combined aerobic and resistive training mitigates these changes (NASA HRP cardiovascular evidence reports; NASA-STD-3001 physiological readiness criteria; NASA OSDR cardiovascular and Twins Study datasets).',
  },
];

interface DailyExerciseRoutineProps {
  isOpen: boolean;
  onClose: () => void;
  alerts?: AlertResponse[];
  missionDay?: number;
  onSelectComponent?: (comp: AnatomyComponentId) => void;
}

export const DailyExerciseRoutine: React.FC<DailyExerciseRoutineProps> = ({
  isOpen,
  onClose,
  alerts = [],
  missionDay,
  onSelectComponent,
}) => {
  if (!isOpen) return null;

  // Check for active critical alerts that contraindicate exercise
  const activeAlerts = alerts.filter(
    (a) => a.status === 'active' || a.status === 'acknowledged'
  );
  const criticalAlert = activeAlerts.find(
    (a) => a.severity === 'critical' || a.severity === 'high'
  );
  const isExerciseSuspended = Boolean(criticalAlert);

  // Personalisation: systems flagged by active alerts are prioritised first
  const flaggedSystems = new Set<AnatomyComponentId>();
  activeAlerts.forEach((a) => {
    const cat = `${a.measurement_type} ${a.category}`.toLowerCase();
    if (/heart|blood_pressure|cardio|hemodynamic|spo2|respir/.test(cat)) flaggedSystems.add('heart');
    if (/bone|skelet|calcium/.test(cat)) flaggedSystems.add('skeleton');
    if (/muscl/.test(cat)) flaggedSystems.add('muscles');
  });
  const orderedPlan = [...PERSONALIZED_PLAN].sort(
    (a, b) => Number(flaggedSystems.has(b.system)) - Number(flaggedSystems.has(a.system))
  );

  return (
    <div className="flex flex-col h-full bg-space-900 border-l border-space-700/80 shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-space-700 bg-space-950/80">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-telemetry-cyan" />
          <div>
            <h3 className="font-mono text-sm font-bold text-space-100 uppercase tracking-wider">
              Daily Countermeasures Plan
            </h3>
            <span className="font-mono text-[10px] text-space-400">
              NASA-STD-3001 Prescription
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded text-space-400 hover:text-space-100 hover:bg-space-800 transition-colors"
          title="Close Exercise Panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Daily Exercise Protocol Reminder */}
        <div
          role="alert"
          className="rounded-lg border-2 border-telemetry-amber bg-telemetry-amber/10 p-3.5 font-mono"
        >
          <div className="flex items-center gap-2 text-telemetry-amber font-bold text-xs uppercase tracking-wider mb-1.5">
            <BellRing className="h-5 w-5" />
            <span>Daily Exercise Protocol Reminder</span>
          </div>
          <p className="text-xs text-space-100 leading-relaxed">
            Complete 100% of scheduled countermeasure sessions daily without omission to prevent microgravity
            musculoskeletal atrophy and orthostatic intolerance.
          </p>
        </div>

        {/* Strict Medical Contraindication Safety Block */}
        {isExerciseSuspended ? (
          <div className="rounded-lg border-2 border-telemetry-rose bg-telemetry-rose/15 p-3.5 font-mono">
            <div className="flex items-center gap-2 text-telemetry-rose font-bold text-xs uppercase tracking-wider mb-2">
              <AlertOctagon className="h-5 w-5 animate-pulse" />
              <span>SAFETY INTERLOCK: EXERCISE SUSPENDED</span>
            </div>
            <p className="text-xs text-space-100 leading-relaxed mb-2">
              High-intensity countermeasure exercise is strictly contra-indicated due to active physiological anomaly:
            </p>
            <div className="rounded bg-space-950/70 p-2 text-xs border border-telemetry-rose/40 text-space-200 font-mono mb-2">
              <strong>{criticalAlert?.title || 'Severe System Anomaly'}</strong>
              <div className="text-[11px] text-space-300 mt-1">{criticalAlert?.explanation}</div>
            </div>
            <p className="text-[11px] text-space-300 italic">
              Flight Surgeon review and verbal clearance via Capcom required before resuming mechanical load.
            </p>
          </div>
        ) : (
          <div className="rounded border border-telemetry-emerald/40 bg-telemetry-emerald/10 p-3 font-mono text-xs text-telemetry-emerald">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Physiological Clearance Nominal</span>
            </div>
            <p className="text-[11px] text-space-300">
              Current telemetry and vital trends meet NASA-STD-3001 physiological readiness criteria for scheduled countermeasure sessions.
            </p>
          </div>
        )}

        {/* Total Time Allocation Overview */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="rounded border border-space-800 bg-space-850 p-2.5">
            <span className="text-[10px] text-space-400 uppercase block">Daily Countermeasure Time</span>
            <strong className="text-sm text-telemetry-cyan">2.5 Hours</strong>
            <span className="text-[9px] text-space-400 block mt-0.5">Incl. setup & hygiene</span>
          </div>
          <div className="rounded border border-space-800 bg-space-850 p-2.5">
            <span className="text-[10px] text-space-400 uppercase block">Active Loading Time</span>
            <strong className="text-sm text-telemetry-emerald">95 Minutes</strong>
            <span className="text-[9px] text-space-400 block mt-0.5">Resistive + Aerobic</span>
          </div>
        </div>

        {/* Personalized Prevention Plan */}
        <div className="space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-space-400">
            Personalized Prevention Plan{missionDay ? ` \u2022 Mission Day ${missionDay}` : ''}
          </div>
          {orderedPlan.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border p-3.5 ${
                flaggedSystems.has(item.system)
                  ? 'border-telemetry-amber bg-telemetry-amber/10'
                  : 'border-space-700 bg-space-850'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-mono text-xs font-bold text-space-100">{item.risk}</h4>
                {flaggedSystems.has(item.system) && (
                  <span className="shrink-0 rounded border border-telemetry-amber px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-telemetry-amber">
                    Priority: active alert
                  </span>
                )}
              </div>
              <div className="font-mono text-[10px] text-space-400 mt-0.5">Target: {item.target}</div>
              <ul className="mt-2 list-disc pl-4 space-y-1 text-[11px] text-space-200 leading-relaxed">
                {item.prescription.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="mt-2 flex items-start gap-1.5 rounded bg-space-800 border border-space-700 p-2 text-[10px] font-mono text-space-300 leading-relaxed">
                <BookOpen className="h-3 w-3 shrink-0 mt-0.5 text-telemetry-cyan" />
                <span>{item.evidence}</span>
              </div>
            </div>
          ))}
          <p className="font-mono text-[10px] text-space-400 italic">
            Decision-support summary of published NASA guidance. Final prescriptions are set by the crew exercise
            physiologist and Flight Surgeon.
          </p>
        </div>

        {/* Scheduled Sessions */}
        <div className="space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-space-400">
            Scheduled Countermeasure Modalities
          </div>

          {DAILY_SCHEDULE.map((session) => (
            <div
              key={session.id}
              className={`rounded-lg border p-3.5 transition-all ${
                isExerciseSuspended
                  ? 'border-space-800 bg-space-900/60 opacity-60'
                  : 'border-space-750 bg-space-850 hover:border-space-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-mono text-xs font-bold text-space-100">
                    {session.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-space-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.scheduledUtc}
                    </span>
                    <span>•</span>
                    <span>{session.targetDurationMinutes} min</span>
                  </div>
                </div>

                <span className="rounded px-2 py-0.5 text-[9px] font-mono border border-space-700 bg-space-900 text-space-300">
                  {session.modality.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-space-200 mb-2 leading-relaxed">
                {session.protocolDescription}
              </p>

              <div className="rounded bg-space-900 p-2 border border-space-800 text-[10px] font-mono text-space-300 space-y-1 mb-2">
                <div>
                  <span className="text-space-400">Workload Target: </span>
                  <span className="text-telemetry-cyan font-bold">{session.workloadTarget}</span>
                </div>
                <div>
                  <span className="text-space-400">Target Muscle Groups: </span>
                  <span className="text-space-200">{session.targetMuscles}</span>
                </div>
              </div>

              {/* 3D Highlight Button */}
              {onSelectComponent && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {session.targetSystems.map((sys) => (
                    <button
                      key={sys}
                      type="button"
                      disabled={isExerciseSuspended}
                      onClick={() => onSelectComponent(sys)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-space-800 hover:bg-space-750 text-[10px] font-mono text-telemetry-cyan border border-telemetry-cyan/25 transition-colors disabled:opacity-40"
                    >
                      <Layers className="h-2.5 w-2.5" />
                      <span>Highlight {sys.toUpperCase()} on 3D Model</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
