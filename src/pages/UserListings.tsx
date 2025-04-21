import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, MapPin, UserPlus, UserMinus, Users, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import ListingImage from '../components/ListingImage';
import UserRating from '../components/UserRating';
import BoostedBadge from '../components/BoostedBadge';
import { useAuth } from '../contexts/AuthContext';

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  location: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price_per_day: number;
  location: string;
  images: string[];
  is_promoted?: boolean;
  categories?: {
    name: string;
  };
}

interface FollowStats {
  followers: number;
  following: number;
  isFollowing: boolean;
}

interface OwnerRating {
  average_rating: number;
  review_count: number;
}

const defaultAvatarUrl = 'https://ighqyvttbwqivsemrqon.supabase.co/storage/v1/object/public/assets//IMG_0006.PNG';

export default function UserListings() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStats, setFollowStats] = useState<FollowStats>({
    followers: 0,
    following: 0,
    isFollowing: false
  });
  const [followLoading, setFollowLoading] = useState(false);
  const [ownerRating, setOwnerRating] = useState<OwnerRating | null>(null);
  const [loadingRating, setLoadingRating] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchListings();
      fetchOwnerRating();
      if (user) {
        fetchFollowStats();
      }
    }
  }, [userId, user]);

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
      console.error('Error loading profile:', error);
      toast.error('Error loading profile');
    }
  };

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Error loading listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerRating = async () => {
    setLoadingRating(true);
    try {
      const { data, error } = await supabase
        .rpc('get_owner_rating', { owner_id: userId });

      if (error) {
        console.error('Error loading owner rating:', error);
        setOwnerRating({
          average_rating: 0,
          review_count: 0
        });
        return;
      }

      setOwnerRating(data || { average_rating: 0, review_count: 0 });
    } catch (error) {
      console.error('Error loading owner rating:', error);
      setOwnerRating({
        average_rating: 0,
        review_count: 0
      });
    } finally {
      setLoadingRating(false);
    }
  };

  const fetchFollowStats = async () => {
    try {
      // Get follower count
      const { data: followerCount, error: followerError } = await supabase
        .rpc('get_follower_count', { user_id: userId });

      if (followerError) throw followerError;

      // Get following count
      const { data: followingCount, error: followingError } = await supabase
        .rpc('get_following_count', { user_id: userId });

      if (followingError) throw followingError;

      // Check if current user is following
      const { data: isFollowing, error: followingCheckError } = await supabase
        .rpc('is_following', { 
          follower_id: user!.id,
          following_id: userId
        });

      if (followingCheckError) throw followingCheckError;

      setFollowStats({
        followers: followerCount || 0,
        following: followingCount || 0,
        isFollowing: isFollowing || false
      });
    } catch (error) {
      console.error('Error fetching follow stats:', error);
      toast.error('Error fetching follow statistics');
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour suivre un utilisateur');
      return;
    }

    if (user.id === userId) {
      toast.error('Vous ne pouvez pas vous suivre vous-même');
      return;
    }

    setFollowLoading(true);
    try {
      if (followStats.isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        toast.success('Vous ne suivez plus cet utilisateur');
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) throw error;
        toast.success('Vous suivez maintenant cet utilisateur');
      }

      // Refresh follow stats
      fetchFollowStats();
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setFollowLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`w-5 h-5 ${
            i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
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
        <div className="mb-8">
          <div className="flex items-center justify-center flex-col">
            <img
              src={profile.avatar_url || defaultAvatarUrl}
              alt={profile.username}
              className="w-24 h-24 rounded-full mb-4"
            />
            <h1 className="text-2xl font-bold mb-2">{profile.username}</h1>
            {profile.location && (
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{profile.location}</span>
              </div>
            )}
            
            {/* User Rating */}
            <div className="flex items-center mb-2">
              {loadingRating ? (
                <div className="flex space-x-1 opacity-50">
                  {renderStars(0)}
                </div>
              ) : ownerRating && ownerRating.review_count > 0 ? (
                <>
                  <div className="flex mr-2">
                    {renderStars(Math.round(ownerRating.average_rating))}
                  </div>
                  <span className="text-gray-700 font-medium">{ownerRating.average_rating.toFixed(1)}</span>
                  <span className="text-gray-500 ml-1">({ownerRating.review_count} avis)</span>
                </>
              ) : (
                <span className="text-gray-500">Aucun avis</span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <Link 
                to={`/user/${userId}/reviews`}
                className="text-primary hover:text-primary-dark text-sm"
              >
                Voir toutes les évaluations
              </Link>
              <span className="text-gray-300">|</span>
              <button 
                className="flex items-center text-gray-600 hover:text-gray-800"
                onClick={() => {}}
              >
                <Users className="w-4 h-4 mr-1" />
                <span className="text-sm">
                  {followStats.followers} kilouwer{followStats.followers !== 1 ? 's' : ''}
                </span>
              </button>
              <span className="text-gray-300">|</span>
              <button 
                className="flex items-center text-gray-600 hover:text-gray-800"
                onClick={() => {}}
              >
                <Users className="w-4 h-4 mr-1" />
                <span className="text-sm">
                  {followStats.following} kilouwer{followStats.following !== 1 ? 's' : ''}
                </span>
              </button>
            </div>
            {user && user.id !== userId && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center px-4 py-2 rounded-full transition-colors ${
                  followStats.isFollowing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {followLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : followStats.isFollowing ? (
                  <>
                    <UserMinus className="w-5 h-5 mr-2" />
                    Ne plus suivre
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Suivre
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <PageHeader title="Annonces de l'utilisateur" />

      {listings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Cet utilisateur n'a pas encore d'annonces
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative w-full" style={{ paddingTop: '75%' }}>
                {/* Only show the badge on the user's own listings page */}
                {listing.is_promoted && <BoostedBadge variant="small" />}
                <ListingImage
                  src={listing.images?.[0]}
                  alt={listing.title}
                />
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1">
                  {listing.title}
                </h3>
                
                <div className="flex items-center text-gray-600 mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm line-clamp-1">{listing.location}</span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    {listing.categories?.name || 'Catégorie non spécifiée'}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {listing.price_per_day}€ <span className="text-sm font-normal">/jour</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}