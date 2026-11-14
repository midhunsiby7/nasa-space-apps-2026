import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  RefreshCw,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import {
  ResearchStudy,
  ResearchSummaryResponse,
} from '../../types/research';
import { apiClient } from '../../services/apiClient';
import { ResearchSummaryCards } from './ResearchSummaryCards';
import { ResearchFilterConsole } from './ResearchFilterConsole';
import { ResearchStudyCard } from './ResearchStudyCard';
import { ResearchStudyDetailModal } from './ResearchStudyDetailModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { EmptyState } from '../common/EmptyState';

interface ResearchExplorerViewProps {
  initialBodySystem?: string;
  onNavigateToAnatomy?: () => void;
}

export const ResearchExplorerView: React.FC<ResearchExplorerViewProps> = ({
  initialBodySystem,
  onNavigateToAnatomy,
}) => {
  const [studies, setStudies] = useState<ResearchStudy[]>([]);
  const [summary, setSummary] = useState<ResearchSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBodySystem, setSelectedBodySystem] = useState<string>(initialBodySystem || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRelevance, setSelectedRelevance] = useState<string>('all');

  // Detail Modal State
  const [inspectingStudy, setInspectingStudy] = useState<ResearchStudy | null>(null);

  // Sync initial body system if passed from 3D anatomy or external view
  useEffect(() => {
    if (initialBodySystem) {
      setSelectedBodySystem(initialBodySystem);
    }
  }, [initialBodySystem]);

  // Fetch summary and studies
  const fetchResearchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, studiesRes] = await Promise.all([
        apiClient.getResearchSummary(),
        apiClient.getResearchStudies({
          body_system: selectedBodySystem !== 'all' ? selectedBodySystem : undefined,
          evidence_category: selectedCategory !== 'all' ? selectedCategory : undefined,
          relevance: selectedRelevance !== 'all' ? selectedRelevance : undefined,
          search: searchQuery.trim() || undefined,
          limit: 100,
        }),
      ]);

      setSummary(summaryRes);
      setStudies(studiesRes.data);
    } catch (err: any) {
      console.error('Failed to retrieve NASA OSDR research catalogue:', err);
      setError(
        err?.message ||
          'Failed to connect to the NASA OSDR research catalogue. You can retry or verify offline mode.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedBodySystem, selectedCategory, selectedRelevance]);

  useEffect(() => {
    fetchResearchData();
  }, [fetchResearchData]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBodySystem('all');
    setSelectedCategory('all');
    setSelectedRelevance('all');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedBodySystem !== 'all' ||
    selectedCategory !== 'all' ||
    selectedRelevance !== 'all';

  return (
    <div className="space-y-6 font-mono">
      {/* 1. Header Banner & Central Judge Message */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 mt-0.5">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-base font-bold uppercase tracking-wider text-space-100">
                  NASA OSDR Research Catalogue &amp; Evidence Repository
                </h2>
                <span className="rounded bg-sky-500/15 px-2 py-0.5 font-mono text-[10px] text-sky-400 border border-sky-500/30">
                  OFFLINE-FIRST
                </span>
              </div>
              <p className="font-mono text-xs text-space-300 mt-1 leading-relaxed max-w-4xl">
                {"COSMOLOOKUP doesn't just display astronaut health indicators. It also provides access to the scientific research behind spaceflight health risks, while keeping research evidence separate from individual astronaut telemetry."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchResearchData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs text-space-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Repository</span>
            </button>

            {onNavigateToAnatomy && (
              <button
                type="button"
                onClick={onNavigateToAnatomy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-telemetry-cyan/15 hover:bg-telemetry-cyan/25 border border-telemetry-cyan/40 text-xs text-telemetry-cyan font-bold transition-colors"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>3D Holographic Anatomy</span>
              </button>
            )}
          </div>
        </div>

        {/* Safety & Decoupling Warning Notice */}
        <div className="p-3 rounded bg-space-900 border border-space-750 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-space-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Scientific Protocol Guarantee:</strong> All 15 studies are curated directly from the NASA Open Science Data Repository (<code className="text-telemetry-cyan">NASA_OSDR_CURATED</code>, <code className="text-space-300">is_synthetic: false</code>). Research endpoints do NOT mutate or inject into astronaut time-series telemetry.
            </span>
          </div>
          <span className="text-[10px] text-space-500 uppercase whitespace-nowrap">
            NASA-STD-3001 VOL 1 &amp; 2
          </span>
        </div>
      </div>

      {/* 2. Top Summary KPI Row */}
      {summary && <ResearchSummaryCards summary={summary} />}

      {/* 3. Multi-Dimensional Filter Console */}
      <ResearchFilterConsole
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedBodySystem={selectedBodySystem}
        onSelectBodySystem={setSelectedBodySystem}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedRelevance={selectedRelevance}
        onSelectRelevance={setSelectedRelevance}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. Studies Grid & State Management */}
      {isLoading ? (
        <LoadingSpinner label="Accessing curated NASA Open Science Data Repository records..." size="lg" />
      ) : error ? (
        <ErrorMessage
          title="NASA OSDR Catalogue Error"
          message={error}
          onRetry={fetchResearchData}
        />
      ) : studies.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            title="No Matching NASA OSDR Studies"
            description="No scientific research studies match your current search queries or multi-dimensional filter criteria."
          />
          <div className="text-center">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded bg-space-800 hover:bg-space-700 border border-space-600 text-xs text-telemetry-cyan font-bold transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-space-400 px-1">
            <span>
              Displaying <strong className="text-space-100">{studies.length}</strong> of{' '}
              <strong className="text-space-100">{summary?.total_studies || 15}</strong> NASA OSDR curated studies
            </span>
            <span className="text-[11px] text-space-500">
              Verified NASA Biological Repositories
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {studies.map((study) => (
              <ResearchStudyCard
                key={study.accession}
                study={study}
                onInspect={(s) => setInspectingStudy(s)}
                onSelectBodySystem={(sys) => setSelectedBodySystem(sys)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Full Study Inspection Modal */}
      <ResearchStudyDetailModal
        study={inspectingStudy}
        isOpen={!!inspectingStudy}
        onClose={() => setInspectingStudy(null)}
        onFilterBodySystem={(sys) => setSelectedBodySystem(sys)}
      />
    </div>
  );
};

export default ResearchExplorerView;
