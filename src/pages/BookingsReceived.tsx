import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Calendar, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { Link, useNavigate } from 'react-router-dom';
import MonetizationBanner from '../components/MonetizationBanner';

interface Booking {
  id: string;
  listing_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  created_at: string;
  owner_id: string;
  listings: {
    title: string;
    price_per_day: number;
    images: string[];
  };
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export default function BookingsReceived() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          listings (
            title,
            price_per_day,
            images
          ),
          profiles!bookings_renter_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingStatus = async (booking: Booking, status: 'confirmed' | 'cancelled') => {
    try {
      setProcessingBooking(booking.id);

      // Vérifier si la date de début est dans le futur pour les confirmations
      if (status === 'confirmed') {
        const startDate = new Date(booking.start_date);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        if (startDate < tomorrow) {
          toast.error('La date de début doit être à partir de demain');
          return;
        }
      }

      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      const message = status === 'confirmed'
        ? `Votre réservation pour "${booking.listings.title}" a été confirmée ! Du ${new Date(booking.start_date).toLocaleDateString()} au ${new Date(booking.end_date).toLocaleDateString()}.`
        : `Votre réservation pour "${booking.listings.title}" a été refusée.`;

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          content: message,
          sender_id: user!.id,
          receiver_id: booking.renter_id,
          listing_id: booking.listing_id
        });

      if (messageError) throw messageError;

      toast.success(
        status === 'confirmed' 
          ? 'Réservation confirmée avec succès !' 
          : 'Réservation annulée avec succès !'
      );
      
      // Mettre à jour l'état local
      setBookings(prev => prev.map(b => 
        b.id === booking.id ? { ...b, status } : b
      ));
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la réservation:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour de la réservation');
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleContact = (booking: Booking) => {
    navigate('/messages', { 
      state: { 
        contactUserId: booking.renter_id,
        listingId: booking.listing_id,
        listingTitle: booking.listings.title
      }
    });
  };

  const canAcceptBooking = (booking: Booking) => {
    if (booking.status !== 'pending') return false;
    const startDate = new Date(booking.start_date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return startDate >= tomorrow;
  };

  const filteredBookings = selectedStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === selectedStatus);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Réservations reçues" />
      
      {/* Monetization Banner */}
      <div className="mb-6">
        <MonetizationBanner />
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Aucune réservation pour le moment
          </h2>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas encore reçu de réservations pour vos annonces
          </p>
          <Link
            to="/create-listing"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-primary hover:bg-primary-dark transition-all duration-200"
          >
            Créer une annonce
          </Link>
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
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200"
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
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            Du {new Date(booking.start_date).toLocaleDateString()} au{' '}
                            {new Date(booking.end_date).toLocaleDateString()}
                          </div>
                          <div className="font-semibold text-primary text-lg">
                            {booking.total_price}€
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {booking.status === 'pending' && (
                          <>
                            {canAcceptBooking(booking) && (
                              <button
                                onClick={() => handleBookingStatus(booking, 'confirmed')}
                                disabled={processingBooking === booking.id}
                                className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingBooking === booking.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                ) : (
                                  <Check className="w-4 h-4 mr-2" />
                                )}
                                Accepter
                              </button>
                            )}
                            <button
                              onClick={() => handleBookingStatus(booking, 'cancelled')}
                              disabled={processingBooking === booking.id}
                              className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingBooking === booking.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              ) : (
                                <X className="w-4 h-4 mr-2" />
                              )}
                              Refuser
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleContact(booking)}
                          className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contacter
                        </button>
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