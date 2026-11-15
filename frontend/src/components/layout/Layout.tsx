import React from 'react';
import { Header, MainAppPage } from './Header';
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
  availableMetrics?: string[];
  selectedMetric: MeasurementType;
  onSelectMetric: (metric: MeasurementType) => void;
  connectionState: ConnectionState;
  onRetryConnection?: () => void;
  onToggleDemoMode?: () => void;
  isDemoMode?: boolean;
  onOpenNonAnatomical?: () => void;
  // Enhanced top-level navigation props
  currentPage?: MainAppPage;
  onNavigatePage?: (page: MainAppPage) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  astronauts,
  selectedAstronautId,
  onSelectAstronaut,
  availableMetrics = [],
  selectedMetric,
  onSelectMetric,
  connectionState,
  onRetryConnection,
  onToggleDemoMode,
  isDemoMode = false,
  onOpenNonAnatomical,
  currentPage = 'cockpit',
  onNavigatePage,
}) => {
  const isDedicatedPageView = currentPage === 'roster' || currentPage === 'intro';
  const showHeader = currentPage !== 'intro';

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      {/* Hide top horizontal navigation bar when on intro page */}
      {showHeader && (
        <Header
          connectionState={connectionState}
          onRetryConnection={onRetryConnection}
          onToggleDemoMode={onToggleDemoMode}
          isDemoMode={isDemoMode}
          currentPage={currentPage}
          onNavigatePage={onNavigatePage}
          astronauts={astronauts}
          selectedAstronautId={selectedAstronautId}
          onSelectAstronaut={onSelectAstronaut}
        />
      )}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-white">
        {/* Render operational sidebar in Cockpit mode only */}
        {!isDedicatedPageView && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={onTabChange}
            astronauts={astronauts}
            selectedAstronautId={selectedAstronautId}
            onSelectAstronaut={onSelectAstronaut}
            availableMetrics={availableMetrics}
            selectedMetric={selectedMetric}
            onSelectMetric={onSelectMetric}
            onOpenNonAnatomical={onOpenNonAnatomical}
          />
        )}
        <main
          className={`flex-1 overflow-y-auto telemetry-grid bg-white ${
            currentPage === 'intro'
              ? 'p-4 sm:p-6 lg:p-8 flex items-center justify-center'
              : isDedicatedPageView
              ? 'p-4 sm:p-6 lg:p-8'
              : 'p-4 lg:p-6'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
