import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GoldButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'solid' | 'ghost' | 'danger';
}

export const GoldButton = React.forwardRef<HTMLButtonElement, GoldButtonProps>(
  ({ className, variant = 'solid', children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
          variant === 'solid' && "bg-[linear-gradient(135deg,#FFD700_0%,#F5C400_30%,#D4AF37_60%,#FFE88A_100%)] text-[#0A0800] shadow-[0_4px_14px_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.5)]",
          variant === 'ghost' && "bg-dark-800/60 backdrop-blur-xl border border-gold-500/20 hover:border-gold-500/50 text-white",
          variant === 'danger' && "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
GoldButton.displayName = "GoldButton";
