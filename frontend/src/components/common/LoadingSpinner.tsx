import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Acquiring Telemetry Stream...',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <Loader2 className={`${sizeMap[size]} text-telemetry-cyan animate-spin mb-3`} />
      <span className="font-mono text-xs tracking-wider text-space-400 uppercase">
        {label}
      </span>
    </div>
  );
};
