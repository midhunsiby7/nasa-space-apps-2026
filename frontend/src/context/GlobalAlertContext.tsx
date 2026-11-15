import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { AlertResponse } from '../types/alert';
import { Astronaut } from '../types/astronaut';
import { apiClient } from '../services/apiClient';

interface GlobalAlertContextValue {
  globalAlerts: AlertResponse[];
  activeAlerts: AlertResponse[];
  criticalAlerts: AlertResponse[];
  activeCount: number;
  criticalCount: number;
  isLoading: boolean;
  acknowledgeAlert: (alertId: string, note?: string) => Promise<AlertResponse>;
  resolveAlert: (alertId: string, note?: string) => Promise<AlertResponse>;
  refreshAlerts: () => Promise<void>;
  focusedAlert: AlertResponse | null;
  setFocusedAlert: (alert: AlertResponse | null) => void;
}

const GlobalAlertContext = createContext<GlobalAlertContextValue | undefined>(undefined);

export const GlobalAlertProvider: React.FC<{
  children: React.ReactNode;
  astronauts: Astronaut[];
}> = ({ children, astronauts }) => {
  const [globalAlerts, setGlobalAlerts] = useState<AlertResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [focusedAlert, setFocusedAlert] = useState<AlertResponse | null>(null);
  const isPollingRef = useRef<boolean>(false);

  const refreshAlerts = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const allAlerts: AlertResponse[] = [];
      const astroList = astronauts.length > 0
        ? astronauts
        : [
            { id: 'astro-001' },
            { id: 'astro-002' },
            { id: 'astro-003' },
            { id: 'astro-004' },
            { id: 'astro-005' },
          ];

      // Fetch alerts for each astronaut in parallel
      const results = await Promise.allSettled(
        astroList.map((a) => apiClient.getAlerts(a.id))
      );

      for (const res of results) {
        if (res.status === 'fulfilled' && res.value && Array.isArray(res.value.data)) {
          allAlerts.push(...res.value.data);
        }
      }

      // Deduplicate by ID
      const map = new Map<string, AlertResponse>();
      for (const a of allAlerts) {
        map.set(a.id, a);
      }
      setGlobalAlerts(Array.from(map.values()));
    } catch (err) {
      console.warn('Failed to refresh global alerts:', err);
    } finally {
      isPollingRef.current = false;
      setIsLoading(false);
    }
  }, [astronauts]);

  // Periodic polling every 12 seconds
  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(() => {
      refreshAlerts();
    }, 12000);
    return () => clearInterval(interval);
  }, [refreshAlerts]);

  const acknowledgeAlert = async (alertId: string, note?: string) => {
    const updated = await apiClient.acknowledgeAlert(alertId, note);
    setGlobalAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? updated : a))
    );
    if (focusedAlert?.id === alertId) {
      setFocusedAlert(updated);
    }
    return updated;
  };

  const resolveAlert = async (alertId: string, note?: string) => {
    const updated = await apiClient.resolveAlert(alertId, note);
    setGlobalAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? updated : a))
    );
    if (focusedAlert?.id === alertId) {
      setFocusedAlert(null);
    }
    return updated;
  };

  const activeAlerts = globalAlerts.filter(
    (a) => a.status === 'active' || a.status === 'acknowledged'
  );
  const criticalAlerts = activeAlerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'high'
  );

  return (
    <GlobalAlertContext.Provider
      value={{
        globalAlerts,
        activeAlerts,
        criticalAlerts,
        activeCount: activeAlerts.length,
        criticalCount: criticalAlerts.length,
        isLoading,
        acknowledgeAlert,
        resolveAlert,
        refreshAlerts,
        focusedAlert,
        setFocusedAlert,
      }}
    >
      {children}
    </GlobalAlertContext.Provider>
  );
};

export const useGlobalAlerts = () => {
  const ctx = useContext(GlobalAlertContext);
  if (!ctx) {
    throw new Error('useGlobalAlerts must be used within a GlobalAlertProvider');
  }
  return ctx;
};
