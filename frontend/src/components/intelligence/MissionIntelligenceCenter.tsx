import React, { useState } from 'react';
import {
  Brain,
  Activity,
  Layers,
  TrendingUp,
  RefreshCw,
  Bell,
  Clock,
  FileText,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation, TelemetryFreshnessResponse } from '../../types/trend';
import { AssessmentResponse } from '../../types/assessment';
import { AlertResponse } from '../../types/alert';
import { MeasurementType } from '../../types/measurement';
import { ActiveTab } from '../layout/Sidebar';
import { TrendTrajectoryCard } from '../trend/TrendTrajectoryCard';
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

interface MissionIntelligenceCenterProps {
  astronaut: Astronaut | null;
  baselines: BaselineResponse[];
  trends: TrendObservation[];
  freshness: TelemetryFreshnessResponse | null;
  assessment: AssessmentResponse | null;
  alerts: AlertResponse[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onRunAssessment?: (symptoms?: string[]) => void;
  isEvaluating?: boolean;
  onNavigateToTab: (tab: ActiveTab) => void;
  onSelectMetric: (metric: MeasurementType) => void;
  onOpenReportModal: () => void;
}

export const MissionIntelligenceCenter: React.FC<MissionIntelligenceCenterProps> = ({
  astronaut,
  baselines,
  trends,
  freshness,
  assessment,
  alerts,
  isLoading,
  error,
  onRefresh,
  onRunAssessment,
  isEvaluating = false,
  onNavigateToTab,
  onSelectMetric,
  onOpenReportModal,
}) => {
  const [selectedContext, setSelectedContext] = useState<string>('resting_cabin');
  const [selectedLookback, setSelectedLookback] = useState<number>(72);
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
    return <LoadingSpinner label="Evaluating Intra-Individual Baselines & Health Intelligence..." size="lg" />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Mission Intelligence Error"
        message={error}
        onRetry={onRefresh}
      />
    );
  }

  const activeAlerts = alerts.filter((a) => a.status === 'active');

  const staleCount = freshness ? freshness.stale_count : 0;
  const totalFreshnessMetrics = freshness ? freshness.total_metrics : 0;

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
      {/* 1. Operations Header & Intelligence Command Bar */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-base font-bold uppercase tracking-wider text-space-100">
                  Mission Intelligence Center
                </h2>
                <span className="rounded bg-space-800 px-2 py-0.5 font-mono text-[10px] text-space-400 border border-space-700">
                  NASA-STD-3001
                </span>
              </div>
              <p className="font-mono text-xs text-space-400 mt-0.5">
                Intra-individual trajectories, {baselines.length} registered baseline models, and explainable decision support.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Context Selector */}
            <select
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value)}
              aria-label="Operational Context Partition"
              className="bg-space-800 border border-space-700 rounded px-2.5 py-1.5 text-xs font-mono text-space-200 focus:outline-none focus:border-telemetry-cyan"
            >
              <option value="resting_cabin">Context: Resting Cabin</option>
              <option value="exercise_active">Context: Exercise Active</option>
            </select>

            {/* Lookback Selector */}
            <select
              value={selectedLookback}
              onChange={(e) => setSelectedLookback(Number(e.target.value))}
              aria-label="Evaluation Lookback Window"
              className="bg-space-800 border border-space-700 rounded px-2.5 py-1.5 text-xs font-mono text-space-200 focus:outline-none focus:border-telemetry-cyan"
            >
              <option value={24}>Window: 24 Hours</option>
              <option value={72}>Window: 72 Hours</option>
              <option value={168}>Window: 7 Days</option>
              <option value={720}>Window: 30 Days</option>
            </select>

            {/* Evidence Report Button */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 hover:text-white transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-sky-400" />
              <span>Evidence Report</span>
            </button>

            {/* Re-evaluate Assessment Button */}
            <button
              onClick={() => setIsSymptomModalOpen(true)}
              disabled={isEvaluating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-xs font-mono font-bold text-purple-300 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>{isEvaluating ? 'Synthesizing...' : 'Re-Evaluate Assessment'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Grid: Latest Assessment Status & Freshness Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Latest Explainable Assessment */}
        <div className="lg:col-span-2 rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-space-400 block">
                  Deterministic Decision Support Assessment
                </span>
                <h3 className="font-mono text-sm font-bold text-space-100 mt-0.5">
                  {astronaut ? `${astronaut.name} (${astronaut.mission_name})` : 'Crew Member Assessment'}
                </h3>
              </div>
              {renderClassificationBadge(assessment?.overall_classification)}
            </div>

            <p className="font-mono text-xs text-space-200 leading-relaxed bg-space-900/60 p-3.5 rounded border border-space-800">
              {assessment?.summary_explanation ||
                'No health assessment record currently generated for this astronaut. Run assessment evaluation to synthesize intra-individual findings.'}
            </p>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="rounded bg-space-900 p-2.5 border border-space-800">
                <span className="text-[10px] font-mono text-space-400 block uppercase">Findings Detected</span>
                <span className="text-base font-mono font-bold text-space-100">
                  {assessment?.findings.length ?? 0}
                </span>
              </div>
              <div className="rounded bg-space-900 p-2.5 border border-space-800">
                <span className="text-[10px] font-mono text-space-400 block uppercase">Guidance Actions</span>
                <span className="text-base font-mono font-bold text-telemetry-cyan">
                  {assessment?.guidance.length ?? 0}
                </span>
              </div>
              <div className="rounded bg-space-900 p-2.5 border border-space-800">
                <span className="text-[10px] font-mono text-space-400 block uppercase">Evaluated At</span>
                <span className="text-xs font-mono font-semibold text-space-300 block truncate">
                  {assessment?.assessment_date ? new Date(assessment.assessment_date).toLocaleTimeString() : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-space-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-space-400 italic">
              Emergency evaluations disabled by default in software configuration; requires authorized flight protocol.
            </span>
            <button
              onClick={() => onNavigateToTab('assessments')}
              className="flex items-center gap-1 font-mono text-xs text-telemetry-cyan hover:underline font-semibold"
            >
              <span>Open Assessment Workspace</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Col: Telemetry Currency & Freshness Monitor */}
        <div className="rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-telemetry-cyan" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-space-100">
                  Telemetry Freshness
                </h4>
              </div>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                staleCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}>
                {staleCount > 0 ? `${staleCount} STALE` : 'ALL NOMINAL'}
              </span>
            </div>

            <p className="text-[11px] font-mono text-space-400 leading-normal mb-3">
              Monitors telemetry currency against nominal spacecraft transmission cycles across {totalFreshnessMetrics} channels.
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {freshness?.items.map((item) => (
                <div
                  key={item.measurement_type}
                  className="flex items-center justify-between p-2 rounded bg-space-900 border border-space-800 text-xs font-mono"
                >
                  <span className="text-space-200 capitalize truncate">
                    {item.measurement_type.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-space-400">
                      {item.hours_since_last !== null && item.hours_since_last !== undefined
                        ? `${item.hours_since_last.toFixed(1)}h ago`
                        : 'No rec'}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.status === 'fresh'
                          ? 'bg-emerald-400 animate-pulse'
                          : item.status === 'stale'
                          ? 'bg-amber-400'
                          : 'bg-space-600'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-space-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-space-400">
              Evaluated: {freshness ? new Date(freshness.evaluated_at).toLocaleTimeString() : '—'}
            </span>
            <button
              onClick={() => onNavigateToTab('trends')}
              className="flex items-center gap-1 font-mono text-xs text-telemetry-cyan hover:underline font-semibold"
            >
              <span>Trend Observatory</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Intra-Individual Health Trends Matrix */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                Intra-Individual Trend Trajectories
              </h3>
            </div>
            <p className="font-mono text-xs text-space-400 mt-0.5">
              Non-parametric Sen&apos;s slope estimator (rate of change per 24 hours) compared against personal baseline medians.
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('trends')}
            className="flex items-center gap-1 text-xs font-mono text-telemetry-cyan hover:underline self-start sm:self-auto font-semibold"
          >
            <span>Full Observatory ({trends.length} channels)</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {trends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trends.slice(0, 6).map((trend) => (
              <div
                key={`${trend.measurement_type}-${trend.context}`}
                onClick={() => onSelectMetric(trend.measurement_type as MeasurementType)}
                className="cursor-pointer"
              >
                <TrendTrajectoryCard trend={trend} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded bg-space-900 p-6 text-center text-xs font-mono text-space-400 border border-space-800">
            No active trend observations evaluated for current parameters.
          </div>
        )}
      </div>

      {/* 4. Active Operational Alerts Strip */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-rose-400" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
              Active Operational Alerts ({activeAlerts.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigateToTab('alerts')}
            className="flex items-center gap-1 font-mono text-xs text-telemetry-cyan hover:underline font-semibold"
          >
            <span>Alert Command Desk</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {activeAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAlerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-3 rounded border text-xs font-mono flex items-start justify-between gap-3 ${
                  alt.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    : alt.severity === 'high'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                    : 'bg-space-900 border-space-700 text-space-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-space-100">{alt.title}</span>
                    <span className="uppercase text-[9px] px-1.5 py-0.5 rounded font-bold border border-current">
                      {alt.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-space-300 mt-1 line-clamp-2">{alt.explanation}</p>
                </div>
                <button
                  onClick={() => onNavigateToTab('alerts')}
                  className="px-2.5 py-1 rounded bg-space-800 hover:bg-space-700 border border-space-600 text-[10px] text-space-100 font-semibold shrink-0"
                >
                  Manage
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded bg-space-900 text-center text-xs font-mono text-space-400 border border-space-800 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>No active operational alerts for this crew member. All telemetry channels nominal.</span>
          </div>
        )}
      </div>

      {/* 5. Deep Space Operations Cross-View Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateToTab('telemetry')}
          className="p-3 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700/80 text-left transition-colors flex items-center justify-between"
        >
          <div>
            <div className="font-mono text-xs font-bold text-space-100">Telemetry Stream</div>
            <div className="font-mono text-[10px] text-space-400">Time-series signals</div>
          </div>
          <Activity className="h-4 w-4 text-telemetry-cyan" />
        </button>

        <button
          onClick={() => onNavigateToTab('anatomy')}
          className="p-3 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700/80 text-left transition-colors flex items-center justify-between"
        >
          <div>
            <div className="font-mono text-xs font-bold text-space-100">3D Anatomy Map</div>
            <div className="font-mono text-[10px] text-space-400">Spatial telemetry link</div>
          </div>
          <Layers className="h-4 w-4 text-telemetry-cyan" />
        </button>

        <button
          onClick={() => onNavigateToTab('baselines')}
          className="p-3 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700/80 text-left transition-colors flex items-center justify-between"
        >
          <div>
            <div className="font-mono text-xs font-bold text-space-100">Personal Baselines</div>
            <div className="font-mono text-[10px] text-space-400">Non-parametric envelopes</div>
          </div>
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        </button>

        <button
          onClick={() => onNavigateToTab('timeline')}
          className="p-3 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700/80 text-left transition-colors flex items-center justify-between"
        >
          <div>
            <div className="font-mono text-xs font-bold text-space-100">Mission Timeline</div>
            <div className="font-mono text-[10px] text-space-400">Reconstructed stream</div>
          </div>
          <Calendar className="h-4 w-4 text-purple-400" />
        </button>
      </div>

      {/* 6. Medical & Regulatory Disclaimer */}
      <div className="rounded-lg bg-space-900 border border-space-800 p-3.5 text-[11px] font-mono text-space-400 flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-telemetry-cyan shrink-0 mt-0.5" />
        <div>
          <strong className="text-space-200 uppercase">Operational Flight Notice & Decision Support Disclaimer:</strong>{' '}
          COSMOLOOKUP synthesizes intra-individual statistical envelopes and trajectory indicators strictly for biomedical mission flight controllers and flight surgeons. Algorithms do not constitute automated medical diagnosis or clinical prescription.
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
                className="px-4 py-1.5 rounded bg-purple-500 hover:bg-purple-400 text-xs font-mono font-bold text-white"
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
export default MissionIntelligenceCenter;
