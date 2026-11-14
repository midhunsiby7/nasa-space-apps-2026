import React, { useState, useEffect } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Activity,
  Sparkles,
  FileText,
  Loader2,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { AssessmentResponse } from '../../types/assessment';
import { MeasurementType } from '../../types/measurement';
import { apiClient } from '../../services/apiClient';
import { AssessmentFindingsTable } from './AssessmentFindingsTable';
import { GuidanceRecommendationList } from './GuidanceRecommendationList';

const CANDIDATE_SYMPTOMS = [
  { id: 'headache', label: 'Cephalad Head Fullness / Headache', category: 'Microgravity Fluid Shift', acute: false },
  { id: 'dizziness', label: 'Space Motion Sickness / Vestibular Dizziness', category: 'Neurovestibular', acute: false },
  { id: 'fatigue', label: 'Persistent Cognitive / Physical Fatigue', category: 'Operational Fatigue', acute: false },
  { id: 'thermal_discomfort', label: 'Elevated Core Heat / Flushing', category: 'Thermoregulation', acute: false },
  { id: 'muscle_soreness', label: 'Musculoskeletal Stiffness / Discomfort', category: 'Musculoskeletal', acute: false },
  { id: 'acute_chest_pain', label: 'Acute Precordial Chest Tightness', category: 'Acute Protocol Escalation', acute: true },
  { id: 'sudden_visual_loss', label: 'Sudden Visual Acuity Blur / Distortion', category: 'Acute Protocol Escalation', acute: true },
];

interface AssessmentWorkspaceProps {
  astronaut: Astronaut | null;
  latestAssessment: AssessmentResponse | null;
  onRunAssessment: (symptoms?: string[]) => Promise<void>;
  isEvaluating: boolean;
  onNavigateToTelemetry: (metric: MeasurementType) => void;
  onNavigateToBaselines: (metric: MeasurementType) => void;
  onOpenReportModal: () => void;
}

