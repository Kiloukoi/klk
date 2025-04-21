import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin, Calendar, Heart, MessageCircle, ChevronLeft, ChevronRight, X, Info, Sparkles, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import ListingImage from '../components/ListingImage';
import BookingCalendar from '../components/BookingCalendar';
import UserRating from '../components/UserRating';
import PromoteListingButton from '../components/PromoteListingButton';
import BoostedBadge from '../components/BoostedBadge';
import MonetizationBanner from '../components/MonetizationBanner';

interface Listing {
  id: string;
  title: string;
  description: string;
  price_per_day: number;
  location: string;
  postal_code: string;
  city: string;
  images: string[];
  created_at: string;
  owner_id: string;
  category_id: string;
  subcategory_id: string;
  metadata: Record<string, any>;
  categories: {
    name: string;
  };
  subcategories: {
    name: string;
    metadata: {
      type: string;
      fields?: Record<string, any>;
    };
  };
  profiles: {
    username: string;
    avatar_url: string;
    location: string;
    phone_number?: string;
    share_phone_number?: boolean;
  };
}

interface BookedDate {
  start_date: string;
  end_date: string;
  status: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface OwnerRating {
  average_rating: number;
  review_count: number;
}

function ListingDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookingDates, setBookingDates] = useState({
    start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  });
  const [isBooking, setIsBooking] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [numberOfDays, setNumberOfDays] = useState<number>(1);
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [loadingBookedDates, setLoadingBookedDates] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [ownerRating, setOwnerRating] = useState<OwnerRating | null>(null);
  const [loadingOwnerRating, setLoadingOwnerRating] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isPromoted, setIsPromoted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]); // Scroll to top when listing ID changes

  useEffect(() => {
    if (id) {
      fetchListingDetails();
      fetchBookedDates();
      fetchReviews();
      if (user) {
        checkIfFavorite();
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (user && listing) {
      setIsOwner(user.id === listing.owner_id);
      if (user.id === listing.owner_id) {
        checkPromotionStatus();
      }
    }
  }, [user, listing]);

  // Calculate total price and number of days when dates change
  useEffect(() => {
    if (listing) {
      const startDate = new Date(bookingDates.start_date);
      const endDate = new Date(bookingDates.end_date);
      
      // Calculate difference in days
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 since we count both start and end days
      
      setNumberOfDays(diffDays);
      setTotalPrice(listing.price_per_day * diffDays);
    }
  }, [bookingDates, listing]);

  const fetchListingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          categories (
            name
          ),
          subcategories (
            name,
            metadata
          ),
          profiles (
            username,
            avatar_url,
            location,
            phone_number,
            share_phone_number
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setListing(data);
      
      // Get owner rating
      if (data && data.owner_id) {
        fetchOwnerRating(data.owner_id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'annonce:', error);
      toast.error('Erreur lors du chargement de l\'annonce');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkPromotionStatus = async () => {
    try {
      // Fallback method to check promotion status if the RPC function doesn't exist
      const { data, error } = await supabase
        .from('promotions')
        .select('id')
        .eq('listing_id', id)
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error checking promotion status:', error);
        setIsPromoted(false);
        return;
      }

      setIsPromoted(!!data);
    } catch (error) {
      console.error('Error checking promotion status:', error);
      setIsPromoted(false);
    }
  };

  const fetchOwnerRating = async (ownerId: string) => {
    setLoadingOwnerRating(true);
    try {
      // Fallback method to calculate rating manually if the RPC function doesn't exist
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('listing_id', id);

      if (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setOwnerRating({
          average_rating: 0,
          review_count: 0
        });
        setLoadingOwnerRating(false);
        return;
      }
      
      if (data && data.length > 0) {
        // Calculate average manually
        const sum = data.reduce((acc, review) => acc + review.rating, 0);
        const average = sum / data.length;
        
        setOwnerRating({
          average_rating: parseFloat(average.toFixed(1)),
          review_count: data.length
        });
      } else {
        setOwnerRating({
          average_rating: 0,
          review_count: 0
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setOwnerRating({
        average_rating: 0,
        review_count: 0
      });
    } finally {
      setLoadingOwnerRating(false);
    }
  };

  const fetchBookedDates = async () => {
    if (!id) return;
    
    setLoadingBookedDates(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('start_date, end_date, status')
        .eq('listing_id', id)
        .in('status', ['confirmed', 'pending'])
        .order('start_date', { ascending: true });

      if (error) throw error;
      setBookedDates(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des dates réservées:', error);
    } finally {
      setLoadingBookedDates(false);
    }
  };

  const fetchReviews = async () => {
    if (!id) return;
    
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer_id,
          profiles!reviews_reviewer_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('listing_id', id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Erreur lors du chargement des évaluations:', error);
        setReviews([]);
        setLoadingReviews(false);
        return;
      }
      
      setReviews(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des évaluations:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const checkIfFavorite = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('listing_id', id);

      if (error) throw error;
      setIsFavorite(data && data.length > 0);
    } catch (error) {
      console.error('Erreur lors de la vérification des favoris:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour ajouter aux favoris');
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id);

        if (error) throw error;
        toast.success('Retiré des favoris');
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            listing_id: id
          });

        if (error) throw error;
        toast.success('Ajouté aux favoris');
      }

      setIsFavorite(!isFavorite);
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour réserver');
      navigate('/login');
      return;
    }

    if (user.id === listing?.owner_id) {
      toast.error('Vous ne pouvez pas réserver votre propre annonce');
      return;
    }

    setIsBooking(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          listing_id: id,
          renter_id: user.id,
          owner_id: listing?.owner_id,
          start_date: bookingDates.start_date,
          end_date: bookingDates.end_date,
          status: 'pending',
          total_price: totalPrice
        });

      if (error) throw error;

      toast.success('Réservation effectuée avec succès !');
      setBookingConfirmed(true);
      // Refresh booked dates to show the new reservation
      fetchBookedDates();
    } catch (error: any) {
      if (error.message.includes('dates ne sont pas disponibles')) {
        toast.error('Ces dates ne sont pas disponibles');
      } else {
        toast.error('Erreur lors de la réservation');
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleContact = () => {
    if (!user) {
      toast.error('Vous devez être connecté pour contacter le propriétaire');
      navigate('/login');
      return;
    }
    
    if (user.id === listing?.owner_id) {
      toast.error('Vous ne pouvez pas vous contacter vous-même');
      return;
    }

    navigate('/messages', { 
      state: { 
        contactUserId: listing?.owner_id,
        listingId: listing?.id,
        listingTitle: listing?.title,
        prewrittenMessage: `Votre annonce m'intéresse, est elle toujours disponible à la location ?`
      }
    });
  };

  const nextImage = () => {
    if (listing?.images) {
      setCurrentImageIndex((prev) => 
        prev === listing.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (listing?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? listing.images.length - 1 : prev - 1
      );
    }
  };

  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowImageGallery(false);
    }
  }, []);

  useEffect(() => {
    if (showImageGallery) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showImageGallery, handleEscapeKey]);

  // Helper function to display metadata in a user-friendly way
  const formatMetadataKey = (key: string) => {
    switch (key) {
      case 'article_type':
        return 'Type';
      case 'size':
        return 'Taille';
      case 'brand':
        return 'Marque';
      case 'model':
        return 'Modèle';
      default:
        // Convert snake_case to Title Case
        return key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  };

  const formatMetadataValue = (key: string, value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }
    return value;
  };

  // Filter out metadata keys we don't want to display
  const getDisplayableMetadata = (metadata: Record<string, any>) => {
    if (!metadata) return {};
    
    // Create a new object with only the keys we want to display
    const displayable: Record<string, any> = {};
    
    Object.entries(metadata).forEach(([key, value]) => {
      // Skip null values
      if (value === null) {
        return;
      }
      
      // Skip deposit-related keys
      if (key === 'requires_deposit' || key === 'deposit_amount' || key === 'deposit_type') {
        return;
      }
      
      // Include all other keys
      displayable[key] = value;
    });
    
    return displayable;
  };

  const handleDateChange = (startDate: string, endDate: string) => {
    setBookingDates({
      start_date: startDate,
      end_date: endDate
    });
  };

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${
            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Annonce introuvable</h2>
        <Link to="/" className="text-primary hover:underline">
          Retourner à l'accueil
        </Link>
      </div>
    );
  }

  const displayableMetadata = getDisplayableMetadata(listing.metadata);
  const hasDeposit = listing.metadata?.requires_deposit && listing.metadata?.deposit_amount > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center space-x-2 mb-6 text-sm overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
          <Link to="/" className="text-gray-500 hover:text-gray-700">Accueil</Link>
          <span className="text-gray-500">/</span>
          <Link to={`/?category=${listing.category_id}`} className="text-gray-500 hover:text-gray-700">
            {listing.categories?.name}
          </Link>
          <span className="text-gray-500">/</span>
          <Link 
            to={`/?category=${listing.category_id}&subcategory=${listing.subcategory_id}`} 
            className="text-gray-500 hover:text-gray-700"
          >
            {listing.subcategories?.name}
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-900 truncate">{listing.title}</span>
        </nav>

        {/* Monetization Banner at the top */}
        <div className="mb-6">
          <MonetizationBanner />
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="relative">
            {listing?.images && listing.images.length > 0 && (
              <>
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}> {/* Aspect ratio 16:9 */}
                  {isPromoted && <BoostedBadge />}
                  <ListingImage
                    src={listing.images[currentImageIndex]}
                    alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                    onClick={() => setShowImageGallery(true)}
                  />
                </div>
                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {listing.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex
                              ? 'bg-white'
                              : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                <button
                  onClick={toggleFavorite}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <Heart 
                    className={`w-6 h-6 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                    fill={isFavorite ? 'currentColor' : 'none'}
                  />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{listing.title}</h1>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{listing.location}</span>
              </div>
              
              {isOwner && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/edit-listing/${listing.id}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Modifier l'annonce
                  </Link>
                  
                  {isPromoted ? (
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full text-sm font-medium">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Annonce mise en avant
                    </div>
                  ) : (
                    <PromoteListingButton listingId={listing.id} />
                  )}
                </div>
              )}
            </div>

            {Object.keys(displayableMetadata).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Caractéristiques</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(displayableMetadata).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">{formatMetadataKey(key)}</span>
                      <span className="font-medium">{formatMetadataValue(key, value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-600 whitespace-pre-line leading-relaxed">{listing.description}</p>
              </div>
            </div>

            {/* Monetization Banner in the middle */}
            <div className="my-6">
              <MonetizationBanner />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <Link 
                to={`/user/${listing.owner_id}/listings`}
                className="flex items-center space-x-4 hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <img
                  src={listing.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${listing.profiles?.username}`}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{listing.profiles?.username}</h3>
                  <div className="flex items-center">
                    <div className="flex mr-2">
                      {renderStars(Math.round(ownerRating?.average_rating || 0))}
                    </div>
                    <span className="text-gray-700 font-medium">{ownerRating?.average_rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-gray-500 ml-1">({ownerRating?.review_count || 0} avis)</span>
                  </div>
                  {listing.profiles?.location && (
                    <p className="text-sm text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {listing.profiles.location}
                    </p>
                  )}
                  {listing.profiles?.phone_number && listing.profiles?.share_phone_number && (
                    <p className="text-sm text-gray-500 mt-1">
                      <Phone className="w-3 h-3 inline mr-1" />
                      {listing.profiles.phone_number}
                    </p>
                  )}
                </div>
              </Link>
            </div>

            {/* Reviews section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Évaluations</h2>
                <Link 
                  to={`/user/${listing.owner_id}/reviews`}
                  className="text-primary hover:text-primary-dark text-sm"
                >
                  Voir toutes les évaluations
                </Link>
              </div>

              {loadingReviews ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucune évaluation pour le moment
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start mb-2">
                        <img
                          src={review.profiles.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${review.profiles.username}`}
                          alt={review.profiles.username}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <div>
                          <div className="font-medium">{review.profiles.username}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex mb-2">
                        {renderStars(review.rating)}
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-96">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <div className="text-2xl font-bold text-primary mb-6">
                {listing.price_per_day}€ <span className="text-base font-normal text-gray-600">/ jour</span>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="font-medium text-gray-700">Sélectionnez vos dates</h3>
                
                <BookingCalendar 
                  bookedDates={bookedDates}
                  onDateChange={handleDateChange}
                  initialStartDate={bookingDates.start_date}
                  initialEndDate={bookingDates.end_date}
                  isLoading={loadingBookedDates}
                  showUnavailableDates={bookingConfirmed}
                />

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Prix par jour</span>
                    <span className="font-medium">{listing.price_per_day}€</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Nombre de jours</span>
                    <span className="font-medium">{numberOfDays}</span>
                  </div>
                  <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{totalPrice}€</span>
                  </div>
                </div>

                {hasDeposit && (
                  <div className="flex items-start p-3 bg-yellow-50  rounded-lg border border-yellow-200">
                    <Info className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-700">Caution requise</p>
                      <p className="text-yellow-600">Une caution de {listing.metadata.deposit_amount}€ sera demandée par le propriétaire en {listing.metadata.deposit_type === 'cash' ? 'espèces' : 'chèque'}.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {!isOwner && (
                  <>
                    <button
                      onClick={handleBooking}
                      disabled={isBooking || bookingConfirmed}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-full shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBooking ? 'Réservation en cours...' : bookingConfirmed ? 'Réservation effectuée' : 'Réserver maintenant'}
                    </button>

                    <button
                      onClick={handleContact}
                      className="w-full flex items-center justify-center px-4 py-3 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-colors"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contacter le propriétaire
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Monetization Banner at the bottom */}
        <div className="mt-8">
          <MonetizationBanner />
        </div>
      </div>

      {showImageGallery && listing.images && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50" onClick={() => setShowImageGallery(false)}>
          <div className="absolute inset-0 flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <div className="relative w-[80vw] h-[80vh]">
              <ListingImage
                src={listing.images[currentImageIndex]}
                alt={`${listing.title} - Image ${currentImageIndex + 1}`}
              />
            </div>
            
            <button
              onClick={() => setShowImageGallery(false)}
              className="absolute top-4 right-4 z-[60] text-white p-2 hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Fermer la galerie"
            >
              <X className="w-8 h-8" />
            </button>

            {listing.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    previousImage();
                  }}
                  className="absolute left-4 z-[60] text-white p-2 hover:bg-gray-800 rounded-full transition-colors"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 z-[60] text-white p-2 hover:bg-gray-800 rounded-full transition-colors"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {listing.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex
                          ? 'bg-white'
                          : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                      }`}
                      aria-label={`Aller à l'image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingDetails;