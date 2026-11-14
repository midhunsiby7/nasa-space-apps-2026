import React, { useState } from 'react';
import {
  Brain,
  Activity,
  Layers,
  TrendingUp,
  RefreshCw,
  Compass,
  ClipboardList,
  CheckSquare,
  Square,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation, TelemetryFreshnessResponse } from '../../types/trend';
import { AssessmentResponse } from '../../types/assessment';
import { BaselineCard } from '../baseline/BaselineCard';
import { TrendTrajectoryCard } from '../trend/TrendTrajectoryCard';
import { AssessmentOverviewCard } from '../assessment/AssessmentOverviewCard';
import { AssessmentFindingsTable } from '../assessment/AssessmentFindingsTable';
import { GuidanceRecommendationList } from '../assessment/GuidanceRecommendationList';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

const CANDIDATE_SYMPTOMS = [
  { id: 'headache', label: 'Cephalad Head Fullness / Headache', category: 'Microgravity Fluid Shift', acute: false },
  { id: 'dizziness', label: 'Space Motion Sickness / Vestibular Dizziness', category: 'Neurovestibular', acute: false },
  { id: 'fatigue', label: 'Persistent Cognitive / Physical Fatigue', category: 'Operational Fatigue', acute: false },
  { id: 'thermal_discomfort', label: 'Elevated Core Heat / Flushing', category: 'Thermoregulation', acute: false },
  { id: 'muscle_soreness', label: 'Musculoskeletal Stiffness / Discomfort', category: 'Musculoskeletal', acute: false },
  { id: 'acute_chest_pain', label: 'Acute Precordial Chest Tightness', category: 'Acute Protocol Escalation', acute: true },
  { id: 'sudden_visual_loss', label: 'Sudden Visual Acuity Blur / Distortion', category: 'Acute Protocol Escalation', acute: true },
];

interface HealthIntelligenceSectionProps {
  astronaut: Astronaut | null;
  baselines: BaselineResponse[];
  trends: TrendObservation[];
  freshness: TelemetryFreshnessResponse | null;
  assessment: AssessmentResponse | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onRunAssessment?: (symptoms?: string[]) => void;
  isEvaluating?: boolean;
}

