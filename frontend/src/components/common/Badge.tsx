import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'nominal' | 'warning' | 'alert' | 'info' | 'neutral';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'sm',
}) => {
  const variantStyles = {
    nominal: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    alert: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    neutral: 'bg-space-800 text-space-300 border-space-600/40',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 tracking-wide font-mono',
    md: 'text-xs px-2.5 py-1 tracking-wider font-mono font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border uppercase transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
