import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, children, className, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 transition-all duration-200',
          hoverable && 'hover:shadow-md hover:border-brand-gold/40 cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
