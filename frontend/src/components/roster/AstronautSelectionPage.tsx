import React from 'react';
import { Astronaut } from '../../types/astronaut';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface AstronautSelectionPageProps {
  astronauts: Astronaut[];
  onSelectAndLaunch: (astronautId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const getInitials = (name: string): string =>
  name
    .replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export const AstronautSelectionPage: React.FC<AstronautSelectionPageProps> = ({
  astronauts,
  onSelectAndLaunch,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  return (
    <section
      aria-label="Crew selection"
      className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-6xl flex-col items-center justify-center gap-14 px-4 bg-white"
    >
      <div className="text-center">
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold tracking-[0.35em] text-slate-900">
          COSMOLOOKUP
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">
          Select crew member for operational monitoring
        </p>
      </div>

      {isLoading && astronauts.length === 0 ? (
        <LoadingSpinner size="lg" label="Synchronizing mission crew..." />
      ) : error && astronauts.length === 0 ? (
        <ErrorMessage title="Crew Unavailable" message={error} onRetry={onRetry} />
      ) : (
        <ul className="flex flex-wrap items-start justify-center gap-x-12 gap-y-10">
          {astronauts.map((astro) => (
            <li key={astro.id}>
              <button
                type="button"
                onClick={() => onSelectAndLaunch(astro.id)}
                aria-label={`Open dashboard for ${astro.name} (${astro.id})`}
                className="group flex w-36 flex-col items-center gap-4 focus:outline-none"
              >
                <span className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-slate-200 bg-white font-mono text-2xl font-bold tracking-wider text-telemetry-cyan shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-telemetry-cyan group-hover:shadow-md group-focus-visible:border-telemetry-cyan group-focus-visible:shadow-md">
                  {getInitials(astro.name)}
                </span>
                <span className="text-center">
                  <span className="block font-mono text-sm font-semibold text-slate-900 group-hover:text-telemetry-cyan transition-colors">
                    {astro.name}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] uppercase tracking-widest text-slate-500">
                    {astro.id}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
