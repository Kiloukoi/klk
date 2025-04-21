import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin, UserPlus, UserMinus, Users, Phone, Mail, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import UserRating from '../components/UserRating';
import { useAuth } from '../contexts/AuthContext';
import MonetizationBanner from '../components/MonetizationBanner';

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  location: string;
  city: string;
  phone_number: string;
  share_phone_number: boolean;
  gender: string | null;
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

// Default avatar URLs
const defaultAvatarUrl = 'https://ighqyvttbwqivsemrqon.supabase.co/storage/v1/object/public/assets//IMG_0006.PNG';
const maleAvatarUrl = 'https://rjmndugrzyjjmmzdobwt.supabase.co/storage/v1/object/public/assets//Avatar_homme.png';
const femaleAvatarUrl = 'https://rjmndugrzyjjmmzdobwt.supabase.co/storage/v1/object/public/assets//Avatar_femme_2.png';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
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
        .select('id, username, avatar_url, location, city, phone_number, share_phone_number, gender')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Erreur lors du chargement du profil');
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
      toast.error('Erreur lors du chargement des statistiques');
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

  const handleContact = () => {
    navigate('/messages', { 
      state: { 
        contactUserId: userId,
        username: profile?.username
      }
    });
  };

  // Function to get the appropriate avatar URL
  const getAvatarUrl = () => {
    if (profile?.avatar_url) {
      return profile.avatar_url;
    } else if (profile?.gender === 'male') {
      return maleAvatarUrl;
    } else if (profile?.gender === 'female') {
      return femaleAvatarUrl;
    } else {
      return `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username}`;
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

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Utilisateur introuvable</h2>
          <p className="mb-4">Cet utilisateur n'existe pas ou a supprimé son compte.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary hover:underline"
          >
            &larr; Retour
          </button>
        </div>

        {/* Monetization Banner */}
        <div className="mb-6">
          <MonetizationBanner url="https://www.profitableratecpm.com/prtwx7u63?key=b8b3ba83074bbb1330d3ec04c489a161" />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-32 h-32 rounded-full p-0.5 bg-gradient-to-r from-primary to-secondary mb-4 md:mb-0 md:mr-6">
              <img
                src={getAvatarUrl()}
                alt={profile.username}
                className="w-full h-full rounded-full object-cover ring-2 ring-white"
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              
              {profile.location && (
                <div className="flex items-center justify-center md:justify-start text-gray-600 mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {profile.city && !profile.location && (
                <div className="flex items-center justify-center md:justify-start text-gray-600 mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{profile.city}</span>
                </div>
              )}
              
              {/* User Rating */}
              <div className="flex items-center justify-center md:justify-start mt-2">
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
              
              <div className="flex items-center justify-center md:justify-start space-x-4 mt-3">
                <div className="text-gray-600">
                  <span className="font-medium">{followStats.followers}</span> abonnés
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">{followStats.following}</span> abonnements
                </div>
              </div>

              {profile.phone_number && profile.share_phone_number && (
                <div className="flex items-center justify-center md:justify-start text-gray-600 mt-2">
                  <Phone className="w-4 h-4 mr-1" />
                  <span>{profile.phone_number}</span>
                </div>
              )}
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                {user && user.id !== userId && (
                  <>
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
                    
                    <button
                      onClick={handleContact}
                      className="flex items-center px-4 py-2 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-colors"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Contacter
                    </button>
                  </>
                )}
                
                <Link
                  to={`/user/${userId}/listings`}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Voir les annonces
                </Link>
                
                <Link
                  to={`/user/${userId}/reviews`}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Évaluations
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Monetization Banner */}
        <div className="mt-8">
          <MonetizationBanner url="https://phoampor.top/4/9154371" />
        </div>
      </div>
    </div>
  );
}
