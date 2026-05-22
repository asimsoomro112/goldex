import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 text-neutral-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition duration-200 text-sm',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 text-neutral-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        )}
        {!error && helperText && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
