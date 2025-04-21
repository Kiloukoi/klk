import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Check, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

export default function PaymentCallback() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [listingId, setListingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Récupérer les paramètres de l'URL
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const paymentId = params.get('payment_id') || `stripe_${Date.now()}`;
    
    // Récupérer les détails de promotion depuis localStorage
    const promotionDetailsStr = localStorage.getItem('pendingPromotionDetails');
    
    if (status && promotionDetailsStr) {
      try {
        const promotionDetails = JSON.parse(promotionDetailsStr);
        handlePaymentResult(status, paymentId, promotionDetails);
      } catch (e) {
        setError('Informations de promotion invalides');
        setLoading(false);
      }
    } else {
      setError('Informations de paiement manquantes');
      setLoading(false);
    }
  }, [user, location, navigate]);

  const handlePaymentResult = async (status: string, paymentId: string, promotionDetails: any) => {
    try {
      setListingId(promotionDetails.listingId);

      if (status === 'success') {
        // Appeler la fonction RPC pour créer la promotion
        const { data, error } = await supabase.rpc('handle_promotion_payment', {
          p_listing_id: promotionDetails.listingId,
          p_user_id: user!.id,
          p_payment_id: paymentId,
          p_amount: promotionDetails.price,
          p_duration_days: promotionDetails.duration
        });

        if (error) throw error;

        setSuccess(true);
        toast.success('Votre annonce a été mise en avant avec succès !');
      } else {
        setSuccess(false);
        setError('Le paiement a échoué. Veuillez réessayer.');
      }

      // Supprimer les détails de promotion du localStorage
      localStorage.removeItem('pendingPromotionDetails');
    } catch (error: any) {
      console.error('Error handling payment result:', error);
      setSuccess(false);
      setError(error.message || 'Une erreur est survenue lors du traitement du paiement');
    } finally {
      setLoading(false);
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/my-listings" className="inline-flex items-center text-primary hover:underline mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Retour à mes annonces
      </Link>

      <PageHeader title="Résultat du paiement" />

      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Paiement réussi</h2>
            <p className="text-gray-600 mb-6">
              Votre annonce a été mise en avant avec succès et apparaîtra en priorité dans les résultats de recherche.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Paiement échoué</h2>
            <p className="text-gray-600 mb-6">
              {error || 'Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer.'}
            </p>
          </>
        )}

        <div className="flex justify-center space-x-4">
          {listingId && (
            <Link
              to={`/listing/${listingId}`}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Voir mon annonce
            </Link>
          )}
          <Link
            to="/my-listings"
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Mes annonces
          </Link>
        </div>
      </div>
    </div>
  );
}