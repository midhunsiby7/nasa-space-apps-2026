import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Users,
  Activity,
  Heart,
  Layers,
  TrendingUp,
  Brain,
  ClipboardList,
  ShieldAlert,
  Radio,
  Box,
} from 'lucide-react';
import { ActiveTab } from '../layout/Sidebar';
import { MeasurementType } from '../../types/measurement';
import { AnatomicalRegionId } from '../anatomy/anatomyRegistry';

export type DemoTriggerAction =
  | 'open_symptoms'
  | 'open_non_anatomical'
  | 'switch_to_2d'
  | 'switch_to_3d'
  | 'trends_tab'
  | 'assessment_tab';

export interface DemoStep {
  stepNumber: number;
  title: string;
  category: string;
  icon: React.ReactNode;
  description: string;
  whyItMatters: string;
  actionLabel: string;
  tab: ActiveTab;
  astronautId?: string;
  metric?: MeasurementType;
  region?: AnatomicalRegionId;
  triggerAction?: DemoTriggerAction;
}

interface JudgeDemoControllerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectAstronaut: (id: string) => void;
  onSelectMetric: (metric: MeasurementType) => void;
  onTriggerDemoAction?: (action: string) => void;
  selectedAstronautId: string | null;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    title: 'Select Synthetic Astronaut Profile',
    category: 'Crew Telemetry & Provenance',
    icon: <Users className="h-4 w-4 text-telemetry-cyan" />,
    description: 'Inspect CDR Elena Rostova on Artemis III (Day 42). Notice the prominent SYNTHETIC SIMULATION provenance badge and astronaut profile metadata.',
    whyItMatters: 'Preserves scientific transparency between analog/research datasets and synthetic physiological simulation models.',
    actionLabel: 'Select Dr. Elena Rostova',
    tab: 'dashboard',
    astronautId: 'AST-001',
  },
  {
    stepNumber: 2,
    title: 'Explore 3D Holographic Anatomy',
    category: 'Spatial Visualization',
    icon: <Activity className="h-4 w-4 text-telemetry-emerald" />,
    description: 'Switch to the 3D Holographic Anatomy model. Camera automatically focuses on the cardiovascular thoracic region with synchronized cardiac pulse animation.',
    whyItMatters: 'Transforms abstract tabular telemetry into an intuitive spatial map while clearly disclaiming the mannequin as an illustrative navigation model.',
    actionLabel: 'Open 3D Anatomy Map',
    tab: 'anatomy',
    region: 'cardiovascular',
    triggerAction: 'switch_to_3d',
  },
  {
    stepNumber: 3,
    title: 'Inspect Physiological Telemetry Stream',
    category: 'Telemetry Monitoring',
    icon: <Heart className="h-4 w-4 text-rose-400" />,
    description: 'Inspect the live Heart Rate biometric stream, sensor calibration, sampling rate (1.0 Hz), and verified telemetry currency.',
    whyItMatters: 'Validates physiological time-series stream ingestion and data quality metrics against NASA telemetry conventions.',
    actionLabel: 'View Heart Rate Telemetry',
    tab: 'telemetry',
    metric: 'heart_rate',
  },
  {
    stepNumber: 4,
    title: 'Inspect Personal Operational Envelope (POE)',
    category: 'Intra-Individual Baselines',
    icon: <Layers className="h-4 w-4 text-telemetry-cyan" />,
    description: 'Inspect the personal baseline calculation engine. Observe non-parametric quantiles (P05, P25, P50, P75, P95) and immutable preflight reference envelope.',
    whyItMatters: 'Replaces generic population averages with intra-individual personal baselines to avoid false positives caused by microgravity adaptation.',
    actionLabel: 'Inspect Personal Baselines',
    tab: 'intelligence',
    metric: 'heart_rate',
  },
  {
    stepNumber: 5,
    title: 'Analyze Longitudinal Trend Velocity',
    category: 'Trend Intelligence',
    icon: <TrendingUp className="h-4 w-4 text-telemetry-amber" />,
    description: 'Examine Sen’s slope rate-of-change, robust Z-score deviations, and 7-day lookback trajectories in the Trend Matrix.',
    whyItMatters: 'Detects slow, insidious physiological degradation early rather than waiting for acute boundary crossings.',
    actionLabel: 'Open Trend Matrix',
    tab: 'intelligence',
    triggerAction: 'trends_tab',
  },
  {
    stepNumber: 6,
    title: 'Examine Explainable Health Assessment',
    category: 'Decision Support',
    icon: <Brain className="h-4 w-4 text-purple-400" />,
    description: 'Review the automated multi-tier health assessment synthesis, root cause findings, baseline versions used, and safe non-prescriptive operational guidance.',
    whyItMatters: 'Provides explainable decision support without fabricating medical diagnoses or drug prescriptions.',
    actionLabel: 'Review Assessment Findings',
    tab: 'intelligence',
    triggerAction: 'assessment_tab',
  },
  {
    stepNumber: 7,
    title: 'Report Crew Subjective Symptom',
    category: 'Clinical Primacy',
    icon: <ClipboardList className="h-4 w-4 text-purple-300" />,
    description: 'Launch the crew symptom reporting modal to submit subjective complaints (e.g., Cephalad Head Fullness / Headache or Space Motion Sickness).',
    whyItMatters: 'Crucial demonstration that astronaut self-reported symptoms are incorporated into real-time operational assessment.',
    actionLabel: 'Open Symptom Reporting',
    tab: 'intelligence',
    triggerAction: 'open_symptoms',
  },
  {
    stepNumber: 8,
    title: 'Verify Clinical Primacy Escalation',
    category: 'Patient Safety Guardrail',
    icon: <ShieldAlert className="h-4 w-4 text-telemetry-amber" />,
    description: 'Notice that reporting symptoms immediately escalates the assessment classification to "needs_attention" or "medical_review_recommended" even if resting vitals are nominal.',
    whyItMatters: 'Enforces the core NASA medical rule: telemetry cannot dismiss reported symptoms. Subjective crew reports hold clinical primacy.',
    actionLabel: 'Verify Assessment Escalation',
    tab: 'intelligence',
    triggerAction: 'assessment_tab',
  },
  {
    stepNumber: 9,
    title: 'Inspect Non-Anatomical Environment & Radiation',
    category: 'Habitat & Systemic Channels',
    icon: <Radio className="h-4 w-4 text-telemetry-cyan" />,
    description: 'Open the dedicated Non-Anatomical telemetry drawer to review deep-space ionizing radiation (ALARA), ECLSS cabin atmosphere, and PVT cognitive readiness.',
    whyItMatters: 'Scientifically separates systemic, environmental, and behavioral telemetry from anatomical organ geometry.',
    actionLabel: 'Open Non-Anatomical Channels',
    tab: 'anatomy',
    triggerAction: 'open_non_anatomical',
  },
  {
    stepNumber: 10,
    title: 'Switch to 2D Schematic Fallback',
    category: 'Operational Resilience',
    icon: <Box className="h-4 w-4 text-space-200" />,
    description: 'Toggle between the 3D WebGL holographic canvas and the 2D SVG schematic mannequin.',
    whyItMatters: 'Demonstrates zero-dependency operational fallback for low-power spacecraft terminals or WebGL-disabled displays.',
    actionLabel: 'Switch to 2D Fallback',
    tab: 'anatomy',
    triggerAction: 'switch_to_2d',
  },
];

