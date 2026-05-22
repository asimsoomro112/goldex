import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal box */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={cn('relative w-full z-10', sizes[size])}
          >
            <Card className="shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col bg-white dark:bg-neutral-900">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition duration-150"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="mt-4 overflow-y-auto max-h-[70vh] text-sm text-neutral-600 dark:text-neutral-300">
                {children}
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
