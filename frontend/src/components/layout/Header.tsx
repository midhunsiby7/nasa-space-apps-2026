import React, { useEffect, useState } from 'react';
import {
  Orbit,
  Radio,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  RefreshCw,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';
import { ConnectionState } from '../../types/api';

interface HeaderProps {
  connectionState: ConnectionState;
  onOpenProvenanceGuide: () => void;
  onRetryConnection?: () => void;
  onToggleDemoMode?: () => void;
  isDemoMode?: boolean;
  onToggleDemoGuide?: () => void;
  isDemoGuideOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  onOpenProvenanceGuide,
  onRetryConnection,
  onToggleDemoMode,
  isDemoMode = false,
  onToggleDemoGuide,
  isDemoGuideOpen = false,
}) => {
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
    <header className="sticky top-0 z-40 w-full border-b border-space-700/80 bg-space-950/90 backdrop-blur px-4 lg:px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-space-850 border border-telemetry-cyan/40 text-telemetry-cyan shadow-hud-glow">
            <Orbit className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold tracking-wider text-space-100">
                COSMOLOOKUP
              </span>
              <span className="rounded bg-telemetry-cyan/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-telemetry-cyan border border-telemetry-cyan/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-space-400 font-mono tracking-wide hidden sm:block">
              ASTRONAUT HEALTH TELEMETRY &amp; PHYSIOLOGICAL OBSERVATION
            </p>
          </div>
        </div>

        {/* Center: Mission Clock & Signal */}
        <div className="hidden md:flex items-center gap-4 bg-space-900/80 px-3 py-1.5 rounded border border-space-700/60 font-mono text-xs">
          <div className="flex items-center gap-2 text-space-300">
            <Radio className="h-3.5 w-3.5 text-telemetry-emerald animate-pulse" />
            <span className="text-[11px] text-space-400">TELEMETRY CLOCK:</span>
            <span className="text-telemetry-cyan font-semibold tracking-wider">{utcTime || 'SYNCHRONIZING...'}</span>
          </div>
        </div>

        {/* Right Controls & Connection State */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Judge Demo Walkthrough Guide Button */}
          {onToggleDemoGuide && (
            <button
              onClick={onToggleDemoGuide}
              aria-label="Toggle Judge Demonstration Flow"
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                isDemoGuideOpen
                  ? 'bg-telemetry-cyan text-space-950 shadow-hud-glow'
                  : 'bg-space-800 hover:bg-space-750 text-telemetry-cyan border border-telemetry-cyan/40'
              }`}
              title="Launch the 10-step guided demonstration sequence for judges"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Demo Tour</span>
            </button>
          )}

          {/* Data Provenance Guide Button */}
          <button
            onClick={onOpenProvenanceGuide}
            aria-label="Inspect Data Provenance & Scientific Integrity Standard"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-space-850 hover:bg-space-800 border border-space-700 text-xs font-mono text-space-300 hover:text-space-100 transition-colors"
            title="Inspect Data Provenance & Scientific Integrity Standard"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-telemetry-cyan" />
            <span className="hidden sm:inline">Provenance</span>
            <HelpCircle className="h-3 w-3 text-space-500" />
          </button>

          {/* Connection status badges */}
          {connectionState === 'connected' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-semibold">API CONNECTED</span>
            </div>
          )}

          {connectionState === 'connecting' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono">
              <RefreshCw className="h-3 w-3 animate-spin text-sky-400" />
              <span>CONNECTING...</span>
            </div>
          )}

          {connectionState === 'offline' && (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono"
                title="FastAPI backend service is offline at http://localhost:8000/api/v1"
              >
                <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>BACKEND OFFLINE</span>
              </div>
              {onRetryConnection && (
                <button
                  onClick={onRetryConnection}
                  className="p-1 rounded bg-space-800 hover:bg-space-750 text-space-300 hover:text-space-100 border border-space-700 text-xs font-mono"
                  title="Retry connecting to backend"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              {onToggleDemoMode && (
                <button
                  onClick={onToggleDemoMode}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-mono text-amber-300"
                  title="Launch offline synthetic demonstration dataset"
                >
                  <PlayCircle className="h-3 w-3 text-amber-400" />
                  <span>Demo Mode</span>
                </button>
              )}
            </div>
          )}

          {connectionState === 'offline_demo' && (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono"
                title="Operating with synthetic demonstration telemetry (offline simulation)"
              >
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>OFFLINE DEMO MODE</span>
              </div>
              {isDemoMode && onToggleDemoMode && (
                <button
                  onClick={onToggleDemoMode}
                  className="px-2 py-0.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-[11px] font-mono text-space-300 hover:text-space-100"
                  title="Switch back to live backend API requests"
                >
                  Live API
                </button>
              )}
            </div>
          )}

          {connectionState === 'error' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono">
              <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
              <span>SERVER ERROR</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
