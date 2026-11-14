import React from 'react';
import {
  Users,
  LineChart,
  UserCheck,
  Activity,
  TrendingUp,
  BookOpen,
  Brain,
  Bell,
  Radio,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { MeasurementType } from '../../types/measurement';
import { getMetricMeta } from '../../utils/formatters';

export type ActiveTab =
  | 'dashboard'
  | 'roster'
  | 'telemetry'
  | 'anatomy'
  | 'baselines'
  | 'catalog'
  | 'intelligence'
  | 'alerts';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  astronauts: Astronaut[];
  selectedAstronautId: string | null;
  onSelectAstronaut: (id: string) => void;
  availableMetrics: string[];
  selectedMetric: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  activeAlertsCount?: number;
  onOpenNonAnatomical?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  astronauts,
  selectedAstronautId,
  onSelectAstronaut,
  availableMetrics,
  selectedMetric,
  onSelectMetric,
  activeAlertsCount = 0,
  onOpenNonAnatomical,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Mission Overview',
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: 'roster',
      label: 'Crew Directory',
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'telemetry',
      label: 'Telemetry Stream',
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      id: 'anatomy',
      label: '3D Anatomy Map',
      icon: <Activity className="h-4 w-4 text-telemetry-cyan" />,
      badge: (
        <span className="rounded bg-telemetry-cyan/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-telemetry-cyan border border-telemetry-cyan/40">
          3D
        </span>
      ),
    },
    {
      id: 'baselines',
      label: 'Personal Baselines',
      icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
      badge: (
        <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
          IQR
        </span>
      ),
    },
    {
      id: 'catalog',
      label: 'Measurement Catalog',
      icon: <BookOpen className="h-4 w-4 text-sky-400" />,
      badge: (
        <span className="rounded bg-sky-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-sky-400 border border-sky-500/30">
          10
        </span>
      ),
    },
    {
      id: 'intelligence',
      label: 'Health Intelligence',
      icon: <Brain className="h-4 w-4 text-purple-400" />,
      badge: (
        <span className="rounded bg-purple-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-purple-400 border border-purple-500/30">
          AI
        </span>
      ),
    },
    {
      id: 'alerts',
      label: 'Operational Alerts',
      icon: <Bell className="h-4 w-4" />,
      badge:
        activeAlertsCount > 0 ? (
          <span className="rounded bg-rose-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-rose-400 border border-rose-500/40 animate-pulse">
            {activeAlertsCount}
          </span>
        ) : undefined,
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 border-r border-space-700/80 bg-space-900/60 p-3 lg:p-4 flex flex-col gap-5 overflow-y-auto">
      {/* Primary Navigation Tabs */}
      <div>
        <h3 className="px-2 pb-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-space-400">
          Operational Views
        </h3>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                aria-label={`Navigate to ${item.label}`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md font-mono text-xs transition-colors w-full text-left ${
                  isActive
                    ? 'bg-space-800 text-telemetry-cyan font-bold border-l-2 border-telemetry-cyan shadow-hud-sm'
                    : 'text-space-300 hover:bg-space-850 hover:text-space-100'
                }`}
              >
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Crew Quick-Selector */}
      <div className="border-t border-space-700/60 pt-4">
        <div className="flex items-center justify-between px-2 pb-2">
          <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-space-400">
            Crew Monitored
          </h3>
          <span className="text-[10px] font-mono text-space-500">
            {astronauts.length} Active
          </span>
        </div>
        <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
          {astronauts.length > 0 ? (
            astronauts.map((astro) => {
              const isSelected = selectedAstronautId === astro.id;
              return (
                <button
                  key={astro.id}
                  onClick={() => onSelectAstronaut(astro.id)}
                  aria-label={`Select astronaut ${astro.name}`}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs font-mono transition-colors ${
                    isSelected
                      ? 'bg-space-800 text-telemetry-cyan border border-telemetry-cyan/30'
                      : 'text-space-300 hover:bg-space-850 hover:text-space-100 border border-transparent'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-semibold truncate">{astro.name}</div>
                    <div className="text-[10px] text-space-400 truncate">
                      {astro.mission_name} • D+{astro.mission_day}
                    </div>
                  </div>
                  {isSelected && (
                    <UserCheck className="h-3.5 w-3.5 text-telemetry-cyan shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-2 text-center text-xs font-mono text-space-500">
              No crew loaded
            </div>
          )}
        </div>
      </div>

      {/* Non-Anatomical Channels Trigger */}
      {onOpenNonAnatomical && (
        <div className="pt-2 border-t border-space-800">
          <button
            onClick={onOpenNonAnatomical}
            aria-label="Open Non-Anatomical Habitat Telemetry"
            className="w-full flex items-center justify-between px-2.5 py-2 rounded bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-xs font-mono text-purple-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-purple-400" />
              <span>Habitat &amp; Radiation</span>
            </div>
            <span className="text-[9px] font-mono uppercase bg-purple-900/50 px-1.5 py-0.2 rounded border border-purple-500/40">
              ECLSS
            </span>
          </button>
        </div>
      )}

      {/* Dynamic Telemetry Channels Selector */}
      <div className="border-t border-space-700/60 pt-4">
        <div className="flex items-center justify-between px-2 pb-2">
          <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-space-400">
            Active Telemetry Channels
          </h3>
          <span className="font-mono text-[10px] text-space-500">
            {availableMetrics.length}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
          {availableMetrics.length > 0 ? (
            availableMetrics.map((metricKey) => {
              const meta = getMetricMeta(metricKey);
              const isMetricActive = selectedMetric === metricKey;
              return (
                <button
                  key={metricKey}
                  onClick={() => {
                    onSelectMetric(metricKey as MeasurementType);
                    if (activeTab === 'roster') onTabChange('telemetry');
                  }}
                  aria-label={`Select metric ${meta.label}`}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded font-mono text-xs border transition-colors ${
                    isMetricActive
                      ? 'bg-space-800 text-space-100 border-telemetry-cyan/40 font-medium'
                      : 'bg-space-850/40 text-space-400 border-space-700/40 hover:bg-space-800/40 hover:text-space-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="truncate">{meta.label}</span>
                  </div>
                  <span className="text-[10px] text-space-500 shrink-0">
                    {meta.unit}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="col-span-2 lg:col-span-1 p-2 text-center text-[11px] font-mono text-space-500">
              No telemetry loaded
            </div>
          )}
        </div>
      </div>

      {/* Protocol Notice Footer */}
      <div className="pt-2 border-t border-space-800/80 text-[10px] font-mono text-space-500 mt-auto">
        <div className="flex items-center justify-between">
          <span>COSMOLOOKUP OS</span>
          <span className="text-telemetry-emerald">v1.0-INTEL</span>
        </div>
        <div className="text-[9px] text-space-400 mt-0.5">
          NASA Space Apps 2026
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
