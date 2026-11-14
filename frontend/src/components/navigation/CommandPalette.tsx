import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Users,
  Activity,
  Layers,
  TrendingUp,
  Brain,
  Bell,
  Calendar,
  BookOpen,
  FileText,
  RefreshCw,
  X,
  ArrowRight,
} from 'lucide-react';
import { ActiveTab } from '../layout/Sidebar';
import { Astronaut } from '../../types/astronaut';
import { MeasurementType } from '../../types/measurement';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  astronauts: Astronaut[];
  selectedAstronautId: string | null;
  onSelectAstronaut: (id: string) => void;
  onNavigateToTab: (tab: ActiveTab) => void;
  availableMetrics: string[];
  selectedMetric: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  onOpenReportModal: () => void;
  onRunAssessment: () => void;
}

interface CommandItem {
  id: string;
  category: 'Views' | 'Crew' | 'Metrics' | 'Actions';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  astronauts,
  selectedAstronautId,
  onSelectAstronaut,
  onNavigateToTab,
  availableMetrics,
  selectedMetric,
  onSelectMetric,
  onOpenReportModal,
  onRunAssessment,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global key listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build command items
  const allCommands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];

    // Views
    const views: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
      { id: 'dashboard', label: 'Mission Overview', icon: <Activity className="h-4 w-4 text-telemetry-cyan" /> },
      { id: 'intelligence', label: 'Mission Intelligence Center', icon: <Brain className="h-4 w-4 text-purple-400" /> },
      { id: 'trends', label: 'Trend Observatory', icon: <TrendingUp className="h-4 w-4 text-emerald-400" /> },
      { id: 'alerts', label: 'Alert Command Desk', icon: <Bell className="h-4 w-4 text-rose-400" /> },
      { id: 'assessments', label: 'Explainable Assessment Workspace', icon: <Brain className="h-4 w-4 text-purple-400" /> },
      { id: 'timeline', label: 'Reconstructed Mission Timeline', icon: <Calendar className="h-4 w-4 text-sky-400" /> },
      { id: 'telemetry', label: 'Telemetry Stream', icon: <Activity className="h-4 w-4 text-telemetry-cyan" /> },
      { id: 'anatomy', label: '3D Anatomy Map', icon: <Layers className="h-4 w-4 text-telemetry-cyan" /> },
      { id: 'baselines', label: 'Personal Baselines', icon: <TrendingUp className="h-4 w-4 text-emerald-400" /> },
      { id: 'catalog', label: 'Measurement Catalog', icon: <BookOpen className="h-4 w-4 text-sky-400" /> },
      { id: 'roster', label: 'Crew Directory', icon: <Users className="h-4 w-4 text-space-300" /> },
    ];

    views.forEach((v) => {
      list.push({
        id: `view-${v.id}`,
        category: 'Views',
        title: `Navigate to ${v.label}`,
        subtitle: `Operational View`,
        icon: v.icon,
        action: () => {
          onNavigateToTab(v.id);
          onClose();
        },
      });
    });

    // Actions
    list.push({
      id: 'action-report',
      category: 'Actions',
      title: 'Generate Crew Evidence Report',
      subtitle: 'Compile comprehensive Markdown & printable intelligence dossier',
      icon: <FileText className="h-4 w-4 text-sky-400" />,
      action: () => {
        onOpenReportModal();
        onClose();
      },
    });

    list.push({
      id: 'action-assess',
      category: 'Actions',
      title: 'Synthesize Health Assessment',
      subtitle: 'Trigger intra-individual deterministic clinical decision support',
      icon: <RefreshCw className="h-4 w-4 text-purple-400" />,
      action: () => {
        onRunAssessment();
        onClose();
      },
    });

    // Crew
    astronauts.forEach((a) => {
      const isSelected = selectedAstronautId === a.id;
      list.push({
        id: `astro-${a.id}`,
        category: 'Crew',
        title: `Select Astronaut: ${a.name}${isSelected ? ' (Current)' : ''}`,
        subtitle: `${a.mission_name} • D+${a.mission_day} • ${a.crew_role}`,
        icon: <Users className="h-4 w-4 text-space-300" />,
        action: () => {
          onSelectAstronaut(a.id);
          onClose();
        },
      });
    });

    // Metrics
    availableMetrics.forEach((m) => {
      const isSelected = selectedMetric === m;
      list.push({
        id: `metric-${m}`,
        category: 'Metrics',
        title: `Focus Metric: ${m.replace(/_/g, ' ').toUpperCase()}${isSelected ? ' (Active)' : ''}`,
        subtitle: `Switch active metric inspection`,
        icon: <Activity className="h-4 w-4 text-telemetry-cyan" />,
        action: () => {
          onSelectMetric(m as MeasurementType);
          onNavigateToTab('telemetry');
          onClose();
        },
      });
    });

    return list;
  }, [astronauts, availableMetrics, onNavigateToTab, onOpenReportModal, onRunAssessment, onSelectAstronaut, onSelectMetric, onClose]);

  // Filter based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );
  }, [allCommands, query]);

  // Key navigation (Up, Down, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-space-950/80 backdrop-blur-sm animate-fade-in">
      <div className="rounded-xl bg-space-900 border border-space-700 max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-space-750 bg-space-850">
          <Search className="h-5 w-5 text-telemetry-cyan shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, crew member, metric, or view (e.g. 'Sarah', 'heart', 'timeline')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm font-mono text-space-100 placeholder-space-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-space-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="overflow-y-auto p-2 space-y-1">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-space-800 text-telemetry-cyan border border-telemetry-cyan/40'
                      : 'text-space-300 hover:bg-space-850 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="shrink-0">{cmd.icon}</div>
                    <div className="truncate">
                      <div className="font-semibold text-space-100 truncate">{cmd.title}</div>
                      {cmd.subtitle && (
                        <div className="text-[10px] text-space-400 truncate">{cmd.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-space-800 text-space-400 border border-space-700">
                      {cmd.category}
                    </span>
                    <ArrowRight className="h-3 w-3 text-space-500" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs font-mono text-space-400">
              No matching commands or navigation routes found.
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 border-t border-space-800 bg-space-850/80 flex items-center justify-between text-[10px] font-mono text-space-500">
          <span>Navigate with ↑ and ↓</span>
          <span>Select with ↵ Enter</span>
          <span>Close with Esc</span>
        </div>
      </div>
    </div>
  );
};
export default CommandPalette;
