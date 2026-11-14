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
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { MeasurementType } from '../../types/measurement';

export type ActiveTab = 'dashboard' | 'roster' | 'telemetry' | 'anatomy';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  astronauts: Astronaut[];
  selectedAstronautId: string | null;
  onSelectAstronaut: (id: string) => void;
  selectedMetric: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  astronauts,
  selectedAstronautId,
  onSelectAstronaut,
  selectedMetric,
  onSelectMetric,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
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
    <aside className="w-full lg:w-64 shrink-0 border-r border-space-700/80 bg-space-900/60 p-3 lg:p-4 flex flex-col gap-5 overflow-y-auto">
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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md font-mono text-xs transition-colors ${
                  isActive
                    ? 'bg-telemetry-cyan/15 text-telemetry-cyan border border-telemetry-cyan/40 font-semibold shadow-sm'
                    : 'text-space-300 hover:text-space-100 hover:bg-space-800/60 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
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
          <span className="font-mono text-[10px] text-space-500">
            {astronauts.length} CREW
          </span>
        </div>
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
          {astronauts.map((astro) => {
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
          })}
        </div>
      </div>

      {/* Telemetry Metric Fast Selector */}
      <div className="border-t border-space-700/60 pt-4">
        <h3 className="px-2 pb-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-space-400">
          Telemetry Channels
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
          {metrics.map((m) => {
            const isMetricActive = selectedMetric === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onSelectMetric(m.id);
                  if (activeTab === 'roster') onTabChange('telemetry');
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded font-mono text-xs border transition-colors ${
                  isMetricActive
                    ? 'bg-space-800 text-space-100 border-telemetry-cyan/40 font-medium'
                    : 'bg-space-850/40 text-space-400 border-space-700/40 hover:bg-space-800/40 hover:text-space-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {m.icon}
                  <span className="truncate">{m.label}</span>
                </div>
                <span className="text-[10px] text-space-500 shrink-0">
                  {m.unit}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
