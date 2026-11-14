import React from 'react';
import { ShieldCheck, Info, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProvenanceNoticeProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvenanceNotice: React.FC<ProvenanceNoticeProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl bg-space-900 border border-space-600 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-space-400 hover:bg-space-800 hover:text-space-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-space-700/80 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-telemetry-cyan/15 border border-telemetry-cyan/40 text-telemetry-cyan">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-mono text-base font-bold uppercase tracking-wider text-space-100">
              Data Provenance &amp; Scientific Integrity
            </h3>
            <p className="font-mono text-xs text-space-400">
              COSMOLOOKUP Dual-Source Fidelity Standard
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-xs font-mono text-space-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
          {/* Dual Origin Explanation */}
          <div className="rounded-lg bg-space-850 p-3.5 border border-space-700">
            <h4 className="font-semibold text-space-100 flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-telemetry-cyan" />
              Dual-Origin Data Transparency
            </h4>
            <p className="text-space-300">
              In deep-space mission telemetry analysis, clear differentiation between empirical flight measurements and mathematical simulations is essential. COSMOLOOKUP preserves this distinction via the strict <code className="text-telemetry-cyan font-bold">is_synthetic</code> boolean on every telemetry record:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="p-2.5 rounded bg-blue-950/30 border border-blue-500/30">
                <span className="font-bold text-blue-300 block mb-1">
                  EMPIRICAL DATA (is_synthetic: false)
                </span>
                <span className="text-[11px] text-space-300">
                  Historical flight vitals or analog studies (e.g., NASA LSDA, HERA, ingestible telemetry sensors).
                </span>
              </div>
              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/30">
                <span className="font-bold text-amber-300 block mb-1">
                  SYNTHETIC DATA (is_synthetic: true)
                </span>
                <span className="text-[11px] text-space-300">
                  Biomechanical simulation models and generated telemetry curves for algorithmic testing.
                </span>
              </div>
            </div>
          </div>

          {/* Quality Indicators */}
          <div className="rounded-lg bg-space-850 p-3.5 border border-space-700">
            <h4 className="font-semibold text-space-100 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-telemetry-emerald" />
              Sensor Quality Classifications
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><strong className="text-emerald-400">NOMINAL:</strong> Sensor signal within calibrated tolerance thresholds.</li>
              <li><strong className="text-cyan-400">INTERPOLATED:</strong> Sensor packet interpolated between discrete sample intervals.</li>
              <li><strong className="text-amber-400">DEGRADED / NOISY:</strong> High RF noise or motion artifact identified during acquisition.</li>
              <li><strong className="text-purple-400">CALIBRATING:</strong> Baseline recalibration in progress.</li>
            </ul>
          </div>

          {/* Scientific Disclaimer */}
          <div className="rounded-lg bg-space-950/80 p-3.5 border border-space-700/80 text-[11px] text-space-400">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-space-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-space-300 block">Mission &amp; Medical Disclaimer:</strong>
                COSMOLOOKUP is an observational technology demonstrator created for the NASA Space Apps Challenge 2026. It is not an official NASA portal and does not deliver certified medical diagnosis, prognosis, or clinical treatment protocols.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-space-800 hover:bg-space-750 border border-space-600 font-mono text-xs text-space-100 transition-colors"
          >
            Acknowledge &amp; Return
          </button>
        </div>
      </div>
    </div>
  );
};
