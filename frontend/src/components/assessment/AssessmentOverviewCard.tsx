import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  AlertOctagon,
  Info,
  Calendar,
  Compass,
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
                Needs Attention — Isolated Parameter Shift, Symptom, or Data Gap
              </span>
              <span className="text-[11px] font-mono text-space-300">
                Single metric deviation, reported crew symptom, or telemetry interval gap detected. Operator review recommended.
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
                Medical Review Recommended — Acute Escalation or Concordant Shift
              </span>
              <span className="text-[11px] font-mono text-space-300">
                Concordant multi-metric deviation or acute reported symptom detected. Direct flight surgeon consultation advised.
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

  // Derive Answers to the 5 Essential Operator Questions
  const nonNominalFindings = assessment.findings.filter((f) => f.status.toLowerCase() !== 'nominal');
  const baselineCount = Object.keys(assessment.baseline_versions_used || {}).length;
  const versionsString = Object.entries(assessment.baseline_versions_used || {})
    .map(([m, v]) => `${m.split('_')[0]}:${v.substring(0, 8)}`)
    .join(', ');

  const whatChanged =
    nonNominalFindings.length > 0
      ? nonNominalFindings
          .map((f) => `${f.measurement_type.replace(/_/g, ' ')} (${f.status}, Z=${f.robust_z?.toFixed(1) || '0.0'})`)
          .join('; ')
      : 'All observed physiological parameters remain within personal envelope quantiles.';

  const comparedBaseline =
    baselineCount > 0
      ? `Active personal baseline envelopes (${baselineCount} metrics calibrated: ${versionsString || 'preflight v1.0'})`
      : 'Intra-individual baseline calculation engine (provisional flight envelope)';

  const howReliable = assessment.findings.some((f) => f.status.toLowerCase() === 'stale')
    ? 'Telemetry stream contains stale or unverified packets. Confirm sensor coupling before clinical intervention.'
    : 'Verified high sensor data quality (nominal sampling frequency, valid calibration, low packet dropout).';

  const whyAlert =
    assessment.overall_classification === 'routine'
      ? 'No operational alerts emitted. Monitored vitals match established personal baselines.'
      : assessment.overall_classification === 'needs_attention'
      ? 'Isolated parameter deviation, subjective symptom report, or telemetry staleness crossing run-rule threshold.'
      : 'Acute symptom reported or concordant multi-parameter shift confirmed across lookback window.';

  const whatAction =
    assessment.guidance && assessment.guidance.length > 0
      ? assessment.guidance[0].action
      : 'Continue nominal flight telemetry monitoring in resting cabin context.';

  return (
    <div className="space-y-4">
      {/* 1. Classification Banner */}
      {renderAttentionTierBanner(assessment.overall_classification)}

      {/* 2. Operator Decision Support: 5 Essential Questions Matrix */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card">
        <div className="flex items-center justify-between text-space-400 mb-3 border-b border-space-800 pb-2">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-telemetry-cyan" />
            <span className="font-mono text-xs uppercase tracking-wider text-space-100 font-bold">
              Flight Surgeon 5-Point Synthesis Matrix
            </span>
          </div>
          <span className="text-[10px] font-mono text-telemetry-cyan bg-telemetry-cyan/10 px-2 py-0.5 rounded border border-telemetry-cyan/30">
            NASA Decision-Support Standard
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Q1: What changed? */}
          <div className="p-3 rounded-lg bg-space-900/80 border border-space-750 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-space-400 block mb-1">
                1. What Changed?
              </span>
              <p className="font-mono text-xs text-space-100 leading-snug">
                {whatChanged}
              </p>
            </div>
            <span className="text-[9px] font-mono text-space-500 mt-2">
              {nonNominalFindings.length} metric shift(s)
            </span>
          </div>

          {/* Q2: Compared with which baseline? */}
          <div className="p-3 rounded-lg bg-space-900/80 border border-space-750 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-space-400 block mb-1">
                2. Compared Baseline?
              </span>
              <p className="font-mono text-xs text-telemetry-cyan leading-snug truncate" title={comparedBaseline}>
                {comparedBaseline}
              </p>
            </div>
            <span className="text-[9px] font-mono text-space-500 mt-2">
              Non-parametric POE (P05-P95)
            </span>
          </div>

          {/* Q3: How reliable is the measurement? */}
          <div className="p-3 rounded-lg bg-space-900/80 border border-space-750 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-space-400 block mb-1">
                3. Data Reliability?
              </span>
              <p className="font-mono text-xs text-space-200 leading-snug">
                {howReliable}
              </p>
            </div>
            <span className="text-[9px] font-mono text-telemetry-emerald mt-2">
              Telemetry integrity verified
            </span>
          </div>

          {/* Q4: Why alert? */}
          <div className="p-3 rounded-lg bg-space-900/80 border border-space-750 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-space-400 block mb-1">
                4. Trigger Rationale?
              </span>
              <p className="font-mono text-xs text-space-100 leading-snug">
                {whyAlert}
              </p>
            </div>
            <span className="text-[9px] font-mono text-space-500 mt-2">
              Evaluated across 72h window
            </span>
          </div>

          {/* Q5: What action recommended? */}
          <div className="p-3 rounded-lg bg-space-900/80 border border-space-750 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-space-400 block mb-1">
                5. Recommended Action?
              </span>
              <p className="font-mono text-xs text-telemetry-emerald font-semibold leading-snug">
                {whatAction}
              </p>
            </div>
            <span className="text-[9px] font-mono text-space-500 mt-2">
              Non-prescriptive advisory
            </span>
          </div>
        </div>
      </div>

      {/* 3. Structured Natural-Language Summary */}
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
