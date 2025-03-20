import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

interface Booking {
  id: string;
  listing_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  listings: {
    title: string;
    images: string[];
  };
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export default function CreateReview() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && bookingId) {
      fetchBooking();
    }
  }, [user, bookingId]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          listings (
            title,
            images
          ),
          profiles!bookings_owner_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('id', bookingId)
        .eq('renter_id', user!.id)
        .eq('status', 'completed')
        .single();

      if (error) throw error;

      // Vérifier si une évaluation existe déjà
      const { data: existingReview, error: reviewError } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('reviewer_id', user!.id)
        .maybeSingle();

      if (reviewError) {
        console.error('Erreur lors de la vérification des évaluations existantes:', reviewError);
      }

      if (existingReview) {
        toast.error('Vous avez déjà évalué cette réservation');
        navigate('/my-reviews');
        return;
      }

      setBooking(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la réservation:', error);
      toast.error('Erreur lors du chargement de la réservation');
      navigate('/my-reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!booking) return;
    
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: booking.id,
          listing_id: booking.listing_id,
          owner_id: booking.owner_id,
          reviewer_id: user!.id,
          rating,
          comment
        });

      if (error) throw error;

      toast.success('Évaluation publiée avec succès');
      navigate('/my-reviews');
    } catch (error) {
      console.error('Erreur lors de la publication de l\'évaluation:', error);
      toast.error('Erreur lors de la publication de l\'évaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setRating(i + 1)}
          onMouseEnter={() => setHoverRating(i + 1)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-8 h-8 ${
              i < (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Réservation introuvable</h2>
          <p className="mb-4">Cette réservation n'existe pas ou n'est pas éligible à une évaluation.</p>
          <button
            onClick={() => navigate('/my-reviews')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Retour à mes évaluations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Évaluer votre séjour" />

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <img
              src={booking.listings.images?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914'}
              alt={booking.listings.title}
              className="w-20 h-20 object-cover rounded-md mr-4"
            />
            <div>
              <h2 className="text-xl font-semibold">{booking.listings.title}</h2>
              <p className="text-gray-600">
                Du {new Date(booking.start_date).toLocaleDateString()} au{' '}
                {new Date(booking.end_date).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                Propriétaire : {booking.profiles.username}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment évaluez-vous votre expérience ?
              </label>
              <div className="flex space-x-1">
                {renderStars()}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {rating === 1 && 'Très insatisfait'}
                {rating === 2 && 'Insatisfait'}
                {rating === 3 && 'Correct'}
                {rating === 4 && 'Satisfait'}
                {rating === 5 && 'Très satisfait'}
              </div>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Votre commentaire (optionnel)
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/my-reviews')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {submitting ? 'Publication...' : 'Publier l\'évaluation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}