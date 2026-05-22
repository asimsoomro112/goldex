import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  trend,
  trendType = 'neutral',
  icon: Icon,
  className,
}: StatCardProps) {
  const isNumber = typeof value === 'number';
  const numericValue = isNumber ? (value as number) : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  const prefix = !isNumber && String(value).startsWith('$') ? '$' : '';
  const suffix = !isNumber && String(value).endsWith('%') ? '%' : '';

  const [displayValue, setDisplayValue] = useState<string | number>(value);

  useEffect(() => {
    if (!isNaN(numericValue)) {
      const controls = animate(0, numericValue, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate(latest) {
          if (isNumber) {
            setDisplayValue(latest.toFixed(2));
          } else {
            setDisplayValue(`${prefix}${latest.toFixed(latest % 1 === 0 ? 0 : 2)}${suffix}`);
          }
        },
      });
      return () => controls.stop();
    } else {
      setDisplayValue(value);
    }
  }, [value, numericValue, isNumber, prefix, suffix]);

  const trendColors = {
    up: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20',
    down: 'text-red-500 bg-red-500/10 border border-red-500/20',
    neutral: 'text-neutral-500 bg-neutral-500/10 border border-neutral-500/20',
  };

  return (
    <Card className={cn('flex flex-col gap-3 relative overflow-hidden', className)}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 text-brand-gold">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider', trendColors[trendType])}>
            {trend}
          </span>
        )}
      </div>

      <div className="flex flex-col mt-2">
        <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-3xl font-bold font-mono text-neutral-900 dark:text-neutral-50 mt-1">
          {displayValue}
        </span>
        {subtext && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {subtext}
          </span>
        )}
      </div>
    </Card>
  );
}
