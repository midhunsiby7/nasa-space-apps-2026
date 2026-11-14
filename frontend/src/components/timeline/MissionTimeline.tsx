import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Activity,
  TrendingUp,
  Brain,
  Bell,
  Info,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Astronaut } from '../../types/astronaut';
import { Measurement, MeasurementType } from '../../types/measurement';
import { BaselineResponse } from '../../types/baseline';
import { TrendObservation } from '../../types/trend';
import { AssessmentResponse } from '../../types/assessment';
import { AlertResponse } from '../../types/alert';
import { ActiveTab } from '../layout/Sidebar';

export type TimelineEventType = 'telemetry' | 'baseline' | 'trend' | 'assessment' | 'alert';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  occurrenceTime: string; // Real physical/biological occurrence time
  ingestionTime?: string; // System record / processing / ingestion timestamp
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'nominal';
  metric?: string;
  metadata?: Record<string, any>;
}

interface MissionTimelineProps {
  astronaut: Astronaut | null;
  measurements: Measurement[];
  baselines: BaselineResponse[];
  trends: TrendObservation[];
  assessment: AssessmentResponse | null;
  alerts: AlertResponse[];
  onNavigateToTab: (tab: ActiveTab) => void;
  onSelectMetric: (metric: MeasurementType) => void;
}

