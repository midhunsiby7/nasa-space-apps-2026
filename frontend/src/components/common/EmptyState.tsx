import React from 'react';
import { Database } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Telemetry Records Found',
  description,
  icon = <Database className="w-8 h-8 text-space-500 mb-2" />,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed border-space-700 bg-space-900/40 text-center">
      {icon}
      <h4 className="font-mono text-sm font-medium tracking-wide text-space-300 uppercase">
        {title}
      </h4>
      <p className="mt-1 text-xs text-space-400 max-w-sm">
        {description}
      </p>
    </div>
  );
};
