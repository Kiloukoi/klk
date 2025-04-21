import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import ListingImage from '../components/ListingImage';
import MonetizationBanner from '../components/MonetizationBanner';

interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listings: {
    id: string;
    title: string;
    description: string;
    price_per_day: number;
    location: string;
    images: string[];
    categories: {
      name: string;
    };
  };
}

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          listings (
            id,
            title,
            description,
            price_per_day,
            location,
            images,
            categories (
              name
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('listing_id', listingId)
        .eq('user_id', user!.id);

      if (error) throw error;
      
      setFavorites(prev => prev.filter(fav => fav.listing_id !== listingId));
      toast.success('Retiré des favoris');
    } catch (error) {
      toast.error('Erreur lors de la suppression du favori');
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
      <PageHeader title="Mes favoris" />
      
      {/* Monetization Banner */}
      <div className="mb-6">
        <MonetizationBanner />
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun favori pour le moment
          </h2>
          <p className="text-gray-500 mb-4">
            Explorez les annonces et ajoutez-les à vos favoris pour les retrouver facilement
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-primary hover:bg-primary-dark"
          >
            Explorer les annonces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative w-full" style={{ paddingTop: '75%' }}> {/* Aspect ratio 4:3 */}
                <ListingImage
                  src={favorite.listings.images?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914'}
                  alt={favorite.listings.title}
                />
                <button
                  onClick={() => removeFavorite(favorite.listing_id)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <Heart className="w-5 h-5 text-red-500" fill="currentColor" />
                </button>
              </div>
              
              <div className="p-4">
                <Link to={`/listing/${favorite.listings.id}`}>
                  <h3 className="text-lg font-semibold mb-2">{favorite.listings.title}</h3>
                </Link>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{favorite.listings.location}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {favorite.listings.categories.name}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {favorite.listings.price_per_day}€ <span className="text-sm font-normal">/jour</span>
                  </span>
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
