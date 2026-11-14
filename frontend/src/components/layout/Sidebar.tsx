import React from 'react';
import {
  LayoutDashboard,
  Users,
  LineChart,
  UserCheck,
  Activity,
  TrendingUp,
  BookOpen,
  Brain,
  Bell,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { MeasurementType } from '../../types/measurement';
import { getMetricMeta } from '../../utils/formatters';

export type ActiveTab =
  | 'dashboard'
  | 'roster'
  | 'telemetry'
  | 'baselines'
  | 'catalog'
  | 'intelligence'
  | 'alerts'
  | 'anatomy';

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
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Mission Overview',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'intelligence',
      label: 'Health Intelligence',
      icon: <Brain className="h-4 w-4" />,
    },
    {
      id: 'alerts',
      label: 'Alerts Hub',
      icon: <Bell className="h-4 w-4" />,
      badge: activeAlertsCount > 0 ? (
        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-telemetry-rose text-space-950 animate-pulse">
          {activeAlertsCount}
        </span>
      ) : undefined,
    },
    {
      id: 'telemetry',
      label: 'Telemetry Explorer',
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      id: 'baselines',
      label: 'Personal Baselines',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      id: 'catalog',
      label: 'Measurement Catalog',
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: 'anatomy',
      label: '3D Anatomy Map',
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: 'roster',
      label: 'Astronaut Roster',
      icon: <Users className="h-4 w-4" />,
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 border-r border-space-700/80 bg-space-900/60 p-3 lg:p-4 flex flex-col gap-5 overflow-y-auto">
      {/* Primary Navigation */}
      <div>
        <h3 className="px-2 pb-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-space-400">
          Navigation
        </h3>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded font-mono text-xs transition-colors text-left ${
                  isActive
                    ? 'bg-space-800 text-telemetry-cyan font-bold border-l-2 border-telemetry-cyan shadow-hud-sm'
                    : 'text-space-300 hover:bg-space-850 hover:text-space-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Crew Selection Section */}
      <div className="border-t border-space-700/60 pt-4">
        <div className="flex items-center justify-between px-2 pb-2">
          <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-space-400">
            Crew Selection
          </h3>
          <span className="text-[10px] font-mono text-space-500">
            {astronauts.length} Active
          </span>
        </div>
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
          {astronauts.length > 0 ? (
            astronauts.map((astro) => {
              const isSelected = selectedAstronautId === astro.id;
              return (
                <button
                  key={astro.id}
                  onClick={() => onSelectAstronaut(astro.id)}
                  className={`text-left p-2 rounded border transition-all ${
                    isSelected
                      ? 'bg-space-800 border-telemetry-cyan/60 text-space-100 shadow-sm'
                      : 'bg-space-850/60 border-space-700/50 text-space-300 hover:bg-space-800/50 hover:text-space-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold truncate">
                      {astro.name}
                    </span>
                    {isSelected && (
                      <UserCheck className="h-3 w-3 text-telemetry-cyan shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-space-400">
                    <span className="truncate max-w-[110px]">{astro.mission_name}</span>
                    <span className="text-space-500">D+{astro.mission_day}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs font-mono text-space-500 border border-dashed border-space-800 rounded">
              No crew available
            </div>
          )}
        </div>
      </div>

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
                    onSelectMetric(metricKey);
                    if (activeTab === 'roster') onTabChange('telemetry');
                  }}
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
      <div className="pt-3 border-t border-space-800/80 text-[10px] font-mono text-space-500 mt-auto">
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