export const JudgeDemoController: React.FC<JudgeDemoControllerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectAstronaut,
  onSelectMetric,
  onTriggerDemoAction,
  selectedAstronautId,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const currentStep = DEMO_STEPS[currentStepIndex];

  if (!isOpen) return null;

  const handleExecuteStep = (step: DemoStep) => {
    onNavigateTab(step.tab);
    if (step.astronautId && step.astronautId !== selectedAstronautId) {
      onSelectAstronaut(step.astronautId);
    }
    if (step.metric) {
      onSelectMetric(step.metric);
    }
    if (step.triggerAction && onTriggerDemoAction) {
      onTriggerDemoAction(step.triggerAction);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      handleExecuteStep(DEMO_STEPS[nextIndex]);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      handleExecuteStep(DEMO_STEPS[prevIndex]);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] z-50 animate-fade-in shadow-2xl">
      <div className="rounded-xl border border-telemetry-cyan/50 bg-space-900/95 backdrop-blur-md shadow-hud-card overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-space-850 via-space-800 to-space-850 border-b border-space-700">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-telemetry-cyan/20 border border-telemetry-cyan/40 text-telemetry-cyan">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-space-100">
                  Judge Demonstration Flow
                </span>
                <span className="rounded bg-telemetry-cyan/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-telemetry-cyan border border-telemetry-cyan/40">
                  STEP {currentStep.stepNumber} / {DEMO_STEPS.length}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Judge Demonstration Flow"
            className="rounded p-1 text-space-400 hover:bg-space-750 hover:text-space-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block rounded bg-space-800 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase text-space-400 border border-space-700 mb-1">
                {currentStep.category}
              </span>
              <h4 className="font-mono text-sm font-bold text-space-100 flex items-center gap-2">
                {currentStep.icon}
                {currentStep.title}
              </h4>
            </div>
          </div>

          <p className="font-mono text-xs text-space-200 leading-relaxed bg-space-950/70 p-2.5 rounded-lg border border-space-800">
            {currentStep.description}
          </p>

          <div className="rounded-lg bg-telemetry-cyan/10 border border-telemetry-cyan/20 p-2.5 text-[11px] font-mono text-space-300">
            <span className="text-telemetry-cyan font-semibold block mb-0.5">
              🔬 Scientific Value / Verification Rule:
            </span>
            {currentStep.whyItMatters}
          </div>

          {/* Controls & Stepper */}
          <div className="flex items-center justify-between pt-2 border-t border-space-800">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-space-800 hover:bg-space-750 disabled:opacity-40 border border-space-700 text-xs font-mono text-space-200 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={handleNext}
                disabled={currentStepIndex === DEMO_STEPS.length - 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-space-800 hover:bg-space-750 disabled:opacity-40 border border-space-700 text-xs font-mono text-space-200 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={() => handleExecuteStep(currentStep)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-telemetry-cyan hover:bg-telemetry-cyan/90 text-space-950 font-mono text-xs font-bold transition-all shadow-hud-glow"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>{currentStep.actionLabel}</span>
            </button>
          </div>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-1 py-1.5 bg-space-950 border-t border-space-800">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.stepNumber}
              onClick={() => {
                setCurrentStepIndex(idx);
                handleExecuteStep(s);
              }}
              title={`Step ${s.stepNumber}: ${s.title}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'w-6 bg-telemetry-cyan'
                  : 'w-2 bg-space-700 hover:bg-space-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
