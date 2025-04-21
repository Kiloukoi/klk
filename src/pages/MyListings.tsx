import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Package, Sparkles, Pause, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import ListingImage from '../components/ListingImage';
import PromoteListingButton from '../components/PromoteListingButton';
import PromotedListingBadge from '../components/PromotedListingBadge';
import BoostedBadge from '../components/BoostedBadge';
import MonetizationBanner from '../components/MonetizationBanner';

interface Listing {
  id: string;
  title: string;
  description: string;
  price_per_day: number;
  location: string;
  images: string[];
  created_at: string;
  categories: {
    name: string;
  };
  is_promoted?: boolean;
  is_paused?: boolean;
}

export default function MyListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // Scroll to top on mount

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

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
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Since the is_listing_promoted function doesn't exist yet in the database,
      // we'll just set all listings as not promoted for now
      const listingsWithPromotionStatus = (data || []).map(listing => ({
        ...listing,
        is_promoted: false
      }));
      
      setListings(listingsWithPromotionStatus);
    } catch (error) {
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ? Toutes les données associées (réservations, favoris) seront également supprimées.')) {
      return;
    }

    setDeleting(id);

    try {
      // Grâce à ON DELETE CASCADE, nous n'avons plus besoin de supprimer manuellement
      // les réservations et les favoris. La suppression de l'annonce les supprimera automatiquement.
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('owner_id', user!.id); // Sécurité supplémentaire

      if (error) throw error;

      toast.success('Annonce supprimée avec succès');
      setListings(prev => prev.filter(listing => listing.id !== id));
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'annonce:', error);
      toast.error('Erreur lors de la suppression de l\'annonce');
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePause = async (id: string) => {
    setToggling(id);
    try {
      const { data, error } = await supabase
        .rpc('toggle_listing_pause', { p_listing_id: id });

      if (error) throw error;

      // Update local state
      setListings(prev => prev.map(listing => 
        listing.id === id ? { ...listing, is_paused: data } : listing
      ));

      toast.success(data ? 'Annonce mise en pause' : 'Annonce réactivée');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setToggling(null);
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
      <div className="flex flex-col items-center mb-8">
        <PageHeader title="Mes annonces" />
        <Link
          to="/create-listing"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-primary hover:bg-primary-dark mt-4"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Nouvelle annonce
        </Link>
      </div>

      {/* Monetization Banner */}
      <div className="mb-6">
        <MonetizationBanner />
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Vous n'avez pas encore d'annonces</p>
          <Link
            to="/create-listing"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-primary hover:bg-primary-dark"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Créer ma première annonce
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className={`bg-white rounded-lg shadow-md overflow-hidden ${listing.is_paused ? 'opacity-75' : ''}`}>
              <div className="relative w-full" style={{ paddingTop: '75%' }}>
                {listing.is_promoted && <BoostedBadge />}
                <ListingImage
                  src={listing.images?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914'}
                  alt={listing.title}
                />
                {listing.is_paused && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white text-lg font-medium">Annonce en pause</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{listing.title}</h3>
                  <span className="text-primary font-bold">{listing.price_per_day}€/jour</span>
                </div>
                <p className="text-gray-600 mb-2">{listing.location}</p>
                <p className="text-sm text-gray-500 mb-4">{listing.categories.name}</p>
                
                <div className="flex justify-between items-center">
                  <Link
                    to={`/listing/${listing.id}`}
                    className="text-primary hover:text-primary-dark"
                  >
                    Voir l'annonce
                  </Link>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleTogglePause(listing.id)}
                      disabled={toggling === listing.id}
                      className={`p-2 text-gray-600 hover:text-primary ${
                        toggling === listing.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title={listing.is_paused ? 'Réactiver l\'annonce' : 'Mettre en pause'}
                    >
                      {toggling === listing.id ? (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : listing.is_paused ? (
                        <Play className="w-5 h-5" />
                      ) : (
                        <Pause className="w-5 h-5" />
                      )}
                    </button>
                    <Link
                      to={`/edit-listing/${listing.id}`}
                      className="p-2 text-gray-600 hover:text-primary"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={deleting === listing.id}
                      className={`p-2 text-gray-600 hover:text-red-600 ${
                        deleting === listing.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {deleting === listing.id ? (
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {listing.is_promoted ? (
                    <div className="flex items-center justify-center bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full px-3 py-2 text-sm font-medium">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Annonce mise en avant
                    </div>
                  ) : (
                    <PromoteListingButton listingId={listing.id} variant="small" className="w-full" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
            {/* Bottom Monetization Banner */}
      <div className="mt-8">
        <MonetizationBanner />
      </div>
    </div>
  );
}
