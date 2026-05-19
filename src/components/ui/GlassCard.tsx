import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  goldBorder?: boolean;
}

export function GlassCard({ className, glow, goldBorder, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-6",
        goldBorder && "border-gold-500/50",
        glow && "hover:shadow-[0_0_40px_rgba(212,175,55,0.35),0_0_80px_rgba(212,175,55,0.15)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
