import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useGlobalAlerts } from '../../context/GlobalAlertContext';
import { AlertResponse } from '../../types/alert';

interface GlobalAlertOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAstronaut?: (astronautId: string) => void;
}

export const GlobalAlertOverlay: React.FC<GlobalAlertOverlayProps> = ({
  isOpen,
  onClose,
  onSelectAstronaut,
}) => {
  const { activeAlerts, acknowledgeAlert, resolveAlert } = useGlobalAlerts();
  const [actionNote, setActionNote] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<AlertResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAlert = selectedAlert || (activeAlerts.length > 0 ? activeAlerts[0] : null);

  const handleAcknowledge = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await acknowledgeAlert(id, actionNote || 'Acknowledged via Global Alert Desk');
      setSelectedAlert(res);
      setActionNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    setIsSubmitting(true);
    try {
      await resolveAlert(id, actionNote || 'Resolved via Global Alert Desk');
      setSelectedAlert(null);
      setActionNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-xl border border-space-700 bg-space-900 p-5 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-space-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-telemetry-rose/15 text-telemetry-rose border border-telemetry-rose/30">
              <Bell className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-base font-bold text-space-100 uppercase tracking-wider">
                  Mission-Wide Alert Command Desk
                </h3>
                <span className="rounded bg-telemetry-rose/20 px-2 py-0.5 font-mono text-xs font-bold text-telemetry-rose border border-telemetry-rose/40">
                  {activeAlerts.length} Active
                </span>
              </div>
              <span className="font-mono text-[11px] text-space-400">
                Real-Time Physiological Disruption & Sensor Surveillance
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-space-400 hover:text-space-100 hover:bg-space-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
          {/* Alert List (1 col) */}
          <div className="md:col-span-1 border border-space-800 rounded-lg bg-space-850 p-2.5 overflow-y-auto space-y-2 max-h-[50vh] md:max-h-full">
            <div className="text-[10px] font-mono uppercase tracking-wider text-space-400 px-1 mb-1">
              Active Notifications
            </div>

            {activeAlerts.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-space-400">
                No active operational alerts across the mission.
              </div>
            ) : (
              activeAlerts.map((a) => {
                const isCrit = a.severity === 'critical' || a.severity === 'high';
                const isSelected = currentAlert?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAlert(a)}
                    className={`p-2.5 rounded border font-mono text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-telemetry-cyan bg-space-800 shadow-hud-glow'
                        : isCrit
                        ? 'border-telemetry-rose/40 bg-telemetry-rose/10 hover:border-telemetry-rose'
                        : 'border-space-750 bg-space-900/60 hover:border-space-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          isCrit
                            ? 'bg-telemetry-rose/25 text-telemetry-rose'
                            : 'bg-telemetry-amber/25 text-telemetry-amber'
                        }`}
                      >
                        {a.severity}
                      </span>
                      <span className="text-[10px] text-space-400 truncate">
                        {a.astronaut_id}
                      </span>
                    </div>
                    <div className="font-bold text-space-100 truncate">{a.title}</div>
                    <div className="text-[10px] text-space-400 mt-1 capitalize">
                      Status: <strong className={a.status === 'acknowledged' ? 'text-telemetry-amber' : 'text-space-200'}>{a.status}</strong>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Alert Details & Action Form (2 cols) */}
          <div className="md:col-span-2 border border-space-800 rounded-lg bg-space-850 p-4 flex flex-col overflow-y-auto">
            {currentAlert ? (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            currentAlert.severity === 'critical' || currentAlert.severity === 'high'
                              ? 'bg-telemetry-rose/20 border-telemetry-rose/40 text-telemetry-rose'
                              : 'bg-telemetry-amber/20 border-telemetry-amber/40 text-telemetry-amber'
                          }`}
                        >
                          {currentAlert.severity} PRIORITY
                        </span>
                        <span className="text-xs font-mono text-space-300">
                          Target: <strong className="text-telemetry-cyan">{currentAlert.astronaut_id}</strong>
                        </span>
                      </div>
                      <h4 className="font-mono text-base font-bold text-space-100 mt-1">
                        {currentAlert.title}
                      </h4>
                    </div>

                    {onSelectAstronaut && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAstronaut(currentAlert.astronaut_id);
                          onClose();
                        }}
                        className="flex items-center gap-1 text-[11px] font-mono text-telemetry-cyan hover:underline shrink-0"
                      >
                        <span>Focus Astronaut</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="p-3 rounded bg-space-900 border border-space-800 text-xs text-space-200 font-mono leading-relaxed">
                    {currentAlert.explanation}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono text-space-400">
                    <div>
                      Category: <span className="text-space-200 capitalize">{currentAlert.category?.replace(/_/g, ' ') || 'Physiological'}</span>
                    </div>
                    <div>
                      Metric: <span className="text-space-200 font-bold">{currentAlert.measurement_type || 'Multi-System'}</span>
                    </div>
                    <div>
                      Logged At: <span className="text-space-200">{new Date(currentAlert.created_at).toUTCString()}</span>
                    </div>
                    <div>
                      Status: <span className="text-telemetry-cyan font-bold uppercase">{currentAlert.status}</span>
                    </div>
                  </div>
                </div>

                {/* Operator Response Controls */}
                <div className="pt-3 border-t border-space-800">
                  <label className="block text-[10px] font-mono uppercase text-space-400 mb-1.5">
                    Operator Clinical Note / Action Log:
                  </label>
                  <input
                    type="text"
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="E.g., Flight surgeon notified; requested repeat blood pressure reading."
                    className="w-full rounded bg-space-900 border border-space-700 px-3 py-1.5 text-xs font-mono text-space-100 focus:outline-none focus:border-telemetry-cyan mb-3"
                  />

                  <div className="flex items-center justify-end gap-2 font-mono text-xs">
                    {currentAlert.status === 'active' && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleAcknowledge(currentAlert.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 text-telemetry-amber border border-telemetry-amber/40 transition-colors disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Acknowledge Alert</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleResolve(currentAlert.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-telemetry-emerald/20 hover:bg-telemetry-emerald/30 text-telemetry-emerald border border-telemetry-emerald/40 font-bold transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Resolve Alert</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs font-mono text-space-400">
                Select an alert from the left panel to inspect details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
