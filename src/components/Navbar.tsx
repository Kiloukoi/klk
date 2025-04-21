import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, LogOut, PlusCircle, MessageCircle, Heart, CalendarCheck, CalendarClock, Menu, X, User, Star, Users, ListChecks } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Logo from './Logo';
import toast from 'react-hot-toast';

interface Profile {
  username: string;
  avatar_url: string;
  gender: string | null;
}

interface NotificationCounts {
  pendingBookings: number;
  unreadMessages: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Default avatar URLs
const defaultAvatarUrl = 'https://ighqyvttbwqivsemrqon.supabase.co/storage/v1/object/public/assets//IMG_0006.PNG';
const maleAvatarUrl = 'https://rjmndugrzyjjmmzdobwt.supabase.co/storage/v1/object/public/assets//Avatar_homme.png';
const femaleAvatarUrl = 'https://rjmndugrzyjjmmzdobwt.supabase.co/storage/v1/object/public/assets//Avatar_femme_2.png';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    username: '',
    avatar_url: '',
    gender: null
  });
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    pendingBookings: 0,
    unreadMessages: 0
  });
  const location = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showConversations, setShowConversations] = useState(true);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      if (!isMobile) {
        setShowConversations(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchNotificationCounts();
      const unsubscribe = subscribeToNotifications();
      
      // Subscribe to profile changes
      const profileSubscription = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          () => {
            fetchProfile();
          }
        )
        .subscribe();
      
      return () => {
        unsubscribe();
        profileSubscription.unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (location.pathname === '/messages') {
        resetMessageNotifications();
      } else if (location.pathname === '/bookings/received') {
        resetBookingNotifications();
      }
    }
  }, [location.pathname, user]);

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, gender')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setRetryCount(0);
      } else {
        const defaultProfile = {
          id: user!.id,
          username: `Kilouwer#${Math.floor(1000 + Math.random() * 9000)}`,
          avatar_url: '',
          gender: null
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([defaultProfile]);

        if (insertError) throw insertError;

        setProfile({
          username: defaultProfile.username,
          avatar_url: defaultProfile.avatar_url,
          gender: defaultProfile.gender
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      
      if (retryCount < MAX_RETRIES && (error.message?.includes('Failed to fetch') || error.code === 'NETWORK_ERROR')) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchProfile();
        }, RETRY_DELAY * Math.pow(2, retryCount));
      } else {
        setProfile({
          username: user?.email?.split('@')[0] || 'Utilisateur',
          avatar_url: '',
          gender: null
        });
      }
    }
  };

  const fetchNotificationCounts = async () => {
    if (!user) return;
    
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('owner_id', user.id)
        .eq('status', 'pending');

      if (bookingsError) throw bookingsError;

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('receiver_id', user.id)
        .is('read_at', null);

      if (messagesError) throw messagesError;

      setNotificationCounts({
        pendingBookings: bookings?.length || 0,
        unreadMessages: messages?.length || 0
      });
    } catch (error: any) {
      console.error('Error fetching notification counts:', error);
      toast.error('Error loading notifications');
    }
  };

  const resetMessageNotifications = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('receiver_id', user!.id)
        .is('read_at', null);

      if (error) throw error;

      setNotificationCounts(prev => ({
        ...prev,
        unreadMessages: 0
      }));
    } catch (error) {
      console.error('Error resetting message notifications:', error);
    }
  };

  const resetBookingNotifications = async () => {
    setNotificationCounts(prev => ({
      ...prev,
      pendingBookings: 0
    }));
  };

  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user!.id}`
        },
        () => {
          fetchNotificationCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `owner_id=eq.${user!.id}`
        },
        () => {
          fetchNotificationCounts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
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
      return `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || user?.email}`;
    }
  };

  return (
    <>
      <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-[60]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Logo className="h-8" />

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/50"
              aria-label={showMobileMenu ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/create-listing"
                className="flex items-center space-x-1 bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-all duration-200 transform hover:scale-105"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Déposer une annonce</span>
              </Link>

              {user ? (
                <div className="flex items-center space-x-6">
                  <div className="flex space-x-4">
                    <Link 
                      to="/bookings/received" 
                      className="relative group flex flex-col items-center"
                    >
                      <div className="p-2 rounded-full hover:bg-neutral-100/50 transition-colors">
                        <CalendarCheck className="w-6 h-6 text-neutral-600 group-hover:text-primary transition-colors" />
                        {notificationCounts.pendingBookings > 0 && (
                          <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {notificationCounts.pendingBookings}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-600 group-hover:text-primary transition-colors mt-1">Réservations reçues</span>
                    </Link>
                    
                    <Link 
                      to="/bookings/sent" 
                      className="flex flex-col items-center group"
                    >
                      <div className="p-2 rounded-full hover:bg-neutral-100/50 transition-colors">
                        <CalendarClock className="w-6 h-6 text-neutral-600 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-xs text-neutral-600 group-hover:text-primary transition-colors mt-1">Mes demandes</span>
                    </Link>

                    <Link 
                      to="/messages" 
                      className="relative flex flex-col items-center group"
                    >
                      <div className="p-2 rounded-full hover:bg-neutral-100/50 transition-colors">
                        <MessageCircle className="w-6 h-6 text-neutral-600 group-hover:text-primary transition-colors" />
                        {notificationCounts.unreadMessages > 0 && (
                          <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {notificationCounts.unreadMessages}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-600 group-hover:text-primary transition-colors mt-1">Messages</span>
                    </Link>

                    <Link 
                      to="/favorites" 
                      className="flex flex-col items-center group"
                    >
                      <div className="p-2 rounded-full hover:bg-neutral-100/50 transition-colors">
                        <Heart className="w-6 h-6 text-neutral-600 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-xs text-neutral-600 group-hover:text-primary transition-colors mt-1">Favoris</span>
                    </Link>
                  </div>

                  <div className="relative group">
                    <button 
                      className="flex items-center space-x-2 focus:outline-none"
                    >
                      <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-r from-primary to-secondary">
                        <img
                          src={getAvatarUrl()}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover ring-2 ring-white"
                          key={`avatar-${profile.avatar_url || profile.gender || 'default'}`} // Add key to force re-render
                        />
                      </div>
                    </button>

                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4 inline mr-2" />
                        Mon profil
                      </Link>
                      <Link
                        to="/my-listings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ListChecks className="w-4 h-4 inline mr-2" />
                        Mes annonces
                      </Link>
                      <Link
                        to="/kilouwers"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Users className="w-4 h-4 inline mr-2" />
                        Kilouwers
                      </Link>
                      <Link
                        to="/my-reviews"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Star className="w-4 h-4 inline mr-2" />
                        Mes évaluations
                      </Link>
                      <button
                        onClick={signOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="flex items-center space-x-1 px-4 py-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/50 transition-all duration-200"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Connexion</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center space-x-1 bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-all duration-200 transform hover:scale-105"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Inscription</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[59] md:hidden" onClick={closeMobileMenu}>
          <div 
            className="fixed inset-y-0 right-0 w-full bg-white shadow-xl z-[60] transition-transform duration-300 ease-in-out"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-full overflow-y-auto pb-20">
              <div className="pt-20 px-4 space-y-6">
                {user ? (
                  <>
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
                      <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-r from-primary to-secondary">
                        <img
                          src={getAvatarUrl()}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover ring-2 ring-white"
                          key={`avatar-mobile-${profile.avatar_url || profile.gender || 'default'}`} // Add key to force re-render
                        />
                      </div>
                      <div>
                        <div className="font-medium text-lg">{profile?.username || user.email}</div>
                        <div className="text-sm text-gray-500">Mon compte</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link
                        to="/create-listing"
                        className="flex items-center justify-center space-x-2 bg-primary text-white p-4 rounded-full hover:bg-primary-dark transition-all duration-200"
                        onClick={closeMobileMenu}
                      >
                        <PlusCircle className="w-6 h-6" />
                        <span>Déposer une annonce</span>
                      </Link>

                      <Link
                        to="/bookings/received"
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/20 transition-all duration-200"
                        onClick={closeMobileMenu}
                      >
                        <div className="flex items-center space-x-3">
                          <CalendarCheck className="w-6 h-6 text-primary" />
                          <span>Réservations reçues</span>
                        </div>
                        {notificationCounts.pendingBookings > 0 && (
                          <span className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {notificationCounts.pendingBookings}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/bookings/sent"
                        className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/20 transition-all duration-200"
                        onClick={closeMobileMenu}
                      >
                        <CalendarClock className="w-6 h-6 text-primary" />
                        <span>Mes demandes</span>
                      </Link>

                      <Link
                        to="/messages"
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/20 transition-all duration-200"
                        onClick={closeMobileMenu}
                      >
                        <div className="flex items-center space-x-3">
                          <MessageCircle className="w-6 h-6 text-primary" />
                          <span>Messages</span>
                        </div>
                        {notificationCounts.unreadMessages > 0 && (
                          <span className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {notificationCounts.unreadMessages}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/favorites"
                        className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/20 transition-all duration-200"
                        onClick={closeMobileMenu}
                      >
                        <Heart className="w-6 h-6 text-primary" />
                        <span>Favoris</span>
                      </Link>

                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/20 transition-all duration-200"
                        onClick={closeMobileMenu}
                      >
                        <User className="w-6 h-6 text-primary" />
                        <span>Mon profil</span>
                      </Link>

                      <Link
                        to="/my-listings"
                        className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/20 transition-all duration-200"
                        onClick={closeMobileMenu}
                      >
                        <ListChecks className="w-6 h-6 text-primary" />
                        <span>Mes annonces</span>
                      </Link>

                      <Link
                        to="/kilouwers"
                        className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/20 transition-all duration-200"
                        onClick={closeMobileMenu}
                      >
                        <Users className="w-6 h-6 text-primary" />
                        <span>Kilouwers</span>
                      </Link>

                      <Link
                        to="/my-reviews"
                        className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/20 transition-all duration-200"
                        onClick={closeMobileMenu}
                      >
                        <Star className="w-6 h-6 text-primary" />
                        <span>Mes évaluations</span>
                      </Link>

                      <button
                        onClick={() => {
                          signOut();
                          closeMobileMenu();
                        }}
                        className="flex items-center space-x-3 w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/20 transition-all duration-200"
                      >
                        <LogOut className="w-6 h-6 text-primary" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <Link
                      to="/login"
                      className="flex items-center justify-center space-x-2 bg-white p-4 rounded-xl border border-gray-200 hover:border-primary/20 transition-all duration-200"
                      onClick={closeMobileMenu}
                    >
                      <LogIn className="w-6 h-6 text-primary" />
                      <span>Connexion</span>
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center space-x-2 bg-primary text-white p-4 rounded-full hover:bg-primary-dark transition-all duration-200"
                      onClick={closeMobileMenu}
                    >
                      <UserPlus className="w-6 h-6" />
                      <span>Inscription</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}