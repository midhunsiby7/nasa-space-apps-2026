import React, { useState } from 'react';
import {
  Brain,
  Activity,
  Layers,
  TrendingUp,
  RefreshCw,
  Compass,
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

interface HealthIntelligenceSectionProps {
  astronaut: Astronaut | null;
  baselines: BaselineResponse[];
  trends: TrendObservation[];
  freshness: TelemetryFreshnessResponse | null;
  assessment: AssessmentResponse | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onRunAssessment?: () => void;
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

          <div className="flex items-center gap-2">
            {onRunAssessment && (
              <button
                onClick={onRunAssessment}
                disabled={isEvaluating}
                className="px-3 py-1.5 rounded bg-telemetry-cyan/20 hover:bg-telemetry-cyan/30 border border-telemetry-cyan/50 text-telemetry-cyan text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                {isEvaluating ? 'Evaluating...' : 'Re-Evaluate Assessment'}
              </button>
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
                  onClick={onRunAssessment}
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
    </div>
  );
};
