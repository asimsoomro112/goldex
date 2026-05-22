import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number;
  color?: 'gold' | 'green' | 'red';
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  color = 'gold',
  label,
  showPercent = false,
  className,
}: ProgressBarProps) {
  const percent = Math.min(Math.max(0, value), 100);

  const colors = {
    gold: 'bg-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]',
    green: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,163,74,0.4)]',
    red: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]',
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          {label && <span>{label}</span>}
          {showPercent && <span>{percent.toFixed(0)}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn('h-full rounded-full', colors[color])}
        />
      </div>
    </div>
  );
}
