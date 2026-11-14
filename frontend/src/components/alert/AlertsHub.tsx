import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  Clock,
  Check,
  CheckCheck,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { AlertResponse, AlertSeverity, AlertStatus } from '../../types/alert';

interface AlertsHubProps {
  alerts: AlertResponse[];
  onAcknowledgeAlert: (alertId: string, note?: string) => Promise<void>;
  onResolveAlert: (alertId: string, note?: string) => Promise<void>;
  isLoading?: boolean;
}

export const AlertsHub: React.FC<AlertsHubProps> = ({
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
  isLoading = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [actionModal, setActionModal] = useState<{
    type: 'acknowledge' | 'resolve';
    alert: AlertResponse;
  } | null>(null);
  const [operatorNote, setOperatorNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    return true;
  });

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
      setActionError(err.message || 'Operation failed: Backend connection is required to update alert status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-telemetry-rose/25 text-telemetry-rose border border-telemetry-rose/50 uppercase tracking-wide">
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-telemetry-rose/20 text-telemetry-rose border border-telemetry-rose/40 uppercase animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-telemetry-rose" />
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-telemetry-emerald/15 text-telemetry-emerald border border-telemetry-emerald/30 uppercase">
            <CheckCheck className="h-3 w-3" />
            Resolved
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Count Toolbar */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-telemetry-amber" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-space-100">
                  Operational Health Alerts Hub
                </h3>
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-telemetry-cyan" />}
              </div>
              <p className="text-[11px] font-mono text-space-400">
                {activeCount} active • {acknowledgedCount} acknowledged • {resolvedCount} resolved
              </p>
            </div>
          </div>

          {/* Status & Severity Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tabs */}
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
                    ? 'bg-telemetry-rose/25 text-telemetry-rose font-bold border border-telemetry-rose/50'
                    : 'bg-space-800 text-space-400 hover:text-telemetry-rose border border-space-750'
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
                Ack'd ({acknowledgedCount})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  statusFilter === 'resolved'
                    ? 'bg-telemetry-emerald/25 text-telemetry-emerald font-bold border border-telemetry-emerald/50'
                    : 'bg-space-800 text-space-400 hover:text-telemetry-emerald border border-space-750'
                }`}
              >
                Resolved ({resolvedCount})
              </button>
            </div>

            {/* Severity Dropdown */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as 'all' | AlertSeverity)}
              aria-label="Filter alerts by severity"
              className="bg-space-800 border border-space-700 rounded px-2 py-1 text-xs font-mono text-space-200 focus:outline-none"
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

      {/* Alert Feed */}
      {filteredAlerts.length === 0 ? (
        <div className="rounded-lg bg-space-850/60 border border-space-800 p-8 text-center">
          <CheckCircle className="h-8 w-8 text-telemetry-emerald mx-auto mb-2" />
          <p className="font-mono text-sm font-bold text-space-200">
            No Alerts Found
          </p>
          <p className="font-mono text-xs text-space-400 mt-1">
            No telemetry alerts match the current filter selection ({statusFilter} / {severityFilter}).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg bg-space-850 border p-4 shadow-hud-card transition-all ${
                alert.status === 'active'
                  ? 'border-telemetry-rose/40 hover:border-telemetry-rose/60'
                  : alert.status === 'acknowledged'
                  ? 'border-telemetry-cyan/30 hover:border-telemetry-cyan/50'
                  : 'border-space-750 hover:border-space-700 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderSeverityBadge(alert.severity)}
                    {renderStatusBadge(alert.status)}
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-space-800 text-space-300 border border-space-700">
                      {alert.measurement_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-space-500">
                      {alert.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="font-mono text-sm font-bold text-space-100 pt-1">
                    {alert.title}
                  </h4>
                  <p className="font-mono text-xs text-space-300 leading-relaxed max-w-3xl">
                    {alert.explanation}
                  </p>
                </div>

                {/* Operator Actions */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => {
                        setActionError(null);
                        setActionModal({ type: 'acknowledge', alert });
                        setOperatorNote('Acknowledged excursion; monitoring follow-up cycle.');
                      }}
                      className="px-3 py-1.5 rounded bg-telemetry-cyan/20 hover:bg-telemetry-cyan/30 border border-telemetry-cyan/50 text-telemetry-cyan text-xs font-mono font-semibold transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => {
                        setActionError(null);
                        setActionModal({ type: 'resolve', alert });
                        setOperatorNote('Telemetry stabilized and returned to personal baseline envelope.');
                      }}
                      className="px-3 py-1.5 rounded bg-telemetry-emerald/20 hover:bg-telemetry-emerald/30 border border-telemetry-emerald/50 text-telemetry-emerald text-xs font-mono font-semibold transition-colors"
                    >
                      Resolve Alert
                    </button>
                  )}
                </div>
              </div>

              {/* Timestamps and Audit Trail */}
              <div className="mt-3 pt-2.5 border-t border-space-800 flex flex-wrap items-center justify-between text-[10px] font-mono text-space-500 gap-y-1">
                <div className="flex items-center gap-3">
                  <span>ID: {alert.id}</span>
                  <span>Emitted: {new Date(alert.created_at).toLocaleString()}</span>
                  {alert.acknowledged_at && (
                    <span className="text-telemetry-cyan">
                      Ack'd: {new Date(alert.acknowledged_at).toLocaleTimeString()}
                    </span>
                  )}
                  {alert.resolved_at && (
                    <span className="text-telemetry-emerald">
                      Resolved: {new Date(alert.resolved_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {alert.is_synthetic && (
                  <span className="text-[9px] uppercase tracking-wider text-space-500">
                    Synthetic Scaffolding
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Operator Note Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-sm">
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
                    : 'bg-telemetry-emerald text-space-950 hover:bg-telemetry-emerald/90'
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
