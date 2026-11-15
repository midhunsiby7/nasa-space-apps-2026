import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';

interface ResearchFilterConsoleProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBodySystem: string;
  onSelectBodySystem: (system: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedRelevance: string;
  onSelectRelevance: (relevance: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const ResearchFilterConsole: React.FC<ResearchFilterConsoleProps> = ({
  searchQuery,
  onSearchChange,
  selectedBodySystem,
  onSelectBodySystem,
  selectedCategory,
  onSelectCategory,
  selectedRelevance,
  onSelectRelevance,
  onResetFilters,
  hasActiveFilters,
}) => {
  const bodySystemOptions = [
    { id: 'all', label: 'All Systems' },
    { id: 'cardiovascular', label: 'Cardiovascular' },
    { id: 'musculoskeletal', label: 'Musculoskeletal' },
    { id: 'immune', label: 'Immune' },
    { id: 'metabolic', label: 'Metabolic' },
    { id: 'neurological', label: 'Neurological' },
    { id: 'endocrine', label: 'Endocrine' },
    { id: 'hematologic', label: 'Hematologic' },
    { id: 'integumentary', label: 'Integumentary' },
    { id: 'radiation', label: 'Radiation ALARA' },
    { id: 'behavioral', label: 'Behavioral' },
  ];

  return (
    <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card space-y-4 font-mono">
      {/* Top Filter Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-space-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search OSDR studies (e.g. OSD-575, SOMA, bed rest, telomeres)..."
            aria-label="Search OSDR research studies"
            className="w-full rounded bg-space-900 border border-space-700 pl-9 pr-4 py-1.5 text-xs text-space-100 placeholder-space-500 focus:outline-none focus:border-telemetry-cyan"
          />
        </div>

        {/* Evidence Category Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-space-400">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            aria-label="Filter by Evidence Category"
            className="rounded bg-space-900 border border-space-700 px-2.5 py-1.5 text-xs text-space-200 focus:outline-none focus:border-telemetry-cyan"
          >
            <option value="all">All Evidence Categories</option>
            <option value="HUMAN_SPACEFLIGHT">Human Spaceflight (Flight)</option>
            <option value="HUMAN_GROUND_ANALOG">Human Ground Analog (Bed Rest)</option>
            <option value="ANIMAL_MODEL">Animal Model (Rodent Research)</option>
            <option value="CELL_OR_TISSUE_MODEL">Cell / Tissue Chip</option>
            <option value="OTHER">Other / Theoretical</option>
          </select>
        </div>

        {/* Relevance Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-space-400">Relevance:</span>
          <select
            value={selectedRelevance}
            onChange={(e) => onSelectRelevance(e.target.value)}
            aria-label="Filter by Operational Relevance"
            className="rounded bg-space-900 border border-space-700 px-2.5 py-1.5 text-xs text-space-200 focus:outline-none focus:border-telemetry-cyan"
          >
            <option value="all">All Relevance Tiers</option>
            <option value="HIGH">High Mission Relevance</option>
            <option value="MODERATE">Moderate Relevance</option>
            <option value="LOW">Low / Exploratory</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            aria-label="Reset all search and filter criteria"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-space-800 hover:bg-space-750 text-xs text-space-300 hover:text-telemetry-cyan border border-space-700 transition-colors shrink-0"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Body System Filter Pills */}
      <div className="space-y-1.5 pt-2 border-t border-space-800">
        <div className="flex items-center gap-1.5 text-[10px] text-space-500 uppercase tracking-wider">
          <Filter className="h-3 w-3 text-telemetry-cyan" />
          <span>Filter by Physiological Target System:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {bodySystemOptions.map((opt) => {
            const isSelected = selectedBodySystem === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectBodySystem(opt.id)}
                className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                  isSelected
                    ? 'bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan font-bold'
                    : 'bg-space-900 hover:bg-space-800 border-space-750 text-space-300'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
