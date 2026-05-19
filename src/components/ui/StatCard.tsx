import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';

export interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  className?: string;
}

export function StatCard({ label, value, change, icon: Icon, trend, className }: StatCardProps) {
  return (
    <GlassCard className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-text-secondary text-sm font-medium">{label}</span>
        <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
          <Icon className="w-5 h-5 text-gold-500" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-mono font-medium text-gold-500">{value}</div>
        {change && (
          <div className={cn("text-sm mt-1 font-medium", trend === 'up' ? "text-profit-green" : "text-danger")}>
            {trend === 'up' ? '↑' : '↓'} {change} today
          </div>
        )}
      </div>
    </GlassCard>
  );
}
