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
import { ConnectionState, ApiError } from './types/api';
import { apiClient } from './services/apiClient';

export const App: React.FC = () => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core Data State
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [totalAstronauts, setTotalAstronauts] = useState<number>(0);
  const [selectedAstronautId, setSelectedAstronautId] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [totalMeasurements, setTotalMeasurements] = useState<number>(0);
  const [selectedMetric, setSelectedMetric] = useState<MeasurementType>('heart_rate');
  const [timeFilter, setTimeFilter] = useState<'all' | '8h' | '24h'>('all');

  // UI / Status State
  const [isLoadingAstronauts, setIsLoadingAstronauts] = useState<boolean>(true);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState<boolean>(false);
  const [astronautsError, setAstronautsError] = useState<ApiError | null>(null);
  const [measurementsError, setMeasurementsError] = useState<ApiError | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(apiClient.isDemoMode());

  // Modals
  const [profileModalAstronaut, setProfileModalAstronaut] = useState<Astronaut | null>(null);
  const [isProvenanceModalOpen, setIsProvenanceModalOpen] = useState<boolean>(false);

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = apiClient.subscribeConnectionState((state) => {
      setConnectionState(state);
      setIsDemoMode(apiClient.isDemoMode());
    });
    return unsubscribe;
  }, []);

  // Initial health check & data fetch
  const initialize = useCallback(async () => {
    await apiClient.checkHealth();
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Fetch Astronauts List
  const fetchAstronauts = useCallback(async () => {
    setIsLoadingAstronauts(true);
    setAstronautsError(null);
    try {
      const response = await apiClient.getAstronauts({ limit: 100 });
      setAstronauts(response.data);
      setTotalAstronauts(response.total);

      // Default select the first astronaut if none selected
      if (response.data.length > 0 && !selectedAstronautId) {
        setSelectedAstronautId(response.data[0].id);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setAstronautsError(err);
      } else {
        setAstronautsError(new ApiError(err?.message || 'Unknown network error', 'UNKNOWN_ERROR', 0));
      }
    } finally {
      setIsLoadingAstronauts(false);
    }
  }, [selectedAstronautId]);

  useEffect(() => {
    fetchAstronauts();
  }, [fetchAstronauts, isDemoMode]);

  // Fetch Measurements for Selected Astronaut
  const fetchMeasurements = useCallback(async (astronautId: string) => {
    setIsLoadingMeasurements(true);
    setMeasurementsError(null);
    try {
      const response = await apiClient.getMeasurements(astronautId, { limit: 1000 });
      setMeasurements(response.data);
      setTotalMeasurements(response.total);

      // Check if selectedMetric is in the fetched data; if not, select the first available
      const types = Array.from(new Set(response.data.map((m) => m.measurement_type)));
      if (types.length > 0 && !types.includes(selectedMetric)) {
        setSelectedMetric(types[0]);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setMeasurementsError(err);
      } else {
        setMeasurementsError(new ApiError(err?.message || 'Failed to retrieve telemetry', 'MEASUREMENT_FETCH_ERROR', 0));
      }
    } finally {
      setIsLoadingMeasurements(false);
    }
  }, [selectedMetric]);

  useEffect(() => {
    if (selectedAstronautId) {
      fetchMeasurements(selectedAstronautId);
    }
  }, [selectedAstronautId, fetchMeasurements, isDemoMode]);

  // Dynamically derive available metrics from loaded measurements
  const availableMetrics = useMemo(() => {
    const types = Array.from(new Set(measurements.map((m) => m.measurement_type)));
    // Sort in consistent logical order: heart_rate, spo2, body_temperature, respiratory_rate, etc.
    const priority = [
      'heart_rate',
      'spo2',
      'body_temperature',
      'respiratory_rate',
      'blood_pressure_systolic',
      'blood_pressure_diastolic',
      'sleep_duration',
    ];

    types.sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return types;
  }, [measurements]);

  // Selected astronaut record
  const selectedAstronaut = useMemo(() => {
    return astronauts.find((a) => a.id === selectedAstronautId) || null;
  }, [astronauts, selectedAstronautId]);

  // Latest measurements grouped by type for quick banner
  const latestMeasurementsMap = useMemo(() => {
    const map: Record<string, Measurement> = {};
    measurements.forEach((m) => {
      if (!map[m.measurement_type] || new Date(m.measured_at) > new Date(map[m.measurement_type].measured_at)) {
        map[m.measurement_type] = m;
      }
    });
    return map;
  }, [measurements]);

  // Dynamic time filtering without hardcoded dates
  const filteredMeasurements = useMemo(() => {
    if (timeFilter === 'all' || measurements.length === 0) return measurements;

    // Anchor the time window against the most recent measurement timestamp in the dataset
    const timestamps = measurements.map((m) => new Date(m.measured_at).getTime()).filter((t) => !isNaN(t));
    if (timestamps.length === 0) return measurements;

    const maxTime = Math.max(...timestamps);
    const hours = timeFilter === '8h' ? 8 : 24;
    const threshold = maxTime - hours * 60 * 60 * 1000;

    return measurements.filter((m) => {
      const t = new Date(m.measured_at).getTime();
      return !isNaN(t) && t >= threshold;
    });
  }, [measurements, timeFilter]);

  const handleToggleDemoMode = () => {
    const nextState = !apiClient.isDemoMode();
    apiClient.setDemoMode(nextState);
    setIsDemoMode(nextState);
  };

  const handleRetryConnection = async () => {
    await apiClient.checkHealth();
    fetchAstronauts();
    if (selectedAstronautId) {
      fetchMeasurements(selectedAstronautId);
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      astronauts={astronauts}
      selectedAstronautId={selectedAstronautId}
      onSelectAstronaut={(id) => setSelectedAstronautId(id)}
      availableMetrics={availableMetrics}
      selectedMetric={selectedMetric}
      onSelectMetric={setSelectedMetric}
      connectionState={connectionState}
      onOpenProvenanceGuide={() => setIsProvenanceModalOpen(true)}
      onRetryConnection={handleRetryConnection}
      onToggleDemoMode={handleToggleDemoMode}
      isDemoMode={isDemoMode}
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

        {/* Global Loading for Astronauts */}
        {isLoadingAstronauts && (
          <LoadingSpinner label="Querying COSMOLOOKUP Spaceflight Roster..." size="lg" />
        )}

        {/* Global Error for Astronauts with distinction between Network and 404/400 */}
        {astronautsError && !isLoadingAstronauts && (
          <ErrorMessage
            title={`Error [${astronautsError.code}]`}
            message={astronautsError.message}
            details={astronautsError.details ? JSON.stringify(astronautsError.details, null, 2) : undefined}
            onRetry={handleRetryConnection}
          />
        )}

        {/* Main Content Router based on Active Tab */}
        {!isLoadingAstronauts && !astronautsError && (
          <>
            {activeTab === 'dashboard' && (
              <MissionOverview
                astronauts={astronauts}
                totalAstronauts={totalAstronauts}
                measurements={measurements}
                totalMeasurements={totalMeasurements}
                selectedAstronaut={selectedAstronaut}
                connectionState={connectionState}
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
                  <LoadingSpinner label="Retrieving Astronaut Telemetry Records..." size="lg" />
                ) : measurementsError ? (
                  <ErrorMessage
                    title={`Telemetry Error [${measurementsError.code}]`}
                    message={measurementsError.message}
                    details={measurementsError.details ? JSON.stringify(measurementsError.details, null, 2) : undefined}
                    onRetry={() => selectedAstronautId && fetchMeasurements(selectedAstronautId)}
                  />
                ) : (
                  <TelemetryStreamSection
                    astronaut={selectedAstronaut}
                    measurements={filteredMeasurements}
                    availableMetrics={availableMetrics}
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
