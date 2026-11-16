import React from 'react';
import {
  ExternalLink,
  AlertTriangle,
  ChevronRight,
  Database,
} from 'lucide-react';
import { ResearchStudy, EvidenceCategory, ResearchRelevance } from '../../types/research';

interface ResearchStudyCardProps {
  study: ResearchStudy;
  onInspect: (study: ResearchStudy) => void;
  onSelectBodySystem?: (system: string) => void;
}

export const ResearchStudyCard: React.FC<ResearchStudyCardProps> = ({
  study,
  onInspect,
  onSelectBodySystem,
}) => {
  const getCategoryBadge = (cat: EvidenceCategory) => {
    switch (cat) {
      case 'HUMAN_SPACEFLIGHT':
        return {
          label: 'Human Spaceflight',
          bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        };
      case 'HUMAN_GROUND_ANALOG':
        return {
          label: 'Human Ground Analog',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'ANIMAL_MODEL':
        return {
          label: 'Animal Model',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'CELL_OR_TISSUE_MODEL':
        return {
          label: 'Cell / Tissue Chip',
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        };
      default:
        return {
          label: 'Empirical Research',
          bg: 'bg-space-800 text-space-300 border-space-700',
        };
    }
  };

  const getRelevanceBadge = (rel: ResearchRelevance) => {
    switch (rel) {
      case 'HIGH':
        return {
          label: 'High Mission Relevance',
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        };
      case 'MODERATE':
        return {
          label: 'Moderate Relevance',
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      default:
        return {
          label: 'Low / Exploratory',
          bg: 'bg-space-800 text-space-400 border-space-700',
        };
    }
  };

  const catBadge = getCategoryBadge(study.evidence_category);
  const relBadge = getRelevanceBadge(study.relevance);

  return (
    <div className="rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card hover:border-space-600 transition-all flex flex-col justify-between gap-4 font-mono">
      <div className="space-y-3">
        {/* Top Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Accession ID */}
            <span className="px-2 py-0.5 rounded bg-telemetry-cyan/15 text-telemetry-cyan border border-telemetry-cyan/30 text-xs font-bold">
              {study.accession}
            </span>

            {/* Evidence Category */}
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${catBadge.bg}`}>
              {catBadge.label}
            </span>

            {/* Relevance */}
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${relBadge.bg}`}>
              {relBadge.label}
            </span>
          </div>

          {/* NASA OSDR Provenance Indicator */}
          <span className="text-[10px] uppercase tracking-wider text-space-400 flex items-center gap-1 bg-space-900 px-2 py-0.5 rounded border border-space-750">
            <Database className="h-3 w-3 text-sky-400" />
            <span>NASA OSDR CURATED</span>
          </span>
        </div>

        {/* Study Title */}
        <h3
          onClick={() => onInspect(study)}
          className="text-sm font-bold text-space-100 hover:text-telemetry-cyan transition-colors cursor-pointer leading-snug line-clamp-2"
          title={study.title}
        >
          {study.title}
        </h3>

        {/* Abstract snippet */}
        <p className="text-xs text-space-300 leading-relaxed line-clamp-3">
          {study.description}
        </p>

        {/* Mission Context & Organism Metadata */}
        <div className="p-2.5 rounded bg-space-900 border border-space-750 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-space-300">
            <span className="text-space-400 uppercase">Organism:</span>
            <span className="font-semibold text-space-200 italic">
              {study.organism} {study.sample_count !== null && study.sample_count !== undefined ? `(N=${study.sample_count})` : ''}
            </span>
          </div>
          <div className="flex items-center justify-between text-space-300">
            <span className="text-space-400 uppercase">Context:</span>
            <span className="text-telemetry-cyan truncate max-w-[260px] text-right" title={study.mission_context}>
              {study.mission_context}
            </span>
          </div>
        </div>

        {/* Body Systems & Assay Types Tags */}
        <div className="space-y-1.5 pt-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-space-500 uppercase mr-1">Target Systems:</span>
            {study.body_systems.map((sys) => (
              <button
                key={sys}
                type="button"
                onClick={() => onSelectBodySystem && onSelectBodySystem(sys)}
                className="px-1.5 py-0.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-[10px] text-space-200 hover:text-telemetry-cyan transition-colors capitalize"
              >
                {sys.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-space-500 uppercase mr-1">Assays:</span>
            {study.assay_types.slice(0, 3).map((assay) => (
              <span
                key={assay}
                className="px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30 text-[10px]"
              >
                {assay}
              </span>
            ))}
            {study.assay_types.length > 3 && (
              <span className="text-[10px] text-space-500">
                +{study.assay_types.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Explicit Scientific Limitations Notice */}
        {study.limitations && (
          <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/30 text-amber-200/90 text-[11px] leading-relaxed flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px] block">
                Scientific Limitation &amp; Flight Caveat:
              </span>
              <p className="mt-0.5 text-space-300 text-[11px]">
                {study.limitations}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-space-800 flex items-center justify-between gap-2">
        {study.official_url ? (
          <a
            href={study.official_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open NASA OSDR study ${study.accession} in new tab`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs text-space-300 hover:text-white transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-sky-400" />
            <span>NASA OSDR Portal</span>
          </a>
        ) : (
          <span className="text-[10px] text-space-500 italic">No external URL</span>
        )}

        <button
          type="button"
          onClick={() => onInspect(study)}
          aria-label={`Inspect details for study ${study.accession}`}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-telemetry-cyan/15 hover:bg-telemetry-cyan/25 border border-telemetry-cyan/40 text-telemetry-cyan text-xs font-bold transition-colors"
        >
          <span>Study Dossier</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
