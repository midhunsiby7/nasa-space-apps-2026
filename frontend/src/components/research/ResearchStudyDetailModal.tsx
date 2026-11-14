import React, { useEffect } from 'react';
import {
  X,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Database,
  FileText,
  Dna,
} from 'lucide-react';
import { ResearchStudy } from '../../types/research';

interface ResearchStudyDetailModalProps {
  study: ResearchStudy | null;
  isOpen: boolean;
  onClose: () => void;
  onFilterBodySystem?: (system: string) => void;
}

export const ResearchStudyDetailModal: React.FC<ResearchStudyDetailModalProps> = ({
  study,
  isOpen,
  onClose,
  onFilterBodySystem,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !study) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-study-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-sm animate-fade-in font-mono"
    >
      <div className="rounded-xl bg-space-900 border border-space-700 max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-space-750 bg-space-850">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 mt-0.5">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-base text-telemetry-cyan">
                  {study.accession}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-space-800 text-space-300 border border-space-700">
                  {study.evidence_category.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {study.relevance} RELEVANCE
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-space-800 text-space-400 border border-space-700 flex items-center gap-1">
                  <Database className="h-3 w-3 text-sky-400" />
                  NASA OSDR CURATED
                </span>
              </div>
              <h2
                id="modal-study-title"
                className="text-base font-bold text-space-100 mt-1 leading-snug"
              >
                {study.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close study modal"
            className="p-1.5 rounded-lg text-space-400 hover:text-white hover:bg-space-800 transition-colors shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-space-200">
          {/* Key Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded bg-space-850 border border-space-750">
              <span className="text-[10px] text-space-400 uppercase block">Biological Organism</span>
              <span className="font-bold text-space-100 italic mt-0.5 block">{study.organism}</span>
              <span className="text-[10px] text-space-400">
                Sample Size: {study.sample_count !== null && study.sample_count !== undefined ? `N=${study.sample_count}` : 'Unspecified'}
              </span>
            </div>

            <div className="p-3 rounded bg-space-850 border border-space-750 sm:col-span-2">
              <span className="text-[10px] text-space-400 uppercase block">Spaceflight / Analog Context</span>
              <span className="font-semibold text-telemetry-cyan mt-0.5 block leading-relaxed">
                {study.mission_context}
              </span>
            </div>
          </div>

          {/* Abstract / Scientific Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-space-400 flex items-center gap-2">
              <FileText className="h-4 w-4 text-telemetry-cyan" />
              Scientific Abstract &amp; Study Overview
            </h3>
            <p className="p-3.5 rounded bg-space-850 border border-space-750 text-space-200 leading-relaxed text-xs">
              {study.description}
            </p>
          </div>

          {/* Measurements Summary */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-space-400 flex items-center gap-2">
              <Dna className="h-4 w-4 text-purple-400" />
              Biological Parameters &amp; Endpoints Analyzed
            </h3>
            <p className="p-3 rounded bg-space-850 border border-space-750 text-space-300 leading-relaxed text-xs">
              {study.measurements_summary}
            </p>
          </div>

          {/* Target Systems & Assays Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Body Systems */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-space-400">
                Physiological Target Systems
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {study.body_systems.map((sys) => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => {
                      if (onFilterBodySystem) {
                        onFilterBodySystem(sys);
                        onClose();
                      }
                    }}
                    className="px-2 py-1 rounded bg-space-850 hover:bg-space-800 border border-space-700 text-space-200 hover:text-telemetry-cyan transition-colors text-xs capitalize"
                    title={`Filter studies by ${sys.replace(/_/g, ' ')}`}
                  >
                    {sys.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Assay Methodologies & Formats */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-space-400">
                Assay Technologies &amp; Formats
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {study.assay_types.map((assay) => (
                  <span
                    key={assay}
                    className="px-2 py-1 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30 text-[11px]"
                  >
                    {assay}
                  </span>
                ))}
                {study.data_formats.map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2 py-1 rounded bg-space-800 text-space-400 border border-space-700 text-[10px]"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Publication Citation */}
          {study.publication_citation && (
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-space-400">
                Primary Publication Citation
              </h4>
              <p className="p-2.5 rounded bg-space-850 border border-space-750 text-space-300 italic text-[11px]">
                {study.publication_citation}
              </p>
            </div>
          )}

          {/* CRITICAL SCIENTIFIC SAFETY DISCLAIMER & LIMITATIONS */}
          <div className="p-4 rounded-lg bg-amber-950/25 border border-amber-500/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Scientific Limitations &amp; Translational Guardrails
              </h4>
            </div>

            <p className="text-xs text-space-200 leading-relaxed">
              {study.limitations ||
                'This empirical spaceflight study provides mechanistic biological reference context. Empirical findings must not be treated as live astronaut vital signs or clinical diagnostic criteria.'}
            </p>

            <div className="pt-2 border-t border-amber-500/20 text-[10px] text-amber-200/80">
              <strong>Flight Medicine Notice:</strong> COSMOLOOKUP maintains a strict separation between population-level empirical space biology research (NASA OSDR) and intra-individual astronaut telemetry streams.
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-space-750 bg-space-850">
          <div className="text-[11px] text-space-400">
            Provenance: <strong className="text-space-200">NASA_OSDR_CURATED</strong> (is_synthetic: false)
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs text-space-300 hover:text-white transition-colors"
            >
              Close
            </button>

            {study.official_url && (
              <a
                href={study.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-telemetry-cyan text-space-950 text-xs font-bold hover:bg-telemetry-cyan/90 transition-colors shadow-hud-glow"
              >
                <span>View on NASA OSDR</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
