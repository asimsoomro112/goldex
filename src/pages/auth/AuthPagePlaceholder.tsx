import React from 'react';

export function AuthPagePlaceholder({ title }: { title: string }) {
  return (
    <div className="glass-card p-8 w-full">
      <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
         {title}
      </h2>
      <p className="text-text-secondary">WIP</p>
    </div>
  );
}
