import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Star, User } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  location: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  listing_id: string;
  reviewer_id: string;
  listings: {
    title: string;
    images: string[];
  };
  profiles: {
    username: string;
    avatar_url: string;
  };
}

const defaultAvatarUrl = 'https://ighqyvttbwqivsemrqon.supabase.co/storage/v1/object/public/assets//IMG_0006.PNG';

export default function UserReviews() {
  const { userId } = useParams<{ userId: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ average_rating: number; review_count: number }>({
    average_rating: 0,
    review_count: 0
  });

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchReviews();
      fetchRatingStats();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, location')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      toast.error('Error loading profile');
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          listings (
            title,
            images
          ),
          profiles!reviews_reviewer_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      toast.error('Error loading reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_owner_rating', { owner_id: userId });

      if (error) throw error;
      if (data) {
        setStats({
          average_rating: data.average_rating || 0,
          review_count: data.review_count || 0
        });
      }
    } catch (error) {
      console.error('Error loading rating stats:', error);
      setStats({
        average_rating: 0,
        review_count: 0
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`w-5 h-5 ${
            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {profile && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <img
              src={profile.avatar_url || defaultAvatarUrl}
              alt={profile.username}
              className="w-24 h-24 rounded-full object-cover mb-4 md:mb-0 md:mr-6"
            />
            <div>
              <h2 className="text-2xl font-semibold">{profile.username}</h2>
              {profile.location && (
                <p className="text-gray-600 mb-2">{profile.location}</p>
              )}
              <div className="flex items-center">
                <div className="flex mr-2">
                  {renderStars(Math.round(stats.average_rating))}
                </div>
                <span className="text-gray-700 font-medium">{stats.average_rating.toFixed(1)}</span>
                <span className="text-gray-500 ml-1">({stats.review_count} avis)</span>
              </div>
              <Link
                to={`/user/${profile.id}/listings`}
                className="text-primary hover:text-primary-dark mt-2 inline-block"
              >
                Voir les annonces de {profile.username}
              </Link>
            </div>
          </div>
        </div>
      )}

      <PageHeader title="Évaluations" />

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun avis pour le moment
          </h2>
          <p className="text-gray-500">
            Cet utilisateur n'a pas encore reçu d'évaluations
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-start mb-4">
                <img
                  src={review.profiles.avatar_url || defaultAvatarUrl}
                  alt={review.profiles.username}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <div className="font-medium">{review.profiles.username}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <Link
                  to={`/listing/${review.listing_id}`}
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  {review.listings.title}
                </Link>
              </div>
              
              <div className="flex mb-3">
                {renderStars(review.rating)}
              </div>
              
              {review.comment && (
                <p className="text-gray-700">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}