import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Star, Edit, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { Link } from 'react-router-dom';
import MonetizationBanner from '../components/MonetizationBanner';

interface Review {
  id: string;
  booking_id: string;
  listing_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  listings: {
    title: string;
    images: string[];
  };
}

interface PendingBooking {
  id: string;
  listing_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  listings: {
    title: string;
    images: string[];
  };
}

export default function MyReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingBooking[]>([]);

  useEffect(() => {
    if (user) {
      fetchReviews();
      fetchPendingReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          booking_id,
          listing_id,
          rating,
          comment,
          created_at,
          updated_at,
          listings (
            title,
            images
          )
        `)
        .eq('reviewer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des évaluations:', error);
      toast.error('Erreur lors du chargement des évaluations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingReviews = async () => {
    try {
      // Récupérer les réservations terminées qui n'ont pas encore d'évaluation
      const { data: completedBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          listing_id,
          owner_id,
          start_date,
          end_date,
          listings (
            title,
            images
          )
        `)
        .eq('renter_id', user!.id)
        .eq('status', 'completed');

      if (bookingsError) throw bookingsError;

      if (!completedBookings || completedBookings.length === 0) {
        setPendingReviews([]);
        return;
      }

      // Récupérer les évaluations existantes pour ces réservations
      const bookingIds = completedBookings.map(booking => booking.id);
      
      try {
        const { data: existingReviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('booking_id')
          .in('booking_id', bookingIds)
          .eq('reviewer_id', user!.id);

        if (reviewsError) throw reviewsError;

        // Filtrer les réservations qui n'ont pas encore d'évaluation
        const reviewedBookingIds = new Set(existingReviews?.map(review => review.booking_id) || []);
        const pendingBookings = completedBookings.filter(
          booking => !reviewedBookingIds.has(booking.id)
        );

        setPendingReviews(pendingBookings);
      } catch (error) {
        console.error('Erreur lors du chargement des réservations en attente d\'évaluation:', error);
        setPendingReviews([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations en attente d\'évaluation:', error);
      setPendingReviews([]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette évaluation ?')) {
      return;
    }

    setDeleting(id);

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)
        .eq('reviewer_id', user!.id); // Sécurité supplémentaire

      if (error) throw error;

      toast.success('Évaluation supprimée avec succès');
      setReviews(prev => prev.filter(review => review.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'évaluation:', error);
      toast.error('Erreur lors de la suppression de l\'évaluation');
    } finally {
      setDeleting(null);
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
      <PageHeader title="Évaluations reçues" />

      {/* Monetization Banner */}
      <div className="mb-6">
        <MonetizationBanner url="https://phoampor.top/4/9154510" />
      </div>

      {pendingReviews.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Réservations à évaluer</h2>
          <div className="grid gap-4">
            {pendingReviews.map((booking) => (
              <div
                key={booking.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium">
                      Vous n'avez pas encore évalué votre séjour pour "{booking.listings.title}"
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Du {new Date(booking.start_date).toLocaleDateString()} au{' '}
                      {new Date(booking.end_date).toLocaleDateString()}
                    </p>
                    <Link
                      to={`/review/create/${booking.id}`}
                      className="mt-2 inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                      Évaluer cette réservation
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Évaluations publiées</h2>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Vous n'avez pas encore publié d'évaluations
          </h2>
          <p className="text-gray-500 mb-4">
            Après avoir séjourné dans un logement, vous pourrez partager votre expérience ici
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-48 h-48 md:h-auto">
                  <img
                    src={review.listings.images?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914'}
                    alt={review.listings.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 p-4">
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <Link 
                        to={`/listing/${review.listing_id}`}
                        className="text-lg font-semibold hover:text-primary transition-colors"
                      >
                        {review.listings.title}
                      </Link>
                      <div className="flex items-center mt-2">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-gray-700">{review.comment}</p>
                    </div>

                    <div className="mt-4 flex justify-end space-x-2">
                      <Link
                        to={`/review/edit/${review.id}`}
                        className="p-2 text-gray-600 hover:text-primary"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={deleting === review.id}
                        className={`p-2 text-gray-600 hover:text-red-600 ${
                          deleting === review.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {deleting === review.id ? (
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}