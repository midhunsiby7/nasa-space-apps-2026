import React from 'react';
import {
  X,
  Radio,
  BatteryCharging,
  Wifi,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SensorChannel {
  id: string;
  hardwareName: string;
  modality: string;
  targetPhysiology: string;
  batteryPercent: number;
  signalQuality: 'excellent' | 'nominal' | 'degraded';
  sampleRate: string;
  lastCalibration: string;
  status: 'transmitting' | 'standby' | 'syncing';
}

const DEMO_SENSORS: SensorChannel[] = [
  {
    id: 'bioharness-01',
    hardwareName: 'BioHarness 3 Thoracic Belt',
    modality: 'Transthoracic ECG & Respiratory Inductance Plethysmography',
    targetPhysiology: 'Heart rate, R-R interval cadence, respiratory rate',
    batteryPercent: 88,
    signalQuality: 'excellent',
    sampleRate: '1.0 Hz (Telemetric burst)',
    lastCalibration: '04:00 UTC Today',
    status: 'transmitting',
  },
  {
    id: 'cnibp-02',
    hardwareName: 'Ambulatory cNIBP Arterial Cuff',
    modality: 'Oscillometric & Photoplethysmographic Volume Clamp',
    targetPhysiology: 'Systolic & diastolic systemic arterial blood pressure',
    batteryPercent: 74,
    signalQuality: 'nominal',
    sampleRate: 'Periodic (every 60 min)',
    lastCalibration: 'Yesterday 22:30 UTC',
    status: 'transmitting',
  },
  {
    id: 'spo2-ring-03',
    hardwareName: 'Continuous SpO2 Pulse Oximetry Ring',
    modality: 'Dual-Wavelength Red/Infrared Reflectance Photometry',
    targetPhysiology: 'Peripheral arterial capillary saturation (SpO2)',
    batteryPercent: 92,
    signalQuality: 'excellent',
    sampleRate: '0.5 Hz continuous',
    lastCalibration: '08:00 UTC Today',
    status: 'transmitting',
  },
  {
    id: 'core-pill-04',
    hardwareName: 'Ingestible Core Temperature Capsule (GI)',
    modality: 'Wireless RF Visceral Telemetry Pill (Transmitted to Belt Receiver)',
    targetPhysiology: 'Deep visceral core body temperature',
    batteryPercent: 62,
    signalQuality: 'nominal',
    sampleRate: '0.1 Hz (every 10s)',
    lastCalibration: 'Pre-ingestion Calibrated',
    status: 'transmitting',
  },
  {
    id: 'actigraphy-05',
    hardwareName: 'Actigraphy Crew Activity Watch',
    modality: 'Tri-Axial MEMS Accelerometer & Ambient Light Photodiode',
    targetPhysiology: 'Sleep/wake rhythm, gross motor activity, circadian phase',
    batteryPercent: 81,
    signalQuality: 'excellent',
    sampleRate: '30-second epoch logging',
    lastCalibration: 'Autonomous Clock Sync',
    status: 'transmitting',
  },
  {
    id: 'dosimeter-06',
    hardwareName: 'Crew Personal Active Radiation Dosimeter (CPD)',
    modality: 'Silicon Semiconductor Silicon Diode Spectrometer',
    targetPhysiology: 'Ionizing space radiation dose equivalent rate (mSv/day)',
    batteryPercent: 95,
    signalQuality: 'excellent',
    sampleRate: 'Continuous micro-dose integration',
    lastCalibration: 'Pre-flight Calibrated (JSC SRAG)',
    status: 'transmitting',
  },
];

interface SensorDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SensorDetailsDrawer: React.FC<SensorDetailsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-space-900 border-l border-space-700/80 shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-space-700 bg-space-950/80">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-telemetry-cyan animate-pulse" />
          <div>
            <h3 className="font-mono text-sm font-bold text-space-100 uppercase tracking-wider">
              Operational Sensor Telemetry
            </h3>
            <span className="font-mono text-[10px] text-space-400">
              Flight Hardware Link & Health
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded text-space-400 hover:text-space-100 hover:bg-space-800 transition-colors"
          title="Close Sensor Panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Synthetic Data Transparency Notice */}
        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 font-mono text-xs text-amber-200">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Simulated Sensor Hardware</span>
          </div>
          <p className="text-[11px] text-space-300 leading-relaxed">
            All listed sensor channels and battery/signal telemetry represent high-fidelity simulated operational flight hardware (<code>is_synthetic = True</code>) modeled after ISS biomedical monitoring suites.
          </p>
        </div>

        {/* Sensor Channels List */}
        <div className="space-y-3">
          {DEMO_SENSORS.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-space-800 bg-space-850 p-3 hover:border-space-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <h4 className="font-mono text-xs font-bold text-space-100">
                    {s.hardwareName}
                  </h4>
                  <span className="font-mono text-[10px] text-space-400 block mt-0.5">
                    {s.modality}
                  </span>
                </div>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-telemetry-emerald/15 border border-telemetry-emerald/30 text-telemetry-emerald">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  ONLINE
                </span>
              </div>

              <div className="text-[11px] text-space-300 bg-space-900/60 p-2 rounded border border-space-800 mb-2 font-mono">
                <span className="text-space-400 block text-[9px] uppercase tracking-wider mb-0.5">Target Physiology</span>
                {s.targetPhysiology}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-space-400">
                <div className="flex items-center gap-1.5">
                  <BatteryCharging className="h-3 w-3 text-telemetry-emerald" />
                  <span>Battery: <strong className="text-space-200">{s.batteryPercent}%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi className="h-3 w-3 text-telemetry-cyan" />
                  <span>Quality: <strong className="text-space-200 uppercase">{s.signalQuality}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-space-400" />
                  <span>Rate: <strong className="text-space-200">{s.sampleRate}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-space-400" />
                  <span>Cal: <strong className="text-space-200">{s.lastCalibration}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
