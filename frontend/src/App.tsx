import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from './components/layout/Layout';
import { ActiveTab } from './components/layout/Sidebar';
import { MissionOverview } from './components/dashboard/MissionOverview';
import { SelectedAstronautBanner } from './components/dashboard/SelectedAstronautBanner';
import { ProvenanceNotice } from './components/dashboard/ProvenanceNotice';
import { AstronautDirectory } from './components/astronaut/AstronautDirectory';
import { AstronautProfileModal } from './components/astronaut/AstronautProfileModal';
import { TelemetryStreamSection } from './components/telemetry/TelemetryStreamSection';
import { HealthIntelligenceSection } from './components/intelligence/HealthIntelligenceSection';
import { AlertsHub } from './components/alert/AlertsHub';
import { AnatomyViewport } from './components/anatomy/AnatomyViewport';
import { NonAnatomicalDataDrawer } from './components/anatomy/NonAnatomicalDataDrawer';
import { JudgeDemoController } from './components/demo/JudgeDemoController';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorMessage } from './components/common/ErrorMessage';
import { Astronaut } from './types/astronaut';
import { Measurement, MeasurementType } from './types/measurement';
import { BaselineResponse } from './types/baseline';
import { TrendObservation, TelemetryFreshnessResponse } from './types/trend';
import { AssessmentResponse } from './types/assessment';
import { AlertResponse } from './types/alert';
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

  // Intelligence & Alerts Data State
  const [baselines, setBaselines] = useState<BaselineResponse[]>([]);
  const [trends, setTrends] = useState<TrendObservation[]>([]);
  const [freshness, setFreshness] = useState<TelemetryFreshnessResponse | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);

  // UI / Loading State
  const [isLoadingAstronauts, setIsLoadingAstronauts] = useState<boolean>(true);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState<boolean>(false);
  const [isLoadingIntelligence, setIsLoadingIntelligence] = useState<boolean>(false);
  const [isEvaluatingAssessment, setIsEvaluatingAssessment] = useState<boolean>(false);
  const [astronautsError, setAstronautsError] = useState<string | null>(null);
  const [measurementsError, setMeasurementsError] = useState<string | null>(null);
  const [intelligenceError, setIntelligenceError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');

  // Modals & Drawers
  const [profileModalAstronaut, setProfileModalAstronaut] = useState<Astronaut | null>(null);
  const [isProvenanceModalOpen, setIsProvenanceModalOpen] = useState<boolean>(false);
  const [isNonAnatomicalOpen, setIsNonAnatomicalOpen] = useState<boolean>(false);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState<boolean>(false);

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = apiClient.subscribeConnectionState((state) => {
      setConnectionState(state);
    });
    return unsubscribe;
  }, []);

  // 1. Fetch Astronauts List
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

  // 2. Fetch Measurements for Selected Astronaut
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

  // 3. Fetch Health Intelligence (Baselines, Trends, Freshness, Assessment)
  const fetchIntelligence = useCallback(async (astronautId: string) => {
    setIsLoadingIntelligence(true);
    setIntelligenceError(null);
    try {
      const [baselinesRes, trendsRes, freshnessRes, assessmentRes, alertsRes] = await Promise.all([
        apiClient.getActiveBaselines(astronautId),
        apiClient.getTrends(astronautId),
        apiClient.getFreshness(astronautId),
        apiClient.getLatestAssessment(astronautId),
        apiClient.getAlerts(astronautId),
      ]);

      setBaselines(baselinesRes.data);
      setTrends(trendsRes.data);
      setFreshness(freshnessRes);
      setLatestAssessment(assessmentRes);
      setAlerts(alertsRes.data);
    } catch (err: any) {
      console.warn('Error fetching health intelligence:', err);
      setIntelligenceError(err?.message || 'Unable to retrieve complete health intelligence data.');
    } finally {
      setIsLoadingIntelligence(false);
    }
  }, []);

  // Trigger data fetches on selected astronaut change
  useEffect(() => {
    if (selectedAstronautId) {
      fetchMeasurements(selectedAstronautId);
      fetchIntelligence(selectedAstronautId);
    }
  }, [selectedAstronautId, fetchMeasurements, fetchIntelligence]);

  // Alert Lifecycle Actions
  const handleAcknowledgeAlert = async (alertId: string, note?: string) => {
    try {
      const updated = await apiClient.acknowledgeAlert(alertId, note);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      throw err;
    }
  };

  const handleResolveAlert = async (alertId: string, note?: string) => {
    try {
      const updated = await apiClient.resolveAlert(alertId, note);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      throw err;
    }
  };

  const handleRunAssessment = async (reportedSymptoms?: string[]) => {
    if (!selectedAstronautId) return;
    setIsEvaluatingAssessment(true);
    try {
      const newAssessment = await apiClient.generateAssessment(selectedAstronautId, {
        context: 'resting_cabin',
        lookback_hours: 72,
        generate_alerts: true,
        reported_symptoms: reportedSymptoms && reportedSymptoms.length > 0 ? reportedSymptoms : undefined,
      });
      setLatestAssessment(newAssessment);
      // Refresh alerts and trends
      const [alertsRes, trendsRes] = await Promise.all([
        apiClient.getAlerts(selectedAstronautId),
        apiClient.getTrends(selectedAstronautId),
      ]);
      setAlerts(alertsRes.data);
      setTrends(trendsRes.data);
    } catch (err) {
      console.error('Failed to generate health assessment:', err);
    } finally {
      setIsEvaluatingAssessment(false);
    }
  };

  // Demo walkthrough actions
  const handleTriggerDemoAction = (action: string) => {
    if (action === 'open_non_anatomical') {
      setIsNonAnatomicalOpen(true);
    }
  };

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

  const activeAlertsCount = useMemo(() => {
    return alerts.filter((a) => a.status === 'active').length;
  }, [alerts]);

  const staleCount = freshness ? freshness.stale_count : 0;

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
      onOpenProvenanceGuide={() => setIsProvenanceModalOpen(false || true)}
      activeAlertsCount={activeAlertsCount}
      onOpenNonAnatomical={() => setIsNonAnatomicalOpen(true)}
      onToggleDemoGuide={() => setIsDemoGuideOpen((prev) => !prev)}
      isDemoGuideOpen={isDemoGuideOpen}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Selected Astronaut Status Banner */}
        {selectedAstronaut && activeTab !== 'roster' && (
          <SelectedAstronautBanner
            astronaut={selectedAstronaut}
            latestMeasurements={latestMeasurementsMap}
            onOpenDetails={() => setProfileModalAstronaut(selectedAstronaut)}
            onOpenAnatomy={() => setActiveTab('anatomy')}
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
                activeAlertsCount={activeAlertsCount}
                staleTelemetryCount={staleCount}
                latestAssessment={latestAssessment}
                baselines={baselines}
                trends={trends}
                alerts={alerts}
                freshness={freshness}
                onExploreRoster={() => setActiveTab('roster')}
                onViewTelemetry={() => setActiveTab('telemetry')}
                onViewIntelligence={() => setActiveTab('intelligence')}
                onViewAlerts={() => setActiveTab('alerts')}
                onOpenAnatomy={() => setActiveTab('anatomy')}
                onSelectAstronaut={(id) => setSelectedAstronautId(id)}
                onSelectMetric={(m) => setSelectedMetric(m)}
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
                    baselines={baselines}
                    trends={trends}
                  />
                )}
              </>
            )}

            {activeTab === 'intelligence' && (
              <HealthIntelligenceSection
                astronaut={selectedAstronaut}
                baselines={baselines}
                trends={trends}
                freshness={freshness}
                assessment={latestAssessment}
                isLoading={isLoadingIntelligence}
                error={intelligenceError}
                onRefresh={() => selectedAstronautId && fetchIntelligence(selectedAstronautId)}
                onRunAssessment={handleRunAssessment}
                isEvaluating={isEvaluatingAssessment}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsHub
                alerts={alerts}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onResolveAlert={handleResolveAlert}
                isLoading={isLoadingIntelligence}
              />
            )}

            {activeTab === 'anatomy' && (
              <AnatomyViewport
                astronaut={selectedAstronaut}
                measurements={measurements}
                baselines={baselines}
                trends={trends}
                alerts={alerts}
                assessment={latestAssessment}
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

      {/* Non-Anatomical Habitat Telemetry Drawer */}
      <NonAnatomicalDataDrawer
        isOpen={isNonAnatomicalOpen}
        onClose={() => setIsNonAnatomicalOpen(false)}
        measurements={measurements}
        trends={trends}
        alerts={alerts}
        onSelectMetric={(m) => setSelectedMetric(m)}
        onNavigateToChart={(m) => {
          setSelectedMetric(m);
          setActiveTab('telemetry');
        }}
      />

      {/* Judge Demonstration Flow Controller */}
      <JudgeDemoController
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onSelectAstronaut={(id) => setSelectedAstronautId(id)}
        onSelectMetric={(m) => setSelectedMetric(m)}
        onTriggerDemoAction={handleTriggerDemoAction}
        selectedAstronautId={selectedAstronautId}
      />
    </Layout>
  );
};

export default App;
