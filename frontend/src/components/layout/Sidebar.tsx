import React from 'react';
import {
  Users,
  LineChart,
  Activity,
  TrendingUp,
  BookOpen,
  Brain,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { MeasurementType } from '../../types/measurement';

export type ActiveTab =
  | 'dashboard'
  | 'roster'
  | 'telemetry'
  | 'anatomy'
  | 'baselines'
  | 'catalog'
  | 'intelligence'
  | 'trends'
  | 'alerts'
  | 'assessments'
  | 'timeline'
  | 'research';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  astronauts?: Astronaut[];
  selectedAstronautId?: string | null;
  onSelectAstronaut?: (id: string) => void;
  availableMetrics?: string[];
  selectedMetric?: MeasurementType;
  onSelectMetric?: (metric: MeasurementType) => void;
  onOpenNonAnatomical?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    {
      id: 'anatomy',
      label: '3D Anatomy Map',
      icon: <Layers className="h-4 w-4 text-telemetry-cyan" />,
      badge: (
        <span className="rounded bg-telemetry-cyan/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-telemetry-cyan border border-telemetry-cyan/40">
          3D
        </span>
      ),
    },
    {
      id: 'telemetry',
      label: 'Telemetry Stream',
      icon: <LineChart className="h-4 w-4 text-telemetry-cyan" />,
    },
    {
      id: 'intelligence',
      label: 'Mission Intelligence',
      icon: <Brain className="h-4 w-4 text-purple-400" />,
      badge: (
        <span className="rounded bg-purple-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-purple-400 border border-purple-500/30">
          INTEL
        </span>
      ),
    },
    {
      id: 'trends',
      label: 'Trend Observatory',
      icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
      badge: (
        <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
          24h
        </span>
      ),
    },
    {
      id: 'assessments',
      label: 'Assessment Workspace',
      icon: <Sparkles className="h-4 w-4 text-purple-300" />,
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
      id: 'timeline',
      label: 'Mission Timeline',
      icon: <Calendar className="h-4 w-4 text-sky-400" />,
    },
    {
      id: 'roster',
      label: 'Crew Directory',
      icon: <Users className="h-4 w-4 text-space-300" />,
    },
    {
      id: 'dashboard',
      label: 'Mission Overview',
      icon: <Activity className="h-4 w-4 text-space-300" />,
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 border-r border-slate-200 bg-white p-3 lg:p-4 flex flex-col gap-5 overflow-y-auto">
      {/* Primary Navigation Tabs */}
      <div>
        <h3 className="px-2 pb-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
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
                    ? 'bg-sky-50 text-telemetry-cyan font-bold border-l-2 border-telemetry-cyan shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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

      {/* Protocol Notice Footer */}
      <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-400 mt-auto">
        <div className="flex items-center justify-between">
          <span>COSMOLOOKUP OS</span>
          <span className="text-telemetry-emerald font-semibold">v1.0-INTEL</span>
        </div>
        <div className="text-[9px] text-slate-400 mt-0.5">
          NASA Space Apps 2026
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
