import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PromoteListingButtonProps {
  listingId: string;
  className?: string;
  variant?: 'default' | 'small' | 'large';
}

export default function PromoteListingButton({ 
  listingId, 
  className = '',
  variant = 'default'
}: PromoteListingButtonProps) {
  const [isPromoted, setIsPromoted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if the listing is promoted using a direct query instead of RPC
  useEffect(() => {
    const checkPromotionStatus = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('promotions')
          .select('id')
          .eq('listing_id', listingId)
          .eq('status', 'active')
          .lte('start_date', new Date().toISOString())
          .gte('end_date', new Date().toISOString())
          .maybeSingle();

        if (error) {
          console.error('Error checking promotion status:', error);
          setIsPromoted(false);
          return;
        }

        setIsPromoted(!!data);
      } catch (error) {
        console.error('Error checking promotion status:', error);
        setIsPromoted(false);
      } finally {
        setLoading(false);
      }
    };

    checkPromotionStatus();
  }, [listingId]);
  
  if (loading) {
    return (
      <button 
        disabled
        className={`inline-flex items-center justify-center bg-gray-200 text-gray-500 rounded-full px-3 py-1 text-sm font-medium ${className}`}
      >
        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
        Chargement...
      </button>
    );
  }

  if (isPromoted) {
    return (
      <div 
        className={`inline-flex items-center justify-center bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full px-3 py-1 text-sm font-medium ${className}`}
      >
        <Sparkles className="w-4 h-4 mr-1" />
        Annonce mise en avant
      </div>
    );
  }

  if (variant === 'small') {
    return (
      <Link 
        to={`/promote-listing/${listingId}`}
        className={`inline-flex items-center justify-center bg-accent hover:bg-accent-dark text-white rounded-full px-3 py-1 text-sm font-medium transition-colors ${className}`}
      >
        <Sparkles className="w-3 h-3 mr-1" />
        Mettre en avant
      </Link>
    );
  }

  if (variant === 'large') {
    return (
      <Link 
        to={`/promote-listing/${listingId}`}
        className={`inline-flex items-center justify-center bg-accent hover:bg-accent-dark text-white rounded-lg px-4 py-2 text-base font-medium transition-colors ${className}`}
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Mettre en avant cette annonce
      </Link>
    );
  }

  return (
    <Link 
      to={`/promote-listing/${listingId}`}
      className={`inline-flex items-center justify-center bg-accent hover:bg-accent-dark text-white rounded-full px-4 py-2 text-sm font-medium transition-colors ${className}`}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Mettre en avant
    </Link>
  );
}