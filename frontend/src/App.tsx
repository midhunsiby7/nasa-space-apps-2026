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
import { PersonalBaselinesView } from './components/baselines/PersonalBaselinesView';
import { MeasurementCatalogView } from './components/catalog/MeasurementCatalogView';
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

  // Fetch Astronauts List
  const fetchAstronauts = useCallback(async () => {
    setIsLoadingAstronauts(true);
    setAstronautsError(null);
    try {
      const response = await apiClient.getAstronauts({ limit: 50 });
      setAstronauts(response.data);
      setTotalAstronauts(response.total);

      // Auto-select first astronaut if none selected
      if (response.data.length > 0 && !selectedAstronautId) {
        setSelectedAstronautId(response.data[0].id);
      }
    } catch (err: any) {
      setAstronautsError(err);
    } finally {
      setIsLoadingAstronauts(false);
    }
  }, [selectedAstronautId]);

  // Initial Health Check & Astronaut Fetch
  useEffect(() => {
    const init = async () => {
      await apiClient.checkHealth();
      await fetchAstronauts();
    };
    init();
  }, [fetchAstronauts]);

  // Fetch Measurements when selected astronaut changes
  const fetchMeasurements = useCallback(async (astronautId: string) => {
    setIsLoadingMeasurements(true);
    setMeasurementsError(null);
    try {
      const response = await apiClient.getMeasurements(astronautId, { limit: 500 });
      setMeasurements(response.data);
      setTotalMeasurements(response.total);

      // Reconcile available metrics from actual data
      const metricsInDataset = Array.from(new Set(response.data.map((m) => m.measurement_type)));
      if (metricsInDataset.length > 0 && !metricsInDataset.includes(selectedMetric)) {
        setSelectedMetric(metricsInDataset[0]);
      }
    } catch (err: any) {
      setMeasurementsError(err);
      setMeasurements([]);
      setTotalMeasurements(0);
    } finally {
      setIsLoadingMeasurements(false);
    }
  }, [selectedMetric]);

  useEffect(() => {
    if (selectedAstronautId) {
      fetchMeasurements(selectedAstronautId);
    }
  }, [selectedAstronautId, fetchMeasurements]);

  // Selected astronaut object
  const selectedAstronaut = useMemo(() => {
    return astronauts.find((a) => a.id === selectedAstronautId) || null;
  }, [astronauts, selectedAstronautId]);

  // Available unique metric types from loaded measurements
  const availableMetrics = useMemo(() => {
    if (measurements.length === 0) {
      return ['heart_rate', 'spo2', 'body_temperature', 'respiratory_rate'];
    }
    const set = new Set(measurements.map((m) => m.measurement_type));
    return Array.from(set);
  }, [measurements]);

  // Latest measurements map per metric for the selected astronaut banner
  const latestMeasurementsMap = useMemo(() => {
    const map: Record<string, Measurement> = {};
    measurements.forEach((m) => {
      if (!map[m.measurement_type] || new Date(m.measured_at) > new Date(map[m.measurement_type].measured_at)) {
        map[m.measurement_type] = m;
      }
    });
    return map;
  }, [measurements]);

  // Filtered measurements by time range
  const filteredMeasurements = useMemo(() => {
    if (timeFilter === 'all') return measurements;

    const timestamps = measurements
      .map((m) => new Date(m.measured_at).getTime())
      .filter((t) => !isNaN(t));

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
        {/* Selected Astronaut Status Banner (shown on Telemetry, Baselines, and Anatomy views) */}
        {selectedAstronaut && activeTab !== 'roster' && activeTab !== 'catalog' && (
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

        {/* Global Error for Astronauts */}
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
                onOpenBaselines={() => setActiveTab('baselines')}
                onOpenCatalog={() => setActiveTab('catalog')}
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
                    onNavigateToBaselines={(metric) => {
                      setSelectedMetric(metric);
                      setActiveTab('baselines');
                    }}
                  />
                )}
              </>
            )}

            {activeTab === 'baselines' && (
              <PersonalBaselinesView
                astronaut={selectedAstronaut}
                measurements={measurements}
                selectedMetric={selectedMetric}
                onSelectMetric={setSelectedMetric}
                onNavigateToTelemetry={(metric) => {
                  setSelectedMetric(metric);
                  setActiveTab('telemetry');
                }}
                onNavigateToAnatomy={() => setActiveTab('anatomy')}
              />
            )}

            {activeTab === 'catalog' && (
              <MeasurementCatalogView
                onSelectMetricToInspect={(metricId) => {
                  setSelectedMetric(metricId);
                  setActiveTab('telemetry');
                }}
              />
            )}

            {activeTab === 'anatomy' && (
              <AnatomyViewport
                astronaut={selectedAstronaut}
                measurements={measurements}
                selectedMetric={selectedMetric}
                onSelectMetric={setSelectedMetric}
                onSwitchToChart={() => setActiveTab('telemetry')}
                onNavigateToBaselines={(metric) => {
                  setSelectedMetric(metric);
                  setActiveTab('baselines');
                }}
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
