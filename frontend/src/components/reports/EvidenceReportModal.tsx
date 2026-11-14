import React, { useState, useMemo } from 'react';
import {
  FileText,
  Copy,
  Printer,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation, TelemetryFreshnessResponse } from '../../types/trend';
import { AssessmentResponse } from '../../types/assessment';
import { AlertResponse } from '../../types/alert';

interface EvidenceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  astronaut: Astronaut | null;
  measurements: Measurement[];
  baselines: BaselineResponse[];
  trends: TrendObservation[];
  freshness: TelemetryFreshnessResponse | null;
  assessment: AssessmentResponse | null;
  alerts: AlertResponse[];
}

export const EvidenceReportModal: React.FC<EvidenceReportModalProps> = ({
  isOpen,
  onClose,
  astronaut,
  measurements,
  baselines,
  trends,
  freshness,
  assessment,
  alerts,
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Generate Markdown Synthesis
  const markdownReport = useMemo(() => {
    if (!astronaut) return '';
    const dateStr = new Date().toISOString();

    const activeAlerts = alerts.filter((a) => a.status === 'active');
    const staleFreshness = freshness?.items.filter((i) => i.status === 'stale') || [];

    const lines: string[] = [
      `# COSMOLOOKUP — CREW EVIDENCE REPORT`,
      `**Generated:** ${dateStr} (UTC)`,
      `**Astronaut:** ${astronaut.name} (${astronaut.id})`,
      `**Mission:** ${astronaut.mission_name} • Flight Day D+${astronaut.mission_day}`,
      `**Crew Role:** ${astronaut.crew_role}`,
      ``,
      `---`,
      `## 1. SCIENTIFIC & REGULATORY DISCLOSURE`,
      `This report is synthesized deterministically from intra-individual telemetry and statistical models for biomedical flight controller decision support. COSMOLOOKUP algorithms do NOT constitute an automated medical diagnosis or clinical prescription. Emergency evaluations are disabled by default in software configuration and require authorized flight rules.`,
      ``,
      `---`,
      `## 2. TELEMETRY COVERAGE & CURRENCY`,
      `- **Total Observations In Record:** ${measurements.length}`,
      `- **Monitored Telemetry Channels:** ${freshness?.total_metrics ?? trends.length}`,
      `- **Currency Status:** ${staleFreshness.length > 0 ? `${staleFreshness.length} Stale Channels` : 'All Nominal / Fresh'}`,
      `- **Active Operational Alerts:** ${activeAlerts.length}`,
      ``,
      `---`,
      `## 3. EXPLAINABLE HEALTH ASSESSMENT`,
      `**Overall Classification:** ${assessment?.overall_classification.toUpperCase() || 'EVALUATION PENDING'}`,
      `**Evaluated At:** ${assessment?.assessment_date || 'N/A'}`,
      `**Data Quality Status:** ${assessment?.data_quality_status || 'nominal'}`,
      ``,
      `### Summary Narrative:`,
      `${assessment?.summary_explanation || 'No assessment generated.'}`,
      ``,
      `### Key Findings:`,
    ];

    if (assessment?.findings && assessment.findings.length > 0) {
      assessment.findings.forEach((f) => {
        const obsStr = f.current_value !== null && f.current_value !== undefined ? String(f.current_value) : '—';
        const baseStr = f.baseline_median !== null && f.baseline_median !== undefined ? String(f.baseline_median) : '—';
        const zStr = f.robust_z !== null && f.robust_z !== undefined ? `${f.robust_z.toFixed(2)}σ` : '—';
        lines.push(
          `- **${f.measurement_type.toUpperCase()}:** ${f.status} (Observed: ${obsStr}, Baseline Median: ${baseStr}, Z-Score: ${zStr})`
        );
        lines.push(`  *Summary:* ${f.summary}`);
      });
    } else {
      lines.push(`- No anomalous metric findings identified.`);
    }

    lines.push(``, `### Operational Guidance:`);
    if (assessment?.guidance && assessment.guidance.length > 0) {
      assessment.guidance.forEach((g) => {
        lines.push(`- **[${g.category.toUpperCase()}]** ${g.action}`);
        lines.push(`  *Rationale:* ${g.rationale}`);
      });
    } else {
      lines.push(`- Routine flight protocol monitoring.`);
    }

    lines.push(``, `---`, `## 4. INTRA-INDIVIDUAL TREND TRAJECTORIES`);
    if (trends.length > 0) {
      trends.forEach((t) => {
        const slopeStr =
          t.sens_slope !== null && t.sens_slope !== undefined
            ? `${t.sens_slope > 0 ? '+' : ''}${t.sens_slope.toFixed(2)} ${t.unit}/24h`
            : 'N/A';
        lines.push(
          `- **${t.measurement_type.toUpperCase()} (${t.context}):** ${t.trend_direction.toUpperCase()} | Sen's Slope: ${slopeStr} | Robust Z: ${t.robust_z !== null && t.robust_z !== undefined ? `${t.robust_z.toFixed(2)}σ` : 'N/A'} | Freshness: ${t.freshness_status}`
        );
        lines.push(`  *Explanation:* ${t.explanation}`);
      });
    } else {
      lines.push(`- No trend observations available.`);
    }

    lines.push(``, `---`, `## 5. PERSONAL BASELINE OPERATIONAL ENVELOPES`);
    if (baselines.length > 0) {
      baselines.forEach((b) => {
        lines.push(
          `- **${b.measurement_type.toUpperCase()} (${b.context}):** Median ${b.envelope.median.toFixed(1)} ${b.unit} [IQR: ${b.envelope.q25.toFixed(1)}–${b.envelope.q75.toFixed(1)}] | Maturity: ${b.maturity} (Evaluated ${b.envelope.sample_count} samples)`
        );
      });
    } else {
      lines.push(`- No finalized operational baselines registered.`);
    }

    lines.push(``, `---`, `## 6. ACTIVE OPERATIONAL ALERTS`);
    if (activeAlerts.length > 0) {
      activeAlerts.forEach((a) => {
        lines.push(
          `- **[${a.severity.toUpperCase()}] ${a.title}** (Emitted: ${a.created_at})`
        );
        lines.push(`  *Context:* ${a.explanation}`);
      });
    } else {
      lines.push(`- All operational channels within nominal parameters.`);
    }

    lines.push(``, `---`, `*Report synthesized by COSMOLOOKUP Spaceflight Operations Platform.*`);
    return lines.join('\n');
  }, [astronaut, measurements, baselines, trends, freshness, assessment, alerts]);

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownReport);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !astronaut) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="rounded-xl bg-space-900 border border-space-700 max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:border-none print:shadow-none print:max-h-none print:bg-white print:text-black">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-space-750 bg-space-850 print:hidden">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-sky-400" />
            <div>
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                Crew Evidence Report
              </h3>
              <p className="font-mono text-[11px] text-space-400">
                {astronaut.name} ({astronaut.mission_name}) • Comprehensive Biomedical Synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 transition-colors"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-sky-400" />}
              <span>{isCopied ? 'Copied Markdown' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-telemetry-cyan/20 hover:bg-telemetry-cyan/30 border border-telemetry-cyan/50 text-xs font-mono font-bold text-telemetry-cyan transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="rounded p-1.5 text-space-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 font-mono text-xs text-space-200 print:text-black print:overflow-visible">
          {/* Print-only title */}
          <div className="hidden print:block border-b pb-4 mb-4">
            <h1 className="text-xl font-bold uppercase">COSMOLOOKUP — CREW EVIDENCE REPORT</h1>
            <p className="text-xs text-gray-600">
              Astronaut: {astronaut.name} ({astronaut.mission_name}) • Generated: {new Date().toISOString()}
            </p>
          </div>

          {/* Regulatory Notice */}
          <div className="rounded-lg bg-space-850 border border-space-700 p-4 space-y-1.5 text-[11px] text-space-400 print:bg-gray-100 print:text-black print:border-gray-300">
            <div className="flex items-center gap-2 text-space-200 font-bold uppercase">
              <ShieldCheck className="h-4 w-4 text-telemetry-cyan" />
              <span>Biomedical Flight Operations Standard Notice</span>
            </div>
            <p className="leading-relaxed">
              This evidence report synthesizes intra-individual statistical envelopes and trajectory indicators strictly for biomedical mission flight controllers and flight surgeons. Algorithms do not constitute automated medical diagnosis or clinical prescription. Emergency threshold evaluation is disabled by default in software configuration.
            </p>
          </div>

          {/* Formatted Markdown Preview */}
          <div className="rounded-lg bg-space-950/80 p-5 border border-space-800 font-mono whitespace-pre-wrap leading-relaxed text-xs text-space-300 print:bg-white print:text-black print:border-none">
            {markdownReport}
          </div>
        </div>
      </div>
    </div>
  );
};
export default EvidenceReportModal;
