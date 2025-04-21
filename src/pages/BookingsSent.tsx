import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Star, MessageCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import MonetizationBanner from '../components/MonetizationBanner';

interface Booking {
  id: string;
  listing_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  created_at: string;
  listings: {
    title: string;
    images: string[];
  };
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export default function BookingsSent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null);
  const [completingBooking, setCompletingBooking] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBookings();
      // Check and cancel expired pending bookings
      cancelExpiredPendingBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      // First query to get bookings
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          id,
          listing_id,
          owner_id,
          start_date,
          end_date,
          status,
          total_price,
          created_at,
          listings (
            title,
            images
          ),
          profiles!bookings_owner_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('renter_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const cancelExpiredPendingBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: expiredBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('id')
        .eq('renter_id', user!.id)
        .eq('status', 'pending')
        .lt('start_date', today);

      if (fetchError) throw fetchError;

      if (expiredBookings && expiredBookings.length > 0) {
        const bookingIds = expiredBookings.map(booking => booking.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .in('id', bookingIds);

        if (updateError) throw updateError;

        setBookings(prev => prev.map(booking => 
          bookingIds.includes(booking.id) ? { ...booking, status: 'cancelled' } : booking
        ));
      }
    } catch (error) {
      console.error('Error cancelling expired bookings:', error);
    }
  };

  const handleContact = (booking: Booking) => {
    navigate('/messages', { 
      state: { 
        contactUserId: booking.owner_id,
        listingId: booking.listing_id,
        listingTitle: booking.listings.title
      }
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ? Toutes les données associées (réservations, favoris) seront également supprimées.')) {
      return;
    }

    setCancellingBooking(bookingId);

    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('renter_id', user!.id);

      if (error) throw error;

      toast.success('Booking cancelled successfully');
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ));
    } catch (error: any) {
      toast.error(error.message || 'Error cancelling booking');
    } finally {
      setCancellingBooking(null);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      setCompletingBooking(bookingId);

      const { data, error } = await supabase.rpc('complete_booking', {
        booking_id: bookingId
      });

      if (error) throw error;

      if (data) {
        toast.success('Booking marked as completed');
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, status: 'completed' } : b
        ));
      } else {
        toast.error('This booking cannot be marked as completed');
      }
    } catch (error: any) {
      console.error('Error completing booking:', error);
      toast.error(error.message || 'Error updating booking');
    } finally {
      setCompletingBooking(null);
    }
  };

  const canCompleteBooking = (booking: Booking) => {
    if (booking.status !== 'confirmed') return false;
    const endDate = new Date(booking.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'cancelled':
        return 'Annulée';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  const filteredBookings = selectedStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === selectedStatus);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Mes demandes" />
      
      {/* Monetization Banner */}
      <div className="mb-6">
        <MonetizationBanner />
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Vous n'avez pas encore effectué de réservations
          </h2>
          <p className="text-gray-500">
            Explorez les annonces disponibles et faites votre première réservation !
          </p>
        </div>
      ) : (
        <>
          {/* Status filter tabs */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
            {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                  selectedStatus === status
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'Toutes' : getStatusText(status)}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="relative w-full md:w-48 h-48 md:h-auto">
                    <img
                      src={booking.listings.images?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914'}
                      alt={booking.listings.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-4">
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <Link 
                          to={`/listing/${booking.listing_id}`}
                          className="text-lg font-semibold hover:text-primary transition-colors"
                        >
                          {booking.listings.title}
                        </Link>
                        <div className="flex items-center mt-2 space-x-2">
                          <img
                            src={booking.profiles.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${booking.profiles.username}`}
                            alt={booking.profiles.username}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <span className="text-gray-600">{booking.profiles.username}</span>
                            <div className="text-sm text-gray-500">
                              {new Date(booking.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-2 text-gray-400" />
                            Du {new Date(booking.start_date).toLocaleDateString()} au{' '}
                            {new Date(booking.end_date).toLocaleDateString()}
                          </div>
                          <div className="font-semibold text-primary text-lg">
                            {booking.total_price}€
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleContact(booking)}
                          className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contacter
                        </button>

                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingBooking === booking.id}
                            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingBooking === booking.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : null}
                            Annuler
                          </button>
                        )}

                        {canCompleteBooking(booking) && (
                          <button
                            onClick={() => handleCompleteBooking(booking.id)}
                            disabled={completingBooking === booking.id}
                            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {completingBooking === booking.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : null}
                            Marquer comme terminée
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bottom Monetization Banner */}
      <div className="mt-8">
        <MonetizationBanner />
      </div>
    </div>
  );
}