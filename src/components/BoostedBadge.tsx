import React from 'react';
import { Sparkles } from 'lucide-react';

interface BoostedBadgeProps {
  className?: string;
  variant?: 'default' | 'small';
}

export default function BoostedBadge({ className = '', variant = 'default' }: BoostedBadgeProps) {
  if (variant === 'small') {
    return (
      <div 
        className={`absolute top-2 left-2 z-10 inline-flex items-center bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs px-2 py-0.5 rounded-full ${className}`}
      >
        <Sparkles className="w-3 h-3 mr-1" />
        Boostée
      </div>
    );
  }

  return (
    <div 
      className={`absolute top-2 left-2 z-10 inline-flex items-center bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm px-3 py-1 rounded-full ${className}`}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Annonce boostée
    </div>
  );
}