export const HealthIntelligenceSection: React.FC<HealthIntelligenceSectionProps> = ({
  astronaut,
  baselines,
  trends,
  freshness,
  assessment,
  isLoading,
  error,
  onRefresh,
  onRunAssessment,
  isEvaluating = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'assessment' | 'trends' | 'baselines'>('assessment');
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState<boolean>(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSymptomSubmit = () => {
    if (onRunAssessment) {
      onRunAssessment(selectedSymptoms);
    }
    setIsSymptomModalOpen(false);
  };

  if (isLoading) {
    return <LoadingSpinner label="Evaluating Intra-Individual Baselines & Health Trends..." size="lg" />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Health Intelligence Error"
        message={error}
        onRetry={onRefresh}
      />
    );
  }

  const establishedCount = baselines.filter((b) => b.maturity === 'established').length;
  const provisionalCount = baselines.filter((b) => b.maturity === 'provisional').length;
  const insufficientCount = baselines.filter((b) => b.maturity === 'insufficient').length;

  return (
    <div className="space-y-6">
      {/* Top Controls & Navigation Bar */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Brain className="h-5 w-5 text-telemetry-cyan" />
            <div>
              <h2 className="font-mono text-base font-bold uppercase tracking-wider text-space-100">
                Health Intelligence & Personal Baselines
              </h2>
              <p className="text-[11px] font-mono text-space-400">
                Astronaut: <span className="text-space-200">{astronaut?.name || 'Unknown'}</span> ({astronaut?.id}) • Mission Day {astronaut?.mission_day || '—'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onRunAssessment && (
              <>
                <button
                  onClick={() => setIsSymptomModalOpen(true)}
                  disabled={isEvaluating}
                  className="px-3 py-1.5 rounded bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/50 text-purple-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Report crew subjective symptoms to evaluate clinical primacy"
                >
                  <ClipboardList className="h-3.5 w-3.5 text-purple-400" />
                  <span>Report Symptoms</span>
                </button>

                <button
                  onClick={() => onRunAssessment()}
                  disabled={isEvaluating}
                  className="px-3 py-1.5 rounded bg-telemetry-cyan/20 hover:bg-telemetry-cyan/30 border border-telemetry-cyan/50 text-telemetry-cyan text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                  {isEvaluating ? 'Evaluating...' : 'Re-Evaluate Assessment'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex border-b border-space-800 mt-4 gap-2">
          <button
            onClick={() => setActiveSubTab('assessment')}
            className={`pb-2 px-3 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border-b-2 ${
              activeSubTab === 'assessment'
                ? 'border-telemetry-cyan text-telemetry-cyan'
                : 'border-transparent text-space-400 hover:text-space-200'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            Explainable Assessment
          </button>
          <button
            onClick={() => setActiveSubTab('trends')}
            className={`pb-2 px-3 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border-b-2 ${
              activeSubTab === 'trends'
                ? 'border-telemetry-cyan text-telemetry-cyan'
                : 'border-transparent text-space-400 hover:text-space-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Trend Matrix ({trends.length})
          </button>
          <button
            onClick={() => setActiveSubTab('baselines')}
            className={`pb-2 px-3 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border-b-2 ${
              activeSubTab === 'baselines'
                ? 'border-telemetry-cyan text-telemetry-cyan'
                : 'border-transparent text-space-400 hover:text-space-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Personal Baselines ({baselines.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Explainable Health Assessment */}
      {activeSubTab === 'assessment' && (
        <div className="space-y-6">
          {assessment ? (
            <>
              <AssessmentOverviewCard assessment={assessment} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AssessmentFindingsTable
                  findings={assessment.findings}
                  baselineVersionsUsed={assessment.baseline_versions_used}
                />
                <GuidanceRecommendationList guidance={assessment.guidance} />
              </div>
            </>
          ) : (
            <div className="rounded-lg bg-space-850 p-8 text-center border border-space-800">
              <Activity className="h-8 w-8 text-space-400 mx-auto mb-2" />
              <p className="font-mono text-sm text-space-300">
                No active health assessment found for this astronaut.
              </p>
              {onRunAssessment && (
                <button
                  onClick={() => onRunAssessment()}
                  className="mt-3 px-3 py-1.5 rounded bg-telemetry-cyan/20 border border-telemetry-cyan/50 text-telemetry-cyan font-mono text-xs"
                >
                  Generate Initial Assessment
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Trend Trajectory Matrix */}
      {activeSubTab === 'trends' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-space-400 font-mono text-xs">
            <span>
              Telemetry Currency:{' '}
              <strong className="text-telemetry-emerald">
                {freshness ? `${freshness.total_metrics - freshness.stale_count}/${freshness.total_metrics} Fresh` : 'Checking...'}
              </strong>
            </span>
            {freshness && freshness.stale_count > 0 && (
              <span className="text-telemetry-amber font-bold">
                ⚠️ {freshness.stale_count} Telemetry Stream(s) Stale
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.map((t) => (
              <TrendTrajectoryCard key={`${t.measurement_type}-${t.context}`} trend={t} />
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Personal Baselines Envelopes */}
      {activeSubTab === 'baselines' && (
        <div className="space-y-4">
          {/* Baseline Maturity Summary Bar */}
          <div className="rounded-lg bg-space-900/60 border border-space-800 p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <span className="text-space-300">
              Maturity Breakdown:
            </span>
            <div className="flex items-center gap-3">
              <span className="text-telemetry-emerald font-bold">
                ● {establishedCount} Established
              </span>
              <span className="text-telemetry-cyan font-bold">
                ● {provisionalCount} Provisional
              </span>
              <span className="text-telemetry-amber font-bold">
                ● {insufficientCount} Insufficient
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {baselines.map((b) => (
              <BaselineCard key={b.id} baseline={b} />
            ))}
          </div>
        </div>
      )}

      {/* Crew Subjective Symptom Reporting Modal (Workflow 11 & Clinical Primacy) */}
      {isSymptomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg rounded-lg border border-space-700 bg-space-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-space-800 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-purple-400" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                  Crew Subjective Symptom Report
                </h3>
              </div>
              <button
                onClick={() => setIsSymptomModalOpen(false)}
                className="rounded p-1 text-space-400 hover:bg-space-800 hover:text-space-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scientific Guardrail */}
            <div className="my-3 rounded bg-space-950/90 border border-telemetry-cyan/30 p-2.5 font-mono text-[11px] text-space-300">
              <div className="flex items-center gap-1.5 text-telemetry-cyan font-bold mb-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Clinical Primacy Rule</span>
              </div>
              <p className="leading-relaxed">
                Direct crew subjective symptom reports always take clinical precedence over statistical vital envelopes.
                Reporting symptoms will evaluate clinical attention tiers even if non-invasive vital streams appear nominal.
              </p>
            </div>

            {/* Symptom Checkboxes */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {CANDIDATE_SYMPTOMS.map((sym) => {
                const isChecked = selectedSymptoms.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => toggleSymptom(sym.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded border text-left font-mono text-xs transition-colors ${
                      isChecked
                        ? sym.acute
                          ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                          : 'bg-purple-950/40 border-purple-500/60 text-purple-200'
                        : 'bg-space-850 border-space-800 text-space-300 hover:bg-space-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isChecked ? (
                        <CheckSquare className={`h-4 w-4 ${sym.acute ? 'text-rose-400' : 'text-purple-400'}`} />
                      ) : (
                        <Square className="h-4 w-4 text-space-500" />
                      )}
                      <span>{sym.label}</span>
                    </div>
                    <span className="text-[10px] text-space-400 uppercase tracking-wider">
                      {sym.category}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="mt-4 pt-3 border-t border-space-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedSymptoms([])}
                className="text-xs font-mono text-space-400 hover:text-space-200"
              >
                Clear Selections
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSymptomModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 text-xs font-mono text-space-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSymptomSubmit}
                  disabled={isEvaluating}
                  className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-xs font-mono font-bold text-white transition-colors"
                >
                  {isEvaluating ? 'Evaluating...' : `Evaluate (${selectedSymptoms.length} Selected)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
