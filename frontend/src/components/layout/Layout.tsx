import React from 'react';
import { Header } from './Header';
import { Sidebar, ActiveTab } from './Sidebar';
import { Astronaut } from '../../types/astronaut';
import { MeasurementType } from '../../types/measurement';
import { ConnectionState } from '../../types/api';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  astronauts: Astronaut[];
  selectedAstronautId: string | null;
  onSelectAstronaut: (id: string) => void;
  availableMetrics: string[];
  selectedMetric: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  connectionState: ConnectionState;
  onOpenProvenanceGuide: () => void;
  onRetryConnection: () => void;
  onToggleDemoMode: () => void;
  isDemoMode: boolean;
  activeAlertsCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  astronauts,
  selectedAstronautId,
  onSelectAstronaut,
  availableMetrics,
  selectedMetric,
  onSelectMetric,
  connectionState,
  onOpenProvenanceGuide,
  onRetryConnection,
  onToggleDemoMode,
  isDemoMode,
  activeAlertsCount = 0,
}) => {
  return (
    <div className="flex min-h-screen flex-col bg-space-950 text-space-100">
      <Header
        connectionState={connectionState}
        onOpenProvenanceGuide={onOpenProvenanceGuide}
        onRetryConnection={onRetryConnection}
        onToggleDemoMode={onToggleDemoMode}
        isDemoMode={isDemoMode}
      />
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          astronauts={astronauts}
          selectedAstronautId={selectedAstronautId}
          onSelectAstronaut={onSelectAstronaut}
          availableMetrics={availableMetrics}
          selectedMetric={selectedMetric}
          onSelectMetric={onSelectMetric}
          activeAlertsCount={activeAlertsCount}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 telemetry-grid">
          {children}
        </main>
      </div>
    </div>
  );
};
