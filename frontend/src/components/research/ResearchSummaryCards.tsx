import React from 'react';
import { BookOpen, UserCheck, Flame, Activity } from 'lucide-react';
import { ResearchSummaryResponse } from '../../types/research';

interface ResearchSummaryCardsProps {
  summary: ResearchSummaryResponse;
}

export const ResearchSummaryCards: React.FC<ResearchSummaryCardsProps> = ({ summary }) => {
  const humanFlightCount = summary.counts_by_evidence_category['HUMAN_SPACEFLIGHT'] || 0;
  const humanAnalogCount = summary.counts_by_evidence_category['HUMAN_GROUND_ANALOG'] || 0;
  const totalHumanCount = humanFlightCount + humanAnalogCount;
  const highRelevanceCount = summary.counts_by_relevance['HIGH'] || 0;
  const coveredBodySystemsCount = Object.keys(summary.counts_by_body_system || {}).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono">
      {/* 1. Total Curated Studies */}
      <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
        <div className="flex items-center justify-between text-space-400">
          <span className="text-[10px] uppercase tracking-wider block">Total Curated Studies</span>
          <BookOpen className="h-4 w-4 text-sky-400 opacity-80" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-space-100">{summary.total_studies}</span>
          <span className="text-xs text-space-400 font-normal">NASA OSDR</span>
        </div>
        <p className="mt-1 text-[11px] text-space-500">Curated space biology datasets</p>
      </div>

      {/* 2. Human Spaceflight & Analogs */}
      <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
        <div className="flex items-center justify-between text-space-400">
          <span className="text-[10px] uppercase tracking-wider block">Human Spaceflight &amp; Analogs</span>
          <UserCheck className="h-4 w-4 text-sky-400 opacity-80" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-sky-400">{totalHumanCount}</span>
          <span className="text-xs text-space-400 font-normal">
            ({humanFlightCount} flight, {humanAnalogCount} analog)
          </span>
        </div>
        <p className="mt-1 text-[11px] text-space-500">Inspiration4 SOMA &amp; HDT Bed Rest</p>
      </div>

      {/* 3. High Mission Relevance */}
      <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
        <div className="flex items-center justify-between text-space-400">
          <span className="text-[10px] uppercase tracking-wider block">High Mission Relevance</span>
          <Flame className="h-4 w-4 text-emerald-400 opacity-80" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-400">{highRelevanceCount}</span>
          <span className="text-xs text-space-400 font-normal">Tier 1</span>
        </div>
        <p className="mt-1 text-[11px] text-space-500">Direct operational mission impact</p>
      </div>

      {/* 4. Covered Body Systems */}
      <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
        <div className="flex items-center justify-between text-space-400">
          <span className="text-[10px] uppercase tracking-wider block">Target Body Systems</span>
          <Activity className="h-4 w-4 text-telemetry-cyan opacity-80" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-telemetry-cyan">{coveredBodySystemsCount}</span>
          <span className="text-xs text-space-400 font-normal">Physiological</span>
        </div>
        <p className="mt-1 text-[11px] text-space-500">Cardiovascular to Radiation ALARA</p>
      </div>
    </div>
  );
};
