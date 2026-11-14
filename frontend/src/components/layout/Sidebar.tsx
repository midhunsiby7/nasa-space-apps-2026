import React from 'react';
import {
  LayoutDashboard,
  Users,
  LineChart,
  UserCheck,
  Activity,
  Heart,
  Droplet,
  Thermometer,
  Zap,
  Brain,
  Bell,
  Radio,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { MeasurementType } from '../../types/measurement';

export type ActiveTab = 'dashboard' | 'roster' | 'telemetry' | 'intelligence' | 'alerts' | 'anatomy';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  astronauts: Astronaut[];
  selectedAstronautId: string | null;
  onSelectAstronaut: (id: string) => void;
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
  selectedMetric,
  onSelectMetric,
  activeAlertsCount = 0,
  onOpenNonAnatomical,
}) => {
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
  }[] = [
    {
      id: 'dashboard',
      label: 'Mission Overview',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'roster',
      label: 'Astronaut Roster',
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'telemetry',
      label: 'Telemetry Stream',
      icon: <LineChart className="h-4 w-4" />,
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
        <span className="ml-auto inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-telemetry-rose text-space-950 animate-pulse">
          {activeAlertsCount}
        </span>
      ) : undefined,
    },
    {
      id: 'anatomy',
      label: '3D Anatomy Map',
      icon: <Activity className="h-4 w-4" />,
    },
  ];

  const metrics: { id: MeasurementType; label: string; unit: string; icon: React.ReactNode }[] = [
    {
      id: 'heart_rate',
      label: 'Heart Rate',
      unit: 'bpm',
      icon: <Heart className="h-3.5 w-3.5 text-rose-400" />,
    },
    {
      id: 'blood_oxygen',
      label: 'SpO2 Oxygen',
      unit: '%',
      icon: <Droplet className="h-3.5 w-3.5 text-sky-400" />,
    },
    {
      id: 'core_temperature',
      label: 'Core Temp',
      unit: '°C',
      icon: <Thermometer className="h-3.5 w-3.5 text-amber-400" />,
    },
    {
      id: 'radiation_dose',
      label: 'Radiation Flux',
      unit: 'mSv',
      icon: <Zap className="h-3.5 w-3.5 text-purple-400" />,
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 border-r border-space-700/80 bg-space-900/60 p-3 lg:p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Primary Navigation */}
      <div>
        <h3 className="px-2 pb-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-space-400">
          Navigation Modules
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
                    ? 'bg-telemetry-cyan/15 text-telemetry-cyan border border-telemetry-cyan/40 font-semibold shadow-sm'
                    : 'text-space-300 hover:text-space-100 hover:bg-space-800/60 border border-transparent'
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

      {/* Quick Astronaut Roster Selector */}
      <div className="flex-1">
        <div className="flex items-center justify-between px-2 pb-2">
          <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-space-400">
            Crew Selection
          </h3>
          <span className="text-[10px] font-mono text-space-500">
            {astronauts.length} Active
          </span>
        </div>
        <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
          {astronauts.map((astro) => {
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
                {isSelected && <UserCheck className="h-3.5 w-3.5 text-telemetry-cyan shrink-0" />}
              </button>
            );
          })}
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

      {/* Metric Quick-Switcher (Only for Telemetry & Anatomy) */}
      {(activeTab === 'telemetry' || activeTab === 'anatomy') && (
        <div className="pt-2 border-t border-space-800">
          <h3 className="px-2 pb-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-space-400">
            Target Parameter
          </h3>
          <div className="grid grid-cols-1 gap-1">
            {metrics.map((m) => {
              const isSelected = selectedMetric === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMetric(m.id)}
                  aria-label={`Select metric ${m.label}`}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                    isSelected
                      ? 'bg-space-800 text-space-100 border border-telemetry-cyan/50 font-semibold'
                      : 'text-space-400 hover:bg-space-850 hover:text-space-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {m.icon}
                    <span>{m.label}</span>
                  </div>
                  <span className="text-[10px] text-space-500 font-mono">{m.unit}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Protocol Notice Footer */}
      <div className="pt-2 border-t border-space-800/80 text-[10px] font-mono text-space-500">
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
