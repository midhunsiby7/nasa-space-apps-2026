import React, { useEffect, useState } from 'react';
import {
  Orbit,
  Radio,
  RefreshCw,
  AlertCircle,
  PlayCircle,
  Users,
} from 'lucide-react';
import { ConnectionState } from '../../types/api';
import { Astronaut } from '../../types/astronaut';

export type MainAppPage = 'intro' | 'roster' | 'cockpit';

interface HeaderProps {
  connectionState: ConnectionState;
  onRetryConnection?: () => void;
  onToggleDemoMode?: () => void;
  isDemoMode?: boolean;
  // Navigation props
  currentPage?: MainAppPage;
  onNavigatePage?: (page: MainAppPage) => void;
  astronauts?: Astronaut[];
  selectedAstronautId?: string | null;
  onSelectAstronaut?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  onRetryConnection,
  onToggleDemoMode,
  isDemoMode = false,
  currentPage = 'cockpit',
  onNavigatePage,
  astronauts = [],
  selectedAstronautId,
  onSelectAstronaut,
}) => {
  const isCockpit = currentPage === 'cockpit';
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur px-4 lg:px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity & Page Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigatePage && onNavigatePage('intro')}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-telemetry-cyan/40 text-telemetry-cyan shadow-sm hover:border-telemetry-cyan transition-colors"
            title="Return to COSMOLOOKUP Introduction"
          >
            <Orbit className="h-5 w-5 animate-pulse" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigatePage && onNavigatePage('intro')}
                className="font-mono text-base font-bold tracking-wider text-slate-900 hover:text-telemetry-cyan transition-colors text-left"
              >
                COSMOLOOKUP
              </button>
              <span className="rounded bg-sky-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-telemetry-cyan border border-sky-200">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono tracking-wide hidden sm:block">
              ASTRONAUT HEALTH TELEMETRY &amp; DECISION SUPPORT
            </p>
          </div>
        </div>

        {/* Quick Crew Navigation Button */}
        {onNavigatePage && (
          <div className="flex items-center gap-2">
            {currentPage !== 'roster' && (
              <button
                type="button"
                onClick={() => onNavigatePage('roster')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-telemetry-cyan/60 font-mono text-xs font-semibold text-slate-700 hover:text-telemetry-cyan transition-colors shadow-sm"
              >
                <Users className="h-3.5 w-3.5 text-telemetry-cyan" />
                <span>Crew</span>
              </button>
            )}
            {currentPage === 'cockpit' && (
              <button
                type="button"
                onClick={() => onNavigatePage('intro')}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 font-mono text-xs transition-colors"
              >
                <span>Intro</span>
              </button>
            )}
          </div>
        )}

        {/* Mission Clock & Active Crew Member Selector */}
        <div className={`${!isCockpit ? 'hidden' : 'hidden lg:flex'} items-center gap-3`}>
          {/* Active Astronaut Quick Dropdown (when in cockpit) */}
          {astronauts.length > 0 && onSelectAstronaut && currentPage === 'cockpit' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-mono text-xs">
              <span className="text-[10px] text-slate-400 uppercase">Crew:</span>
              <select
                value={selectedAstronautId || ''}
                onChange={(e) => onSelectAstronaut(e.target.value)}
                className="bg-transparent text-telemetry-cyan font-semibold focus:outline-none cursor-pointer"
              >
                {astronauts.map((a) => (
                  <option key={a.id} value={a.id} className="bg-white text-slate-900">
                    {a.name} ({a.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Telemetry Clock */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-700">
            <Radio className="h-3.5 w-3.5 text-telemetry-emerald animate-pulse" />
            <span className="text-[11px] text-slate-400">UTC:</span>
            <span className="text-telemetry-cyan font-semibold tracking-wider">
              {utcTime || 'SYNCHRONIZING...'}
            </span>
          </div>
        </div>

        {/* Right Controls & Connection State */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection status badges */}
          {connectionState === 'connected' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-semibold">ONLINE</span>
              </div>
              {onToggleDemoMode && (
                <button
                  onClick={onToggleDemoMode}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 hover:text-amber-700 transition-colors"
                  title={isDemoMode ? 'Demo Mode Active - Click to toggle' : 'Switch to offline demonstration dataset'}
                  aria-label="Toggle Demonstration Mode"
                >
                  <PlayCircle className="h-3 w-3 text-amber-600" />
                  <span className="hidden sm:inline">{isDemoMode ? 'Demo ON' : 'Demo'}</span>
                </button>
              )}
            </div>
          )}

          {connectionState === 'connecting' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs font-mono">
              <RefreshCw className="h-3 w-3 animate-spin text-sky-600" />
              <span>CONNECTING...</span>
            </div>
          )}

          {connectionState === 'offline' && (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono"
                title="FastAPI backend service is offline at http://localhost:8000/api/v1"
              >
                <AlertCircle className="h-3 w-3 text-rose-600" />
                <span className="font-semibold">OFFLINE</span>
              </div>
              {onRetryConnection && (
                <button
                  onClick={onRetryConnection}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono text-slate-700 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
