import React from 'react';
import { Sparkles } from 'lucide-react';

interface PromotedListingBadgeProps {
  className?: string;
}

export default function PromotedListingBadge({ className = '' }: PromotedListingBadgeProps) {
  return (
    <div 
      className={`absolute top-2 left-2 z-10 inline-flex items-center bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs px-2 py-1 rounded-full ${className}`}
    >
      <Sparkles className="w-3 h-3 mr-1" />
      Annonce mise en avant
    </div>
  );
}