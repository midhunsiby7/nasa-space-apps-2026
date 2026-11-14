import React, { useState, useMemo } from 'react';
import { Search, Filter, Users, X } from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { AstronautCard } from './AstronautCard';
import { EmptyState } from '../common/EmptyState';

interface AstronautDirectoryProps {
  astronauts: Astronaut[];
  selectedAstronautId: string | null;
  onSelectAstronaut: (id: string) => void;
  onOpenDetails: (astronaut: Astronaut) => void;
}

export const AstronautDirectory: React.FC<AstronautDirectoryProps> = ({
  astronauts,
  selectedAstronautId,
  onSelectAstronaut,
  onOpenDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMission, setSelectedMission] = useState<string>('ALL');

  // Extract unique missions for filter dropdown
  const missionOptions = useMemo(() => {
    const list = Array.from(new Set(astronauts.map((a) => a.mission_name)));
    return ['ALL', ...list];
  }, [astronauts]);

  // Filtered astronaut list based on search and mission
  const filteredAstronauts = useMemo(() => {
    return astronauts.filter((astro) => {
      const matchesSearch =
        astro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        astro.crew_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        astro.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMission =
        selectedMission === 'ALL' || astro.mission_name === selectedMission;

      return matchesSearch && matchesMission;
    });
  }, [astronauts, searchQuery, selectedMission]);

  return (
    <div className="space-y-5">
      {/* Search and Mission Filter Bar */}
      <div className="rounded-lg bg-space-850 p-4 border border-space-700/80 shadow-hud-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-space-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crew by name, role, or ID (e.g., Sarah, Commander, astro-001)..."
              className="w-full rounded-md bg-space-900 border border-space-700/80 pl-9 pr-8 py-2 text-xs font-mono text-space-100 placeholder:text-space-500 focus:outline-none focus:border-telemetry-cyan focus:ring-1 focus:ring-telemetry-cyan"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-space-500 hover:text-space-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Mission filter selector */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-space-400 shrink-0" />
            <select
              value={selectedMission}
              onChange={(e) => setSelectedMission(e.target.value)}
              className="rounded-md bg-space-900 border border-space-700/80 px-3 py-2 text-xs font-mono text-space-200 focus:outline-none focus:border-telemetry-cyan"
            >
              {missionOptions.map((mission) => (
                <option key={mission} value={mission} className="bg-space-900 text-space-100">
                  {mission === 'ALL' ? 'All Missions' : mission}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter & Active filters */}
        <div className="mt-3 flex items-center justify-between text-xs font-mono text-space-400 pt-2 border-t border-space-700/40">
          <span>
            Displaying <strong className="text-space-200">{filteredAstronauts.length}</strong> of{' '}
            <strong className="text-space-200">{astronauts.length}</strong> astronauts
          </span>
          {(searchQuery || selectedMission !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMission('ALL');
              }}
              className="text-telemetry-cyan hover:underline text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Directory Roster Grid */}
      {filteredAstronauts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAstronauts.map((astro) => (
            <AstronautCard
              key={astro.id}
              astronaut={astro}
              isSelected={selectedAstronautId === astro.id}
              onSelect={() => onSelectAstronaut(astro.id)}
              onOpenDetails={() => onOpenDetails(astro)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Astronauts Found"
          description={`No crew members match the criteria "${searchQuery || selectedMission}". Try clearing your search parameters.`}
          icon={<Users className="w-8 h-8 text-space-500 mb-2" />}
        />
      )}
    </div>
  );
};
