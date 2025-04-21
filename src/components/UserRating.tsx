import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface UserRatingProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export default function UserRating({ 
  userId, 
  size = 'md', 
  showCount = true,
  className = ''
}: UserRatingProps) {
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchRatingStats();
    }
  }, [userId]);

  const fetchRatingStats = async () => {
    try {
      // Try to use the direct query to get reviews
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('listing_id', userId);

      if (error) {
        console.error('Erreur lors du chargement des évaluations:', error);
        setAverageRating(0);
        setReviewCount(0);
        setLoading(false);
        return;
      }
      
      if (data && data.length > 0) {
        // Calculate average manually
        const sum = data.reduce((acc, review) => acc + review.rating, 0);
        const average = sum / data.length;
        
        setAverageRating(parseFloat(average.toFixed(1)));
        setReviewCount(data.length);
      } else {
        setAverageRating(0);
        setReviewCount(0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setAverageRating(0);
      setReviewCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getStarSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-6 h-6';
      default: return 'w-4 h-4';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };

  const renderStars = () => {
    const starSize = getStarSize();
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ));
  };

  if (loading) {
    return <div className="flex space-x-1 opacity-50">{renderStars()}</div>;
  }

  if (reviewCount === 0) {
    return (
      <div className={`text-gray-500 ${getTextSize()} ${className}`}>
        Aucun avis
      </div>
    );
  }

  return (
    <Link to={`/user/${userId}/reviews`} className={`flex items-center hover:opacity-80 ${className}`}>
      <div className="flex mr-1">
        {renderStars()}
      </div>
      <span className={`font-medium ${getTextSize()}`}>
        {averageRating.toFixed(1)}
      </span>
      {showCount && (
        <span className={`text-gray-500 ml-1 ${getTextSize()}`}>
          ({reviewCount})
        </span>
      )}
    </Link>
  );
}