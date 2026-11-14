import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  AlertOctagon,
  Info,
  Calendar,
} from 'lucide-react';
import { AssessmentResponse, AssessmentClassification } from '../../types/assessment';

interface AssessmentOverviewCardProps {
  assessment: AssessmentResponse;
}

export const AssessmentOverviewCard: React.FC<AssessmentOverviewCardProps> = ({ assessment }) => {
  const renderAttentionTierBanner = (classification: AssessmentClassification) => {
    switch (classification) {
      case 'routine':
        return (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-telemetry-emerald/15 border border-telemetry-emerald/40 text-telemetry-emerald">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <div>
              <span className="font-mono text-sm font-bold uppercase tracking-wider block">
                Routine Telemetry Monitoring
              </span>
              <span className="text-[11px] font-mono text-space-300">
                All observed parameters align with intra-individual personal baseline envelopes.
              </span>
            </div>
          </div>
        );
      case 'needs_attention':
        return (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-telemetry-amber/15 border border-telemetry-amber/40 text-telemetry-amber">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <span className="font-mono text-sm font-bold uppercase tracking-wider block">
                Needs Attention — Isolated Parameter Shift or Data Staleness
              </span>
              <span className="text-[11px] font-mono text-space-300">
                Single metric deviation or telemetry interval gap detected. Operator review recommended.
              </span>
            </div>
          </div>
        );
      case 'medical_review_recommended':
        return (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-telemetry-rose/20 border border-telemetry-rose/50 text-telemetry-rose">
            <AlertOctagon className="h-5 w-5 shrink-0" />
            <div>
              <span className="font-mono text-sm font-bold uppercase tracking-wider block">
                Medical Review Recommended — Multi-Parameter Shift
              </span>
              <span className="text-[11px] font-mono text-space-300">
                Concordant multi-metric deviation detected across lookback window. Direct flight surgeon consultation advised.
              </span>
            </div>
          </div>
        );
      case 'emergency':
      default:
        return (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-purple-950/40 border border-purple-500/50 text-purple-300">
            <AlertOctagon className="h-5 w-5 shrink-0 text-purple-400" />
            <div>
              <span className="font-mono text-sm font-bold uppercase tracking-wider block">
                Decision Support Alert (Demonstration Threshold Scaffolding)
              </span>
              <span className="text-[11px] font-mono text-space-300">
                Illustrative threshold triggered. Note: unvalidated flight simulation test value, not a clinical emergency determination.
              </span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Classification Banner */}
      {renderAttentionTierBanner(assessment.overall_classification)}

      {/* Structured Natural-Language Summary */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card">
        <div className="flex items-center justify-between text-space-400 mb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-telemetry-cyan" />
            <span className="font-mono text-xs uppercase tracking-wider text-space-200 font-bold">
              Explainable Assessment Synthesis
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-space-400">
            <Calendar className="h-3 w-3" />
            <span>{new Date(assessment.assessment_date).toUTCString()}</span>
          </div>
        </div>

        <p className="text-xs font-mono text-space-200 leading-relaxed bg-space-900/60 p-3 rounded border border-space-800">
          {assessment.summary_explanation}
        </p>

        {/* Clinical Primacy & Scientific Safety Guardrail */}
        <div className="mt-3 p-3 rounded bg-space-900/90 border border-telemetry-cyan/30 text-space-300 space-y-1">
          <div className="flex items-center gap-1.5 text-telemetry-cyan font-mono text-[11px] font-bold uppercase tracking-wider">
            <Info className="h-3.5 w-3.5" />
            <span>Clinical Primacy & Non-Diagnostic Advisory</span>
          </div>
          <p className="text-[10px] font-mono text-space-300 leading-relaxed">
            <strong className="text-telemetry-cyan">Clinical Primacy:</strong> Telemetry and statistical trend indicators are supplemental decision-support tools. Normal telemetry values <span className="text-space-100 font-semibold underline">NEVER</span> dismiss, override, or supersede reported physical symptoms or direct clinical evaluation by flight surgeons.
          </p>
          <p className="text-[10px] font-mono text-space-400">
            This platform does not issue automated medical diagnoses, clinical prescriptions, or binding flight status determinations.
          </p>
        </div>
      </div>
    </div>
  );
};
