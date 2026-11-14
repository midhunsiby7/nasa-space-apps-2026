import React from 'react';
import { Compass, CheckSquare, Shield } from 'lucide-react';
import { GuidanceItem } from '../../types/assessment';

interface GuidanceRecommendationListProps {
  guidance: GuidanceItem[];
}

export const GuidanceRecommendationList: React.FC<GuidanceRecommendationListProps> = ({ guidance }) => {
  return (
    <div className="rounded-lg bg-space-850 border border-space-700/80 p-4 shadow-hud-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-space-300">
          <Compass className="h-4 w-4 text-telemetry-emerald" />
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-space-100">
            Safe Deterministic Operational Guidance
          </h4>
        </div>
        <span className="text-[10px] font-mono text-space-400 bg-space-800 px-2 py-0.5 rounded border border-space-700">
          Non-Diagnostic
        </span>
      </div>

      <div className="space-y-2.5">
        {guidance.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-space-900/60 border border-space-800 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-space-100 flex items-center gap-2">
                <CheckSquare className="h-3.5 w-3.5 text-telemetry-cyan shrink-0" />
                {item.action}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-space-800 text-telemetry-cyan border border-space-700 shrink-0">
                {item.category.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-[11px] font-mono text-space-400 pl-5.5 leading-relaxed">
              <strong className="text-space-300">Rationale:</strong> {item.rationale}
            </p>

            <div className="pt-1 pl-5.5 flex items-center gap-2 text-[10px] font-mono text-space-500">
              <Shield className="h-3 w-3" />
              <span>Operational Guidance — Not a medical prescription</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
