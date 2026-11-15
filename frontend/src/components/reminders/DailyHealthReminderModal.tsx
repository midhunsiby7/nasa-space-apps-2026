import React, { useState } from 'react';
import {
  Bell,
  X,
  Droplets,
  Eye,
  Activity,
  Dumbbell,
  CheckCircle2,
  AlertOctagon,
  BellRing,
  BookOpen,
} from 'lucide-react';
import { AlertResponse } from '../../types/alert';
import { Measurement } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { deriveHealthAnomalies } from './healthAnomalies';
import { HealthAnomalyBanner } from './HealthAnomalyBanner';
import { PERSONALIZED_PLAN, DAILY_SCHEDULE } from '../exercise/DailyExerciseRoutine';

interface DailyHealthReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  astronautName?: string;
  alerts?: AlertResponse[];
  measurements?: Measurement[];
  baselines?: BaselineResponse[];
}

export const DailyHealthReminderModal: React.FC<DailyHealthReminderModalProps> = ({
  isOpen,
  onClose,
  astronautName = 'Crew Member',
  alerts = [],
  measurements = [],
  baselines = [],
}) => {
  const [activeTab, setActiveTab] = useState<'checkup' | 'exercise'>('checkup');

  if (!isOpen) return null;

  const anomalies = deriveHealthAnomalies(alerts, measurements, baselines);

  const activeAlerts = alerts.filter(
    (a) => a.status === 'active' || a.status === 'acknowledged'
  );
  const criticalAlert = activeAlerts.find(
    (a) => a.severity === 'critical' || a.severity === 'high'
  );
  const isExerciseSuspended = Boolean(criticalAlert);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-space-700 bg-space-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-space-700 bg-space-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-telemetry-cyan/15 text-telemetry-cyan border border-telemetry-cyan/30">
              <Bell className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-space-100">
                Daily Health Check-Up &amp; Countermeasures
              </h3>
              <span className="font-mono text-[10px] text-space-400">
                Flight Day Protocol • {astronautName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-space-400 hover:text-space-100 hover:bg-space-800 transition-colors"
            title="Close Daily Modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-space-750 bg-space-850 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('checkup')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'checkup'
                ? 'border-telemetry-cyan text-telemetry-cyan'
                : 'border-transparent text-space-400 hover:text-space-200'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Daily Check-up &amp; Anomalies</span>
            {anomalies.length > 0 && (
              <span className="rounded-full bg-telemetry-rose/20 text-telemetry-rose px-1.5 py-0.2 text-[10px] font-bold border border-telemetry-rose/30">
                {anomalies.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exercise')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'exercise'
                ? 'border-telemetry-cyan text-telemetry-cyan'
                : 'border-transparent text-space-400 hover:text-space-200'
            }`}
          >
            <Dumbbell className="h-4 w-4" />
            <span>Personalized Exercise Plan</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'checkup' ? (
            <div className="space-y-4">
              {/* Anomaly Alerts Section */}
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-space-400 mb-2">
                  Health Anomaly Assessment
                </div>
                <HealthAnomalyBanner anomalies={anomalies} />
              </div>

              {/* Daily Protocol Checklist */}
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-space-400 mb-2">
                  Operational Daily Checklist
                </div>
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-space-850 border border-space-750">
                    <Activity className="h-4 w-4 text-telemetry-emerald shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-space-100 flex items-center justify-between">
                        <span>Morning Resting Baseline</span>
                        <span className="text-[10px] text-telemetry-emerald uppercase">Logged 06:30 UTC</span>
                      </div>
                      <p className="text-[11px] text-space-300 mt-0.5">
                        BioHarness 5-minute resting vitals collection logged nominal. Heart rate, SpO2, and respiratory rate within personal baseline.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-space-850 border border-space-750">
                    <Droplets className="h-4 w-4 text-telemetry-cyan shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-space-100 flex items-center justify-between">
                        <span>Target Fluid Intake (2.5 L)</span>
                        <span className="text-[10px] text-telemetry-cyan uppercase">1.2 L / 2.5 L</span>
                      </div>
                      <p className="text-[11px] text-space-300 mt-0.5">
                        Minimum 2.5 L daily target prevents microgravity plasma volume drop and reduces renal stone formation risk from skeletal mineral release.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-space-850 border border-space-750">
                    <Eye className="h-4 w-4 text-telemetry-amber shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-space-100 flex items-center justify-between">
                        <span>SANS Visual Acuity Assessment</span>
                        <span className="text-[10px] text-telemetry-amber uppercase">Pending Flight Day 42</span>
                      </div>
                      <p className="text-[11px] text-space-300 mt-0.5">
                        Spaceflight-Associated Neuro-ocular Syndrome questionnaire pending. Check for hyperopic shifts or visual scotomas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Daily Exercise Adherence Reminder */}
              <div
                role="alert"
                className="rounded-lg border-2 border-telemetry-amber bg-telemetry-amber/10 p-3.5 font-mono"
              >
                <div className="flex items-center gap-2 text-telemetry-amber font-bold text-xs uppercase tracking-wider mb-1.5">
                  <BellRing className="h-4 w-4 animate-bounce" />
                  <span>Daily Exercise Adherence Reminder</span>
                </div>
                <p className="text-xs text-space-100 leading-relaxed">
                  Correctly perform 100% of prescribed countermeasure exercises daily without omission to prevent microgravity musculoskeletal atrophy, bone demineralization, and cardiovascular deconditioning.
                </p>
              </div>

              {/* Safety Interlock Check */}
              {isExerciseSuspended && (
                <div className="rounded-lg border-2 border-telemetry-rose bg-telemetry-rose/15 p-3.5 font-mono">
                  <div className="flex items-center gap-2 text-telemetry-rose font-bold text-xs uppercase tracking-wider mb-1.5">
                    <AlertOctagon className="h-4 w-4 animate-pulse" />
                    <span>SAFETY INTERLOCK: HIGH LOAD EXERCISE CONTRAINDICATED</span>
                  </div>
                  <p className="text-xs text-space-100 leading-relaxed mb-2">
                    Active physiological alert requires Flight Surgeon clearance prior to mechanical loading:
                  </p>
                  <div className="rounded bg-space-950/70 p-2 text-xs border border-telemetry-rose/40 text-space-200">
                    <strong>{criticalAlert?.title}</strong>: {criticalAlert?.explanation}
                  </div>
                </div>
              )}

              {/* Personalized Preventative Plans based on NASA research */}
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-space-400 mb-2">
                  NASA Research-Backed Preventative Guidance
                </div>
                <div className="space-y-3 font-mono text-xs">
                  {PERSONALIZED_PLAN.map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-lg border border-space-700 bg-space-850 p-3 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-space-750">
                        <div className="flex items-center gap-1.5 font-bold text-space-100">
                          <CheckCircle2 className="h-3.5 w-3.5 text-telemetry-cyan" />
                          <span>{plan.risk}</span>
                        </div>
                        <span className="text-[10px] text-telemetry-cyan bg-telemetry-cyan/10 px-2 py-0.5 rounded border border-telemetry-cyan/20">
                          Target: {plan.target}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase text-space-400">
                          Prescribed Countermeasures:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-space-200">
                          {plan.prescription.map((rx, idx) => (
                            <li key={idx} className="leading-snug">{rx}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded bg-space-900 p-2 text-[10px] text-space-300 border border-space-750 flex items-start gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-telemetry-cyan shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-space-200">NASA Research Evidence: </strong>
                          <span>{plan.evidence}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scheduled Routine Today */}
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-space-400 mb-2">
                  Flight Day Scheduled Sessions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                  {DAILY_SCHEDULE.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-space-750 bg-space-850 p-2.5 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-space-100">{s.title.split(' ')[0]}</span>
                        <span className="text-[9px] text-telemetry-cyan">{s.targetDurationMinutes} min</span>
                      </div>
                      <div className="text-[10px] text-space-400">{s.scheduledUtc}</div>
                      <div className="text-[10px] text-space-300">{s.workloadTarget}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-5 py-3 border-t border-space-750 bg-space-950/80 flex items-center justify-end gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-telemetry-cyan hover:bg-telemetry-cyan/90 text-white font-bold transition-colors shadow-sm"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
