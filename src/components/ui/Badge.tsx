import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'gold';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  text: string;
}

export const Badge = ({ variant = 'gold', text, className, ...props }: BadgeProps) => {
  const variants = {
    gold: 'bg-brand-gold/15 text-brand-gold-dark border border-brand-gold/30',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    error: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    info: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider',
        variants[variant],
        className
      )}
      {...props}
    >
      {text}
    </span>
  );
};