export const MissionTimeline: React.FC<MissionTimelineProps> = ({
  astronaut,
  measurements,
  baselines,
  trends,
  assessment,
  alerts,
  onNavigateToTab,
  onSelectMetric,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | TimelineEventType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synthesize events into a unified chronological stream
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const list: TimelineEvent[] = [];

    // 1. Telemetry measurements
    measurements.forEach((m) => {
      list.push({
        id: `tl-m-${m.id}`,
        type: 'telemetry',
        title: `Telemetry: ${m.measurement_type.replace(/_/g, ' ').toUpperCase()}`,
        description: `Observed value ${m.value.toFixed(1)} ${m.unit} in context '${m.context}' (Quality: ${m.data_quality}).`,
        occurrenceTime: m.measured_at,
        ingestionTime: m.measured_at,
        severity: 'nominal',
        metric: m.measurement_type,
        metadata: { value: m.value, unit: m.unit, quality: m.data_quality },
      });
    });

    // 2. Personal Baselines
    baselines.forEach((b) => {
      const bTime = b.created_at || new Date().toISOString();
      list.push({
        id: `tl-b-${b.id}`,
        type: 'baseline',
        title: `Baseline Calculated: ${b.measurement_type.replace(/_/g, ' ').toUpperCase()}`,
        description: `Operational median ${b.envelope.median.toFixed(1)} ${b.unit} [IQR: ${b.envelope.q25.toFixed(1)}–${b.envelope.q75.toFixed(1)}] registered with maturity '${b.maturity}'.`,
        occurrenceTime: bTime,
        ingestionTime: bTime,
        severity: 'nominal',
        metric: b.measurement_type,
        metadata: { median: b.envelope.median, maturity: b.maturity },
      });
    });

    // 3. Health Trends
    trends.forEach((t) => {
      list.push({
        id: `tl-t-${t.measurement_type}-${t.context}`,
        type: 'trend',
        title: `Trend Trajectory: ${t.measurement_type.replace(/_/g, ' ').toUpperCase()}`,
        description: `Classified as '${t.trend_direction.replace(/_/g, ' ')}' with Sen's slope of ${t.sens_slope !== null && t.sens_slope !== undefined ? `${t.sens_slope > 0 ? '+' : ''}${t.sens_slope.toFixed(2)}` : 'N/A'} ${t.unit}/24h.`,
        occurrenceTime: t.current_measured_at || new Date().toISOString(),
        ingestionTime: new Date().toISOString(),
        severity: t.trend_direction === 'sustained_deviation' ? 'high' : 'nominal',
        metric: t.measurement_type,
        metadata: { slope: t.sens_slope, direction: t.trend_direction },
      });
    });

    // 4. Health Assessments
    if (assessment) {
      list.push({
        id: `tl-a-${assessment.id}`,
        type: 'assessment',
        title: `Explainable Assessment: ${assessment.overall_classification.toUpperCase()}`,
        description: assessment.summary_explanation,
        occurrenceTime: assessment.assessment_date,
        ingestionTime: assessment.created_at,
        severity:
          assessment.overall_classification === 'emergency'
            ? 'critical'
            : assessment.overall_classification === 'medical_review_recommended'
            ? 'high'
            : assessment.overall_classification === 'needs_attention'
            ? 'medium'
            : 'nominal',
        metadata: { classification: assessment.overall_classification },
      });
    }

    // 5. Operational Alerts (emissions, acknowledgements, resolutions)
    alerts.forEach((alt) => {
      // Alert emission
      list.push({
        id: `tl-alt-created-${alt.id}`,
        type: 'alert',
        title: `Alert Emitted: ${alt.title}`,
        description: alt.explanation,
        occurrenceTime: alt.created_at,
        ingestionTime: alt.created_at,
        severity: alt.severity,
        metric: alt.measurement_type,
        metadata: { alertId: alt.id, status: alt.status },
      });

      // Acknowledged event
      if (alt.acknowledged_at) {
        list.push({
          id: `tl-alt-ack-${alt.id}`,
          type: 'alert',
          title: `Alert Acknowledged: ${alt.title}`,
          description: `Flight controller acknowledged alert excursion.`,
          occurrenceTime: alt.acknowledged_at,
          ingestionTime: alt.acknowledged_at,
          severity: 'nominal',
          metric: alt.measurement_type,
          metadata: { alertId: alt.id },
        });
      }

      // Resolved event
      if (alt.resolved_at) {
        list.push({
          id: `tl-alt-res-${alt.id}`,
          type: 'alert',
          title: `Alert Resolved: ${alt.title}`,
          description: `Telemetry returned to personal operational baseline envelope.`,
          occurrenceTime: alt.resolved_at,
          ingestionTime: alt.resolved_at,
          severity: 'nominal',
          metric: alt.measurement_type,
          metadata: { alertId: alt.id },
        });
      }
    });

    // Sort descending by occurrenceTime
    return list.sort(
      (a, b) => new Date(b.occurrenceTime).getTime() - new Date(a.occurrenceTime).getTime()
    );
  }, [measurements, baselines, trends, assessment, alerts]);

  // Filter events
  const filteredEvents = timelineEvents.filter((ev) => {
    if (typeFilter !== 'all' && ev.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchDesc = ev.description.toLowerCase().includes(q);
      const matchMetric = ev.metric?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchMetric) return false;
    }
    return true;
  });

  const renderTypeIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'telemetry':
        return <Activity className="h-4 w-4 text-telemetry-cyan" />;
      case 'baseline':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'trend':
        return <Clock className="h-4 w-4 text-sky-400" />;
      case 'assessment':
        return <Brain className="h-4 w-4 text-purple-400" />;
      case 'alert':
        return <Bell className="h-4 w-4 text-rose-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeline Header & Disclosure */}
      <div className="rounded-lg bg-space-850 border border-space-700/80 p-5 shadow-hud-card space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-space-800 border border-space-700 text-telemetry-cyan">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-mono text-base font-bold uppercase tracking-wider text-space-100">
                {astronaut ? `${astronaut.name} — Reconstructed Mission Timeline` : 'Reconstructed Mission Timeline'}
              </h2>
              <p className="font-mono text-xs text-space-400 mt-0.5">
                Integrated chronological event stream aggregating telemetry, baseline updates, trend shifts, assessments, and alert lifecycles.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-space-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event stream..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-space-800 border border-space-700 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-space-200 placeholder-space-500 focus:outline-none focus:border-telemetry-cyan"
              />
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-space-700 text-space-100 font-bold border border-space-500'
                    : 'bg-space-800 text-space-400 hover:text-space-200 border border-space-750'
                }`}
              >
                All ({timelineEvents.length})
              </button>
              <button
                onClick={() => setTypeFilter('telemetry')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  typeFilter === 'telemetry'
                    ? 'bg-telemetry-cyan/20 text-telemetry-cyan font-bold border border-telemetry-cyan/40'
                    : 'bg-space-800 text-space-400 hover:text-telemetry-cyan border border-space-750'
                }`}
              >
                Telemetry
              </button>
              <button
                onClick={() => setTypeFilter('baseline')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  typeFilter === 'baseline'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40'
                    : 'bg-space-800 text-space-400 hover:text-emerald-400 border border-space-750'
                }`}
              >
                Baselines
              </button>
              <button
                onClick={() => setTypeFilter('alert')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  typeFilter === 'alert'
                    ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                    : 'bg-space-800 text-space-400 hover:text-rose-400 border border-space-750'
                }`}
              >
                Alerts
              </button>
              <button
                onClick={() => setTypeFilter('assessment')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  typeFilter === 'assessment'
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                    : 'bg-space-800 text-space-400 hover:text-purple-400 border border-space-750'
                }`}
              >
                Assessments
              </button>
            </div>
          </div>
        </div>

        {/* Mandatory Reconstructed Stream Disclosure */}
        <div className="rounded bg-space-900 border border-space-800 p-3 flex items-start gap-2.5 text-[11px] font-mono text-space-400">
          <Info className="h-4 w-4 text-telemetry-cyan shrink-0 mt-0.5" />
          <span>
            <strong className="text-space-200 uppercase">Provenance Notice:</strong> Reconstructed Application Timeline — Compiled from locally queryable telemetry and intelligence records. Physical observation occurrence time is preserved separately from record ingestion and processing timestamps.
          </span>
        </div>
      </div>

      {/* Chronological Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono text-space-400">
            Showing {filteredEvents.length} chronological mission events
          </span>
        </div>

        <div className="relative border-l-2 border-space-800 ml-4 pl-6 space-y-4">
          {filteredEvents.map((ev) => (
            <div key={ev.id} className="relative group">
              {/* Event Dot */}
              <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-space-900 border-2 border-telemetry-cyan/60 group-hover:border-telemetry-cyan flex items-center justify-center transition-colors" />

              {/* Event Card */}
              <div className="rounded-lg bg-space-850 hover:bg-space-800/80 border border-space-700/80 p-4 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {renderTypeIcon(ev.type)}
                    <span className="font-mono text-xs font-bold text-space-100">{ev.title}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-space-400">
                    <span>
                      Occurrence:{' '}
                      <strong className="text-space-200">
                        {new Date(ev.occurrenceTime).toLocaleString()}
                      </strong>
                    </span>
                    {ev.ingestionTime && ev.ingestionTime !== ev.occurrenceTime && (
                      <span className="text-space-500">
                        (Ingested: {new Date(ev.ingestionTime).toLocaleTimeString()})
                      </span>
                    )}
                  </div>
                </div>

                <p className="font-mono text-xs text-space-300 leading-relaxed">
                  {ev.description}
                </p>

                {/* Event Footer & Quick Navigation */}
                <div className="mt-3 pt-2 border-t border-space-800 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-space-500 uppercase tracking-wider">
                    Type: {ev.type} {ev.metric ? `• ${ev.metric}` : ''}
                  </span>

                  {ev.metric && (
                    <button
                      onClick={() => {
                        onSelectMetric(ev.metric as MeasurementType);
                        if (ev.type === 'baseline') onNavigateToTab('baselines');
                        else if (ev.type === 'alert') onNavigateToTab('alerts');
                        else onNavigateToTab('telemetry');
                      }}
                      className="flex items-center gap-1 text-telemetry-cyan hover:underline font-semibold"
                    >
                      <span>Inspect Context</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default MissionTimeline;
