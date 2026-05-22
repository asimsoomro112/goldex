import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, name = '', size = 'md', className }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  return (
    <div
      className={cn(
        'relative flex-shrink-0 rounded-full p-[2px] bg-gradient-to-tr from-brand-gold-dark via-brand-gold to-brand-gold-light shadow-md',
        sizes[size],
        className
      )}
    >
      <div className="w-full h-full rounded-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center">
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // If image fails to load, clear src to trigger fallback initials
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="font-bold text-brand-gold-dark dark:text-brand-gold">
            {initials}
          </span>
        )}
      </div>
    </div>
  );
}
