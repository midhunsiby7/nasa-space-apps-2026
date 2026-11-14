import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from './components/layout/Layout';
import { ActiveTab } from './components/layout/Sidebar';
import { MissionOverview } from './components/dashboard/MissionOverview';
import { SelectedAstronautBanner } from './components/dashboard/SelectedAstronautBanner';
import { ProvenanceNotice } from './components/dashboard/ProvenanceNotice';
import { AstronautDirectory } from './components/astronaut/AstronautDirectory';
import { AstronautProfileModal } from './components/astronaut/AstronautProfileModal';
import { TelemetryStreamSection } from './components/telemetry/TelemetryStreamSection';
import { AnatomyViewport } from './components/anatomy/AnatomyViewport';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorMessage } from './components/common/ErrorMessage';
import { Astronaut } from './types/astronaut';
import { Measurement, MeasurementType } from './types/measurement';
import { ConnectionState } from './types/api';
import { apiClient } from './services/apiClient';

export const App: React.FC = () => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core Data State
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [selectedAstronautId, setSelectedAstronautId] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MeasurementType>('heart_rate');
  const [timeFilter, setTimeFilter] = useState<'all' | '8h' | '24h'>('all');

  // UI / Status State
  const [isLoadingAstronauts, setIsLoadingAstronauts] = useState<boolean>(true);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState<boolean>(false);
  const [astronautsError, setAstronautsError] = useState<string | null>(null);
  const [measurementsError, setMeasurementsError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');

  // Modals
  const [profileModalAstronaut, setProfileModalAstronaut] = useState<Astronaut | null>(null);
  const [isProvenanceModalOpen, setIsProvenanceModalOpen] = useState<boolean>(false);

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = apiClient.subscribeConnectionState((state) => {
      setConnectionState(state);
    });
    return unsubscribe;
  }, []);

  // Fetch Astronauts List
  const fetchAstronauts = useCallback(async () => {
    setIsLoadingAstronauts(true);
    setAstronautsError(null);
    try {
      const response = await apiClient.getAstronauts({ limit: 100 });
      setAstronauts(response.data);
      if (response.data.length > 0 && !selectedAstronautId) {
        setSelectedAstronautId(response.data[0].id);
      }
    } catch (err: any) {
      setAstronautsError(err?.message || 'Failed to retrieve astronaut records from backend API.');
    } finally {
      setIsLoadingAstronauts(false);
    }
  }, [selectedAstronautId]);

  useEffect(() => {
    fetchAstronauts();
  }, [fetchAstronauts]);

  // Fetch Measurements for Selected Astronaut
  const fetchMeasurements = useCallback(async (astronautId: string) => {
    setIsLoadingMeasurements(true);
    setMeasurementsError(null);
    try {
      const response = await apiClient.getMeasurements(astronautId, { limit: 1000 });
      setMeasurements(response.data);
    } catch (err: any) {
      setMeasurementsError(err?.message || `Failed to retrieve telemetry for astronaut ${astronautId}.`);
    } finally {
      setIsLoadingMeasurements(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAstronautId) {
      fetchMeasurements(selectedAstronautId);
    }
  }, [selectedAstronautId, fetchMeasurements]);

  // Selected astronaut record
  const selectedAstronaut = useMemo(() => {
    return astronauts.find((a) => a.id === selectedAstronautId) || null;
  }, [astronauts, selectedAstronautId]);

  // Latest measurements grouped by type for banner
  const latestMeasurementsMap = useMemo(() => {
    const map: Record<string, Measurement> = {};
    measurements.forEach((m) => {
      if (!map[m.measurement_type] || new Date(m.measured_at) > new Date(map[m.measurement_type].measured_at)) {
        map[m.measurement_type] = m;
      }
    });
    return map;
  }, [measurements]);

  // Filter measurements based on timeFilter
  const filteredMeasurements = useMemo(() => {
    if (timeFilter === 'all') return measurements;

    const hours = timeFilter === '8h' ? 8 : 24;
    const now = new Date('2026-11-14T08:00:00Z').getTime(); // Reference point aligned with demo timestamps
    const threshold = now - hours * 60 * 60 * 1000;

    return measurements.filter((m) => new Date(m.measured_at).getTime() >= threshold);
  }, [measurements, timeFilter]);

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      astronauts={astronauts}
      selectedAstronautId={selectedAstronautId}
      onSelectAstronaut={(id) => setSelectedAstronautId(id)}
      selectedMetric={selectedMetric}
      onSelectMetric={setSelectedMetric}
      connectionState={connectionState}
      onOpenProvenanceGuide={() => setIsProvenanceModalOpen(true)}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Selected Astronaut Status Banner (shown on Telemetry and Anatomy views) */}
        {selectedAstronaut && activeTab !== 'roster' && (
          <SelectedAstronautBanner
            astronaut={selectedAstronaut}
            latestMeasurements={latestMeasurementsMap}
            onOpenDetails={() => setProfileModalAstronaut(selectedAstronaut)}
          />
        )}

        {/* Global Loading / Error for Astronauts */}
        {isLoadingAstronauts && (
          <LoadingSpinner label="Querying COSMOLOOKUP Spaceflight Roster..." size="lg" />
        )}

        {astronautsError && (
          <ErrorMessage
            title="Astronaut Directory Query Failure"
            message={astronautsError}
            onRetry={fetchAstronauts}
          />
        )}

        {/* Main Content Router based on Active Tab */}
        {!isLoadingAstronauts && (
          <>
            {activeTab === 'dashboard' && (
              <MissionOverview
                astronauts={astronauts}
                measurements={measurements}
                selectedAstronaut={selectedAstronaut}
                onExploreRoster={() => setActiveTab('roster')}
                onViewTelemetry={() => setActiveTab('telemetry')}
                onOpenAnatomy={() => setActiveTab('anatomy')}
              />
            )}

            {activeTab === 'roster' && (
              <AstronautDirectory
                astronauts={astronauts}
                selectedAstronautId={selectedAstronautId}
                onSelectAstronaut={(id) => {
                  setSelectedAstronautId(id);
                  setActiveTab('telemetry');
                }}
                onOpenDetails={(astro) => setProfileModalAstronaut(astro)}
              />
            )}

            {activeTab === 'telemetry' && (
              <>
                {isLoadingMeasurements ? (
                  <LoadingSpinner label="Streaming Astronaut Telemetry Sensors..." size="lg" />
                ) : measurementsError ? (
                  <ErrorMessage
                    title="Telemetry Stream Error"
                    message={measurementsError}
                    onRetry={() => selectedAstronautId && fetchMeasurements(selectedAstronautId)}
                  />
                ) : (
                  <TelemetryStreamSection
                    astronaut={selectedAstronaut}
                    measurements={filteredMeasurements}
                    selectedMetric={selectedMetric}
                    onSelectMetric={setSelectedMetric}
                    timeFilter={timeFilter}
                    onTimeFilterChange={setTimeFilter}
                  />
                )}
              </>
            )}

            {activeTab === 'anatomy' && (
              <AnatomyViewport
                astronaut={selectedAstronaut}
                measurements={measurements}
                selectedMetric={selectedMetric}
                onSelectMetric={setSelectedMetric}
                onSwitchToChart={() => setActiveTab('telemetry')}
              />
            )}
          </>
        )}
      </div>

      {/* Astronaut Profile Specification Modal */}
      <AstronautProfileModal
        astronaut={profileModalAstronaut}
        measurements={measurements}
        isOpen={!!profileModalAstronaut}
        onClose={() => setProfileModalAstronaut(null)}
        onSelectForMonitoring={(id) => {
          setSelectedAstronautId(id);
          setActiveTab('telemetry');
        }}
      />

      {/* Data Provenance & Scientific Integrity Standard Modal */}
      <ProvenanceNotice
        isOpen={isProvenanceModalOpen}
        onClose={() => setIsProvenanceModalOpen(false)}
      />
    </Layout>
  );
};

export default App;
