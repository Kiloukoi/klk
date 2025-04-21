import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Sparkles, Check, ArrowLeft, CreditCard, Calendar, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { PROMOTION_PLANS, PromotionPlan } from '../types/promotion';

interface Listing {
  id: string;
  title: string;
  price_per_day: number;
  images: string[];
  owner_id: string;
}

export default function PromoteListing() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PromotionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPromoted, setIsPromoted] = useState(false);

  // URLs de paiement externes
  const PAYMENT_URLS = {
    weekly: "https://buy.stripe.com/aEU5nlbEU8Z1cfK9AA", // 7 jours à 2.99€
    monthly: "https://buy.stripe.com/4gw4jhaAQ0sv93ybIJ"  // 30 jours à 9.99€
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchListing();
    // Skip checking promotion status since the function doesn't exist yet
    setIsPromoted(false);
  }, [user, id, navigate]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price_per_day, images, owner_id')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data.owner_id !== user?.id) {
        toast.error('Vous ne pouvez promouvoir que vos propres annonces');
        navigate('/my-listings');
        return;
      }

      setListing(data);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Erreur lors du chargement de l\'annonce');
      navigate('/my-listings');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: PromotionPlan) => {
    setSelectedPlan(plan);
  };

  const handlePromote = async () => {
    if (!selectedPlan || !listing || !user) return;

    setIsProcessing(true);

    try {
      // Since the promotions table doesn't exist yet, we'll just simulate the process
      // and redirect to the payment page
      
      // Store the promotion details in localStorage for later use
      localStorage.setItem('pendingPromotionDetails', JSON.stringify({
        listingId: listing.id,
        planId: selectedPlan.id,
        price: selectedPlan.price,
        duration: selectedPlan.duration
      }));
      
      // Sélectionner l'URL de paiement en fonction du plan choisi
      const paymentUrl = PAYMENT_URLS[selectedPlan.id as keyof typeof PAYMENT_URLS];
      
      // Rediriger vers la page de paiement externe avec les paramètres
      const redirectUrl = `${paymentUrl}?listing_id=${listing.id}&amount=${selectedPlan.price}`;
      
      // Rediriger vers la page de paiement
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('Error processing promotion:', error);
      toast.error('Erreur lors du traitement de la promotion');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isPromoted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Annonce déjà mise en avant</h2>
          <p className="text-gray-600 mb-6">
            Votre annonce est déjà mise en avant et apparaît en priorité dans les résultats de recherche.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to={`/listing/${id}`}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Voir mon annonce
            </Link>
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to={`/listing/${id}`} className="inline-flex items-center text-primary hover:underline mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Retour à l'annonce
      </Link>

      <PageHeader title="Mettre en avant votre annonce" />

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        {listing && (
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 rounded-md overflow-hidden mr-4">
              <img
                src={listing.images?.[0] || 'https://tdibyqgyclnpyvojfvbp.supabase.co/storage/v1/object/public/assets//kilou%20.png'}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{listing.title}</h3>
              <p className="text-primary font-medium">{listing.price_per_day}€ / jour</p>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <Info className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-800">Pourquoi mettre en avant votre annonce ?</h4>
              <p className="text-yellow-700 text-sm mt-1">
                Les annonces mises en avant apparaissent en priorité dans les résultats de recherche et bénéficient d'une visibilité accrue, augmentant ainsi vos chances de location.
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Choisissez votre formule</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {PROMOTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handlePlanSelect(plan)}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedPlan?.id === plan.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{plan.name}</h4>
                <div className="text-lg font-bold text-primary">{plan.price.toFixed(2)}€</div>
              </div>
              <div className="flex items-center text-gray-600 text-sm mb-2">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{plan.duration} jours</span>
              </div>
              <p className="text-sm text-gray-600">{plan.description}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={handlePromote}
            disabled={!selectedPlan || isProcessing}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Redirection vers le paiement...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                {selectedPlan ? `Payer ${selectedPlan.price.toFixed(2)}€` : 'Sélectionnez une formule'}
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Paiement sécurisé par carte bancaire
          </p>
        </div>
      </div>
    </div>
  );
}