import React from 'react';
import {
  Orbit,
  Activity,
  ChevronRight,
  Info,
  Cpu,
} from 'lucide-react';

interface LandingPageProps {
  onEnterMissionControl: () => void;
  onSelectAstronautRoster?: () => void;
  totalCrewCount?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterMissionControl,
}) => {
  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 space-y-8 bg-white min-h-[calc(100vh-3rem)]">
      {/* Top HUD Telemetry Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SYS_ONLINE
          </span>
          <span>•</span>
          <span>ARTEMIS VII BIOMEDICAL SUITE</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline text-slate-400">ORBIT: 408 KM • INC: 51.6°</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="hidden sm:inline">DATA: AIR-GAPPED BIO-ENCRYPTED</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-telemetry-cyan font-bold">NASA-STD-3001 ALIGNED</span>
        </div>
      </div>

      {/* Main Hero Cockpit Framing with Corner Reticles */}
      <div className="relative my-auto rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-white via-slate-50/50 to-white p-6 sm:p-10 lg:p-14 shadow-sm overflow-hidden">
        {/* Tactical Corner Crosshairs */}
        <div className="absolute top-3 left-3 text-slate-300 font-mono text-xs select-none">+</div>
        <div className="absolute top-3 right-3 text-slate-300 font-mono text-xs select-none">+</div>
        <div className="absolute bottom-3 left-3 text-slate-300 font-mono text-xs select-none">+</div>
        <div className="absolute bottom-3 right-3 text-slate-300 font-mono text-xs select-none">+</div>

        {/* Ambient Hologram Concentric Accents */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-sky-100/80 pointer-events-none"></div>
        <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full border border-sky-100 pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full border border-slate-100 pointer-events-none"></div>

        <div className="relative z-10 text-center space-y-7 max-w-5xl mx-auto">
          {/* Mission System Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-telemetry-cyan font-mono text-xs shadow-sm">
            <Orbit className="h-4 w-4 animate-spin text-telemetry-cyan" style={{ animationDuration: '10s' }} />
            <span className="tracking-[0.2em] uppercase font-bold text-slate-900">NASA Space Apps 2026</span>
            <span className="text-slate-300">•</span>
            <span className="text-telemetry-cyan font-semibold">DEEP SPACE BIOMEDICAL DECISION SUPPORT</span>
          </div>

          {/* ZOOMED-IN WEBPAGE NAME */}
          <div className="py-2 sm:py-4">
            <div className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.45em] text-slate-400 uppercase mb-2">
              SURVEILLANCE &amp; PREVENTATIVE COUNTERMEASURES
            </div>
            <h1 className="font-mono text-7xl sm:text-9xl md:text-[9.5rem] lg:text-[11rem] font-black tracking-tight uppercase leading-none select-none text-slate-900 drop-shadow-sm transition-transform duration-500 hover:scale-[1.01]">
              COSMO<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-telemetry-cyan to-cyan-500">LOOKUP</span>
            </h1>
            <div className="mt-4 flex items-center justify-center gap-3 text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-slate-600 font-bold">
              <span>ASTRONAUT PHYSIOLOGICAL TELEMETRY</span>
              <span className="text-slate-300">•</span>
              <span className="text-telemetry-cyan">3D ANATOMY DECISION SUPPORT</span>
            </div>
          </div>

          {/* Scientific Brief */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 font-sans leading-relaxed">
            Engineered for long-duration spaceflight operational health monitoring.
            Coupling continuous crew vitals with an interactive 3D human anatomy model, intra-individual nonparametric baseline drift models, and empirical NASA OSDR spaceflight research.
          </p>

          {/* Single High-Impact Premium CTA Button */}
          <div className="pt-3 pb-2 flex flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={onEnterMissionControl}
              className="group relative inline-flex items-center gap-4 px-10 py-5 rounded-xl bg-slate-900 hover:bg-telemetry-cyan text-white font-mono text-sm sm:text-base font-bold uppercase tracking-wider transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.03] focus:outline-none focus:ring-4 focus:ring-sky-200"
            >
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-telemetry-cyan group-hover:text-white transition-colors" />
                <span>Initialize Mission Control</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-white group-hover:translate-x-1.5 transition-all" />
              <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
            </button>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>DIRECT ACCESS TO 5-CREW TELEMETRY &amp; 3D COCKPIT</span>
            </div>
          </div>

          {/* Non-Diagnostic Clinical Safety Interlock Badge */}
          <div className="max-w-2xl mx-auto p-4 rounded-xl border border-slate-200 bg-white text-left font-mono text-xs text-slate-600 flex items-start gap-3 shadow-sm">
            <Info className="h-4 w-4 text-telemetry-cyan shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 uppercase tracking-wider block text-[11px] mb-0.5">
                Flight Surgeon Clinical Decision-Support Directive
              </strong>
              COSMOLOOKUP algorithms provide decision-support surveillance for flight surgeons and biomedical flight controllers. In accordance with NASA-STD-3001, automated alerts and trajectory projections do NOT synthesize autonomous medical diagnoses.
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info HUD */}
      <div className="border-t border-slate-200 pt-5 pb-3 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-telemetry-cyan" />
          <span>COSMOLOOKUP OS v1.0.4 • DEEP SPACE EXPLORATION COCKPIT</span>
        </div>
        <div className="flex items-center gap-4">
          <span>NASA-STD-3001 COMPLIANT</span>
          <span>•</span>
          <span>AIR-GAPPED COMPLIANCE (0.00% EXTERNAL LEAKAGE)</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
