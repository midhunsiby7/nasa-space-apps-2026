import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Check,
  CheckCheck,
  MessageSquare,
  Loader2,
  Search,
  ExternalLink,
} from 'lucide-react';
import { AlertResponse, AlertSeverity, AlertStatus } from '../../types/alert';
import { MeasurementType } from '../../types/measurement';

interface AlertCommandDeskProps {
  alerts: AlertResponse[];
  onAcknowledgeAlert: (alertId: string, note?: string) => Promise<void>;
  onResolveAlert: (alertId: string, note?: string) => Promise<void>;
  onNavigateToTelemetry?: (metric: MeasurementType) => void;
  isLoading?: boolean;
}

export const AlertCommandDesk: React.FC<AlertCommandDeskProps> = ({
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
  onNavigateToTelemetry,
  isLoading = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Operator Action Modal State
  const [actionModal, setActionModal] = useState<{
    type: 'acknowledge' | 'resolve';
    alert: AlertResponse;
  } | null>(null);
  const [operatorNote, setOperatorNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter alerts
  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchExpl = a.explanation.toLowerCase().includes(q);
      const matchMetric = a.measurement_type.toLowerCase().includes(q);
      if (!matchTitle && !matchExpl && !matchMetric) return false;
    }
    return true;
  });

  // Selected alert object
  const activeSelectedAlert = alerts.find((a) => a.id === selectedAlertId) || filteredAlerts[0] || null;

  const activeCount = alerts.filter((a) => a.status === 'active').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      if (actionModal.type === 'acknowledge') {
        await onAcknowledgeAlert(actionModal.alert.id, operatorNote || undefined);
      } else {
        await onResolveAlert(actionModal.alert.id, operatorNote || undefined);
      }
      setActionModal(null);
      setOperatorNote('');
    } catch (err: any) {
      console.error('Failed to update alert state:', err);
      setActionError(
        err.message ||
          'Operation failed: Live backend connection is required to mutate alert lifecycle state.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/25 text-rose-300 border border-rose-500/50 uppercase tracking-wide">
            <AlertOctagon className="h-3 w-3" />
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/25 text-amber-400 border border-amber-500/50 uppercase tracking-wide">
            <AlertTriangle className="h-3 w-3" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 uppercase tracking-wide">
            <AlertTriangle className="h-3 w-3" />
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-telemetry-cyan/15 text-telemetry-cyan border border-telemetry-cyan/40 uppercase tracking-wide">
            <Clock className="h-3 w-3" />
            Low
          </span>
        );
    }
  };

  const renderStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Active
          </span>
        );
      case 'acknowledged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-telemetry-cyan/15 text-telemetry-cyan border border-telemetry-cyan/30 uppercase">
            <Check className="h-3 w-3" />
            Acknowledged
          </span>
        );
      case 'resolved':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
            <CheckCheck className="h-3 w-3" />
            Resolved
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-base font-bold uppercase tracking-wider text-space-100">
                  Alert Command Desk
                </h2>
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-telemetry-cyan" />}
              </div>
              <p className="font-mono text-xs text-space-400 mt-0.5">
                {activeCount} active operational alerts • {acknowledgedCount} acknowledged • {resolvedCount} resolved
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-space-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-space-800 border border-space-700 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-space-200 placeholder-space-500 focus:outline-none focus:border-telemetry-cyan"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-space-700 text-space-100 font-bold border border-space-500'
                    : 'bg-space-800 text-space-400 hover:text-space-200 border border-space-750'
                }`}
              >
                All ({alerts.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-rose-500/25 text-rose-300 font-bold border border-rose-500/50'
                    : 'bg-space-800 text-space-400 hover:text-rose-400 border border-space-750'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('acknowledged')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  statusFilter === 'acknowledged'
                    ? 'bg-telemetry-cyan/25 text-telemetry-cyan font-bold border border-telemetry-cyan/50'
                    : 'bg-space-800 text-space-400 hover:text-telemetry-cyan border border-space-750'
                }`}
              >
                Ack ({acknowledgedCount})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  statusFilter === 'resolved'
                    ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/50'
                    : 'bg-space-800 text-space-400 hover:text-emerald-400 border border-space-750'
                }`}
              >
                Resolved ({resolvedCount})
              </button>
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as 'all' | AlertSeverity)}
              aria-label="Filter alerts by severity"
              className="bg-space-800 border border-space-700 rounded px-2.5 py-1.5 text-xs font-mono text-space-200 focus:outline-none focus:border-telemetry-cyan"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Command Split Pane: Alert Queue (Left) & Selected Alert Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alert Queue (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono text-space-400">
              Alert Queue ({filteredAlerts.length} matching)
            </span>
            <span className="text-[11px] font-mono text-space-500">
              Select alert to view audit trail & evidence
            </span>
          </div>

          {filteredAlerts.length > 0 ? (
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {filteredAlerts.map((alt) => {
                const isSelected = activeSelectedAlert?.id === alt.id;
                return (
                  <div
                    key={alt.id}
                    onClick={() => setSelectedAlertId(alt.id)}
                    className={`rounded-lg border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-space-800 border-telemetry-cyan shadow-hud-sm'
                        : 'bg-space-850 hover:bg-space-800/80 border-space-700/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-space-100">
                            {alt.title}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-space-400">
                          Metric:{' '}
                          <span className="text-space-200 capitalize">
                            {alt.measurement_type.replace(/_/g, ' ')}
                          </span>{' '}
                          • Category: <span className="text-space-300">{alt.category}</span>
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {renderSeverityBadge(alt.severity)}
                        {renderStatusBadge(alt.status)}
                      </div>
                    </div>

                    <p className="text-xs font-mono text-space-300 mt-2 line-clamp-2">
                      {alt.explanation}
                    </p>

                    <div className="mt-3 pt-2 border-t border-space-800/80 flex items-center justify-between text-[10px] font-mono text-space-500">
                      <span>Emitted: {new Date(alt.created_at).toLocaleString()}</span>
                      <span className="uppercase text-[9px] text-space-500">ID: {alt.id.slice(0, 16)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg bg-space-850 border border-space-700/80 p-8 text-center font-mono text-xs text-space-400">
              No operational alerts match the specified criteria.
            </div>
          )}
        </div>

        {/* Right Column: Selected Alert Detailed Dossier (5 Cols) */}
        <div className="lg:col-span-5">
          {activeSelectedAlert ? (
            <div className="sticky top-4 rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-space-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-space-400 block">
                    Alert Evidence Dossier
                  </span>
                  <h3 className="font-mono text-sm font-bold text-space-100 mt-0.5">
                    {activeSelectedAlert.title}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {renderSeverityBadge(activeSelectedAlert.severity)}
                  {renderStatusBadge(activeSelectedAlert.status)}
                </div>
              </div>

              {/* Evidence Context */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-space-400 block font-semibold">
                  Transparent Non-Diagnostic Explanation
                </span>
                <p className="text-xs font-mono text-space-200 leading-relaxed bg-space-900 p-3 rounded border border-space-800">
                  {activeSelectedAlert.explanation}
                </p>
              </div>

              {/* Metric & Occurrence Metadata */}
              <div className="rounded bg-space-900 p-3 border border-space-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-space-500">Linked Metric:</span>
                  <span className="font-bold text-space-200 capitalize">
                    {activeSelectedAlert.measurement_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-500">Alert Category:</span>
                  <span className="text-space-200">{activeSelectedAlert.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-500">Occurrence / Emitted:</span>
                  <span className="text-space-300">{new Date(activeSelectedAlert.created_at).toLocaleString()}</span>
                </div>
                {activeSelectedAlert.acknowledged_at && (
                  <div className="flex justify-between text-telemetry-cyan">
                    <span>Acknowledged At:</span>
                    <span>{new Date(activeSelectedAlert.acknowledged_at).toLocaleString()}</span>
                  </div>
                )}
                {activeSelectedAlert.resolved_at && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Resolved At:</span>
                    <span>{new Date(activeSelectedAlert.resolved_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Persistence Disclosure Notice */}
              <div className="rounded bg-space-900/60 p-2.5 border border-space-800 text-[10px] font-mono text-space-400">
                <span className="text-space-300 font-semibold block mb-0.5">Audit Trail Disclosure:</span>
                Status transitions and timestamps are persisted to the spacecraft flight record. Operator review notes are recorded in the active operator session log.
              </div>

              {/* Quick Jump to Telemetry */}
              {onNavigateToTelemetry && (
                <button
                  onClick={() => onNavigateToTelemetry(activeSelectedAlert.measurement_type as MeasurementType)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-700 text-xs font-mono text-space-200 hover:text-white transition-colors"
                >
                  <span>Inspect Telemetry for {activeSelectedAlert.measurement_type}</span>
                  <ExternalLink className="h-3 w-3 text-telemetry-cyan" />
                </button>
              )}

              {/* Operator Action Buttons */}
              <div className="pt-2 border-t border-space-800 flex items-center gap-2">
                {activeSelectedAlert.status === 'active' && (
                  <button
                    onClick={() => {
                      setActionError(null);
                      setActionModal({ type: 'acknowledge', alert: activeSelectedAlert });
                      setOperatorNote('Acknowledged excursion; monitoring follow-up cycle.');
                    }}
                    className="flex-1 px-3 py-2 rounded bg-telemetry-cyan/20 hover:bg-telemetry-cyan/30 border border-telemetry-cyan/50 text-telemetry-cyan text-xs font-mono font-bold transition-colors"
                  >
                    Acknowledge Alert
                  </button>
                )}

                {activeSelectedAlert.status !== 'resolved' && (
                  <button
                    onClick={() => {
                      setActionError(null);
                      setActionModal({ type: 'resolve', alert: activeSelectedAlert });
                      setOperatorNote('Telemetry stabilized and returned to personal baseline envelope.');
                    }}
                    className="flex-1 px-3 py-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold transition-colors"
                  >
                    Resolve Alert
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-space-850 border border-space-700/80 p-8 text-center font-mono text-xs text-space-400">
              No alert selected.
            </div>
          )}
        </div>
      </div>

      {/* Operator Action Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-sm animate-fade-in">
          <div className="rounded-lg bg-space-900 border border-space-700 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-telemetry-cyan" />
              <h4 className="font-mono text-sm font-bold uppercase text-space-100">
                {actionModal.type === 'acknowledge' ? 'Acknowledge Alert' : 'Resolve Alert'}
              </h4>
            </div>

            <p className="text-xs font-mono text-space-300">
              {actionModal.type === 'acknowledge'
                ? `Confirm receipt of alert "${actionModal.alert.title}".`
                : `Mark alert "${actionModal.alert.title}" as resolved.`}
            </p>

            {actionError && (
              <div className="rounded bg-rose-500/15 border border-rose-500/40 p-2.5 font-mono text-xs text-rose-300">
                ⚠️ {actionError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-space-400 mb-1">
                Operator Action Note (Optional)
              </label>
              <textarea
                value={operatorNote}
                onChange={(e) => setOperatorNote(e.target.value)}
                rows={3}
                className="w-full rounded bg-space-800 border border-space-700 px-3 py-2 text-xs font-mono text-space-100 focus:outline-none focus:border-telemetry-cyan"
                placeholder="Log operational observation or corrective countermeasure..."
              />
              <span className="text-[10px] font-mono text-space-500 mt-1 block">
                Note: Status updates persist to spacecraft database; notes are logged in the active session record.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setActionModal(null);
                  setActionError(null);
                }}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 text-xs font-mono text-space-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className={`px-4 py-1.5 rounded text-xs font-mono font-bold transition-colors ${
                  actionModal.type === 'acknowledge'
                    ? 'bg-telemetry-cyan text-space-950 hover:bg-telemetry-cyan/90'
                    : 'bg-emerald-400 text-space-950 hover:bg-emerald-300'
                }`}
              >
                {isSubmitting ? 'Updating...' : `Confirm ${actionModal.type === 'acknowledge' ? 'Acknowledge' : 'Resolve'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AlertCommandDesk;
