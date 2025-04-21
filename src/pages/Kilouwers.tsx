import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, UserMinus, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import MonetizationBanner from '../components/MonetizationBanner';

interface Follow {
  id: string;
  following_id: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
    location: string;
  };
}

export default function Kilouwers() {
  const { user } = useAuth();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFollows();
    }
  }, [user]);

  const fetchFollows = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          following_id,
          created_at,
          profiles!follows_following_id_fkey (
            username,
            avatar_url,
            location
          )
        `)
        .eq('follower_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFollows(data || []);
    } catch (error) {
      console.error('Error fetching follows:', error);
      toast.error('Erreur lors du chargement des kilouwers');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (followingId: string) => {
    if (!user) return;

    setUnfollowingId(followingId);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

      if (error) throw error;

      setFollows(prev => prev.filter(follow => follow.following_id !== followingId));
      toast.success('Vous ne suivez plus cet utilisateur');
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Erreur lors du désabonnement');
    } finally {
      setUnfollowingId(null);
    }
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
      <PageHeader title="Mes Kilouwers" />

      {/* Monetization Banner */}
      <div className="mb-6">
        <MonetizationBanner url="https://www.profitableratecpm.com/prtwx7u63?key=b8b3ba83074bbb1330d3ec04c489a161" />
      </div>

      {follows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Vous ne suivez personne pour le moment
          </h2>
          <p className="text-gray-500 mb-4">
            Suivez d'autres utilisateurs pour voir leurs annonces dans votre fil d'actualité
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-primary hover:bg-primary-dark"
          >
            <Users className="w-5 h-5 mr-2" />
            Découvrir des utilisateurs
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {follows.map((follow) => (
            <div
              key={follow.id}
              className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={follow.profiles.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${follow.profiles.username}`}
                  alt={follow.profiles.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <Link 
                    to={`/user/${follow.following_id}/listings`}
                    className="font-medium hover:text-primary"
                  >
                    {follow.profiles.username}
                  </Link>
                  {follow.profiles.location && (
                    <p className="text-sm text-gray-500">{follow.profiles.location}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Link
                  to={`/user/${follow.following_id}/listings`}
                  className="p-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <LinkIcon className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => handleUnfollow(follow.following_id)}
                  disabled={unfollowingId === follow.following_id}
                  className="flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {unfollowingId === follow.following_id ? (
                    <div className="w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserMinus className="w-5 h-5 mr-2" />
                      Ne plus suivre
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