export const AssessmentWorkspace: React.FC<AssessmentWorkspaceProps> = ({
  astronaut,
  latestAssessment,
  onRunAssessment,
  isEvaluating,
  onNavigateToTelemetry,
  onNavigateToBaselines,
  onOpenReportModal,
}) => {
  const [history, setHistory] = useState<AssessmentResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState<boolean>(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Load history when astronaut changes
  useEffect(() => {
    if (!astronaut) return;
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await apiClient.getAssessments(astronaut.id, 20);
        setHistory(res.data);
      } catch (err) {
        console.warn('Failed to load assessment history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, [astronaut, latestAssessment]);

  // Current assessment to display (selected from history or latest)
  const currentAssessment =
    (selectedAssessmentId && history.find((a) => a.id === selectedAssessmentId)) ||
    latestAssessment ||
    (history.length > 0 ? history[0] : null);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSymptomSubmit = async () => {
    setIsSymptomModalOpen(false);
    await onRunAssessment(selectedSymptoms);
  };

  const renderClassificationBadge = (classification?: string) => {
    switch (classification) {
      case 'routine':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Routine Flight Monitoring
          </span>
        );
      case 'needs_attention':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs font-bold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="h-3.5 w-3.5" />
            Needs Attention (Protocol Triage)
          </span>
        );
      case 'medical_review_recommended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs font-bold uppercase tracking-wide bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
            Medical Review Recommended
          </span>
        );
      case 'emergency':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs font-bold uppercase tracking-wide bg-purple-500/25 text-purple-200 border border-purple-500/50 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
            Emergency Protocol Triggered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs font-medium uppercase tracking-wide bg-space-800 text-space-400 border border-space-700">
            <Clock className="h-3.5 w-3.5" />
            Evaluation Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-base font-bold uppercase tracking-wider text-space-100">
                  Explainable Assessment Workspace
                </h2>
                <span className="rounded bg-space-800 px-2 py-0.5 font-mono text-[10px] text-space-400 border border-space-700">
                  Deterministic Decision Support
                </span>
              </div>
              <p className="font-mono text-xs text-space-400 mt-0.5">
                Multi-metric synthesis matching active observations against personal baseline envelopes with deterministic operational guidance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 hover:text-white transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-sky-400" />
              <span>Evidence Report</span>
            </button>

            <button
              onClick={() => setIsSymptomModalOpen(true)}
              disabled={isEvaluating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-xs font-mono font-bold text-purple-300 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>{isEvaluating ? 'Evaluating...' : 'Report Crew Symptoms / Re-Evaluate'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Assessment Dossier & Historical Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assessment Dossier (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {currentAssessment ? (
            <>
              {/* Classification & Summary Banner */}
              <div className="rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-space-400 block">
                      Assessment Classification
                    </span>
                    <h3 className="font-mono text-base font-bold text-space-100 mt-0.5">
                      {astronaut?.name} • ID: {currentAssessment.id.slice(0, 16)}
                    </h3>
                  </div>
                  {renderClassificationBadge(currentAssessment.overall_classification)}
                </div>

                <div className="rounded bg-space-900 p-4 border border-space-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="font-mono text-xs font-bold text-space-200">
                      Transparent Synthesis Summary
                    </span>
                  </div>
                  <p className="font-mono text-xs text-space-300 leading-relaxed">
                    {currentAssessment.summary_explanation}
                  </p>
                </div>

                {/* Metadata Strip */}
                <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-1">
                  <div className="p-2 rounded bg-space-900 border border-space-800">
                    <span className="text-[10px] text-space-500 block uppercase">Evaluated At</span>
                    <span className="font-bold text-space-200">
                      {new Date(currentAssessment.assessment_date).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-space-900 border border-space-800">
                    <span className="text-[10px] text-space-500 block uppercase">Data Quality</span>
                    <span className="font-bold text-emerald-400 capitalize">
                      {currentAssessment.data_quality_status}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-space-900 border border-space-800">
                    <span className="text-[10px] text-space-500 block uppercase">Provenance</span>
                    <span className="font-bold text-space-300">
                      {currentAssessment.is_synthetic ? 'Synthetic Provenance' : 'Flight Certified'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-space-400 italic pt-1">
                  Emergency evaluations disabled by default in software configuration; requires authorized flight protocol.
                </div>
              </div>

              {/* Metric Findings Table */}
              <div className="rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-telemetry-cyan" />
                    <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                      Physiological Metric Findings ({currentAssessment.findings.length})
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-space-400">
                    Gated on intra-individual baseline envelopes
                  </span>
                </div>

                <AssessmentFindingsTable
                  findings={currentAssessment.findings}
                  baselineVersionsUsed={currentAssessment.baseline_versions_used || {}}
                />

                {currentAssessment.findings.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-space-800">
                    {currentAssessment.findings.map((f) => (
                      <button
                        key={f.measurement_type}
                        onClick={() => {
                          onNavigateToTelemetry(f.measurement_type as MeasurementType);
                          onNavigateToBaselines(f.measurement_type as MeasurementType);
                        }}
                        className="px-2.5 py-1 rounded bg-space-800 hover:bg-space-750 text-[11px] font-mono text-telemetry-cyan border border-space-700 transition-colors"
                      >
                        Inspect {f.measurement_type.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actionable Guidance List */}
              <div className="rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                      Deterministic Operational Guidance ({currentAssessment.guidance.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-space-400 uppercase">
                    Non-Prescriptive Flight Support
                  </span>
                </div>

                <GuidanceRecommendationList guidance={currentAssessment.guidance} />
              </div>
            </>
          ) : (
            <div className="rounded-lg bg-space-850 border border-space-700/80 p-12 text-center font-mono text-xs text-space-400 space-y-3">
              <Brain className="h-8 w-8 text-space-600 mx-auto" />
              <p>No assessment records available for this astronaut.</p>
              <button
                onClick={() => setIsSymptomModalOpen(true)}
                className="px-4 py-2 rounded bg-purple-500 hover:bg-purple-400 text-space-950 font-bold font-mono text-xs transition-colors"
              >
                Synthesize First Assessment
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Historical Assessments List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono text-space-400">
              Assessment History ({history.length})
            </span>
            {isLoadingHistory && <Loader2 className="h-3.5 w-3.5 animate-spin text-telemetry-cyan" />}
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {history.map((asm) => {
              const isSelected = (currentAssessment?.id === asm.id);
              return (
                <div
                  key={asm.id}
                  onClick={() => setSelectedAssessmentId(asm.id)}
                  className={`p-3.5 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-space-800 border-purple-500/60 shadow-hud-sm'
                      : 'bg-space-850 hover:bg-space-800/80 border-space-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-space-200">
                      {new Date(asm.assessment_date).toLocaleDateString()} •{' '}
                      {new Date(asm.assessment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="uppercase text-[9px] px-1.5 py-0.2 rounded font-bold border border-current">
                      {asm.overall_classification.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-[11px] text-space-400 line-clamp-2 leading-relaxed">
                    {asm.summary_explanation}
                  </p>

                  <div className="mt-2 pt-2 border-t border-space-800 flex items-center justify-between text-[10px] text-space-500">
                    <span>{asm.findings.length} findings</span>
                    <span>{asm.guidance.length} guidance</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Crew Symptoms Modal */}
      {isSymptomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-sm animate-fade-in">
          <div className="rounded-lg bg-space-900 border border-space-700 p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-space-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <h4 className="font-mono text-sm font-bold uppercase text-space-100">
                  Evaluate Crew Reported Symptoms
                </h4>
              </div>
              <button
                onClick={() => setIsSymptomModalOpen(false)}
                className="text-space-400 hover:text-space-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs font-mono text-space-300">
              Select subjective symptoms reported by the astronaut to factor into the deterministic clinical guidance engine:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {CANDIDATE_SYMPTOMS.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom.id);
                return (
                  <div
                    key={symptom.id}
                    onClick={() => toggleSymptom(symptom.id)}
                    className={`flex items-start justify-between p-2.5 rounded border text-xs font-mono cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500/50 text-purple-200'
                        : 'bg-space-850 border-space-750 text-space-300 hover:bg-space-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{symptom.label}</div>
                      <div className="text-[10px] text-space-400 mt-0.5">{symptom.category}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="mt-1 rounded bg-space-800 border-space-600 text-purple-500"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-space-800">
              <button
                onClick={() => setIsSymptomModalOpen(false)}
                className="px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 text-xs font-mono text-space-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSymptomSubmit}
                className="px-4 py-1.5 rounded bg-purple-500 hover:bg-purple-400 text-xs font-mono font-bold text-space-950"
              >
                Synthesize Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AssessmentWorkspace;
