import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Telemetry Transmission Error',
  message,
  details,
  onRetry,
}) => {
  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-4 text-space-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-mono text-sm font-semibold tracking-wide text-rose-300 uppercase">
            {title}
          </h4>
          <p className="mt-1 text-xs text-space-300 leading-relaxed">
            {message}
          </p>
          {details && (
            <pre className="mt-2 text-[11px] font-mono bg-space-950/70 p-2 rounded border border-rose-500/20 text-rose-300/80 overflow-x-auto">
              {details}
            </pre>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-mono text-rose-200 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-attempt Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
