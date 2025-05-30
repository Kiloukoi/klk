import React, { useState, useEffect } from 'react';
import { Search, MapPin, ChevronDown, Sliders, Leaf, PiggyBank, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import debounce from 'lodash/debounce';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import ListingImage from '../components/ListingImage';
import BoostedBadge from '../components/BoostedBadge';
import Pagination from '../components/Pagination';
import MonetizationBanner from '../components/MonetizationBanner';
import MonetizationListingAd from '../components/MonetizationListingAd';

interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  metadata: {
    type: string;
    has_children?: boolean;
    subcategories?: Array<string | ArticleType>;
    fields?: Record<string, any>;
  };
}

interface ArticleType {
  name: string;
  sizes?: string[];
  types?: string[];
}

interface LocationSuggestion {
  postalCode: string;
  city: string;
  display: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price_per_day: number;
  location: string;
  images: string[];
  is_promoted?: boolean;
  categories?: {
    name: string;
  };
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [showCategories, setShowCategories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [postalSuggestions, setPostalSuggestions] = useState<LocationSuggestion[]>([]);
  const [showPostalSuggestions, setShowPostalSuggestions] = useState(false);
  const [isLoadingPostal, setIsLoadingPostal] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedListings, setPaginatedListings] = useState<Listing[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const listingsPerPage = 12;
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchListings();
  }, [selectedCategory, selectedSubcategory, sortBy]);

  useEffect(() => {
    if (listings.length > 0) {
      const startIndex = (currentPage - 1) * listingsPerPage;
      const endIndex = startIndex + listingsPerPage;
      setPaginatedListings(listings.slice(startIndex, endIndex));
      setTotalPages(Math.ceil(listings.length / listingsPerPage));
    } else {
      setPaginatedListings([]);
      setTotalPages(1);
    }
  }, [listings, currentPage]);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (categoriesError) throw categoriesError;

      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .order('name');

      if (subcategoriesError) throw subcategoriesError;

      const categoriesWithSubs = categoriesData.map(category => ({
        ...category,
        subcategories: subcategoriesData.filter(sub => sub.category_id === category.id)
      }));

      setCategories(categoriesWithSubs);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      // Initialize promotedListings as an empty array
      let promotedListings: Listing[] = [];
      let promotedError = null;

      // Determine if we're in a search or category/subcategory context
      const isFiltering = searchTerm || location || selectedCategory || selectedSubcategory;
      setIsSearchActive(!!searchTerm || !!location);

      // First, get regular listings
      let query = supabase
        .from('listings')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('is_paused', false);

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedSubcategory) {
        query = query.eq('subcategory_id', selectedSubcategory);
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      if (location) {
        query = query.or(`location.ilike.%${location}%,postal_code.ilike.%${location}%,city.ilike.%${location}%`);
      }

      // Only show promoted listings in search results or category views
      if (isFiltering) {
        // For search/category results, get promoted listings first, then regular ones
        const { data: promotedData, error: fetchPromotedError } = await supabase
          .from('listings')
          .select(`
            *,
            categories (
              name
            )
          `)
          .eq('is_paused', false)
          .eq('is_promoted', true)
          .order('created_at', { ascending: false });

        promotedListings = promotedData || [];
        promotedError = fetchPromotedError;

        if (promotedError) throw promotedError;

        // Apply the same filters to promoted listings
        promotedListings = promotedListings.filter(listing => {
          let matches = true;
          
          if (selectedCategory) {
            matches = matches && listing.category_id === selectedCategory;
          }
          
          if (selectedSubcategory) {
            matches = matches && listing.subcategory_id === selectedSubcategory;
          }
          
          if (searchTerm) {
            matches = matches && listing.title.toLowerCase().includes(searchTerm.toLowerCase());
          }
          
          if (location) {
            matches = matches && (
              (listing.location && listing.location.toLowerCase().includes(location.toLowerCase())) ||
              (listing.postal_code && listing.postal_code.toLowerCase().includes(location.toLowerCase())) ||
              (listing.city && listing.city.toLowerCase().includes(location.toLowerCase()))
            );
          }
          
          return matches;
        });

        // Then get regular listings (not promoted)
        query = query.eq('is_promoted', false);
      } else {
        // On homepage without filters, don't show promoted listings at the top
        query = query.order('is_promoted', { ascending: false });
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_asc':
          query = query.order('price_per_day', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price_per_day', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data: regularListings, error: regularError } = await query;

      if (regularError) throw regularError;

      // Combine promoted and regular listings if we're filtering
      let allListings;
      if (isFiltering) {
        allListings = [...promotedListings, ...(regularListings || [])];
      } else {
        allListings = regularListings || [];
      }
      
      setListings(allListings);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const searchPostalCodes = debounce(async (input: string) => {
    if (!input || input.length < 2) {
      setPostalSuggestions([]);
      setShowPostalSuggestions(false);
      return;
    }

    setIsLoadingPostal(true);
    try {
      const cleanInput = encodeURIComponent(input.trim());
      let endpoint;
      
      if (/^\d/.test(input)) {
        endpoint = `https://geo.api.gouv.fr/communes?codePostal=${cleanInput}&fields=nom,codesPostaux`;
      } else {
        endpoint = `https://geo.api.gouv.fr/communes?nom=${cleanInput}&fields=nom,codesPostaux&limit=5&boost=population`;
      }

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Format de réponse invalide');
      }

      const suggestions = data.flatMap(commune => 
        commune.codesPostaux.map(code => ({
          postalCode: code,
          city: commune.nom,
          display: `${code} ${commune.nom}`
        }))
      );

      setPostalSuggestions(suggestions);
      setShowPostalSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error searching postal codes:', error);
      toast.error('Unable to load suggestions');
    } finally {
      setIsLoadingPostal(false);
    }
  }, 300);

  const handleSearch = () => {
    setIsSearchActive(!!searchTerm || !!location);
    fetchListings();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Function to handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Function to insert ad listings at specific positions
  const getListingsWithAds = () => {
    if (paginatedListings.length === 0) return [];
    
    const result = [...paginatedListings];
    
    // Insert ads after every 4 listings
    for (let i = 4; i < result.length; i += 5) {
      result.splice(i, 0, { id: `ad-${i}`, isAd: true } as any);
    }
    
    return result;
  };

  const listingsWithAds = getListingsWithAds();

  return (
    <div className="space-y-8">
      <section className="relative min-h-[400px] md:h-[400px] -mt-16 mb-8 overflow-visible">
        <div className="container mx-auto px-4 h-full relative">
          <div className="flex flex-col items-center justify-center h-full pt-24 md:pt-16">
            <img 
              src="https://rjmndugrzyjjmmzdobwt.supabase.co/storage/v1/object/public/assets//IMG_0006.PNG"
              alt="Kiloukoi"
              className="h-20 md:h-24 mb-6"
            />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">
              <div>N'achetez que le nécessaire,</div>
              <div className="flex items-center justify-center mt-2">
                pour le reste il y a Kiloukoi{' '}
              </div>
            </h1>
            
            <div className="w-full max-w-4xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder="Que recherchez-vous ?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  />
                </div>
                <div className="relative postal-search-container">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder="Code postal ou ville"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      searchPostalCodes(e.target.value);
                    }}
                    onKeyPress={handleKeyPress}
                    onFocus={() => {
                      if (postalSuggestions.length > 0) {
                        setShowPostalSuggestions(true);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  />
                  {showPostalSuggestions && postalSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {postalSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setLocation(suggestion.display);
                            setShowPostalSuggestions(false);
                          }}
                        >
                          {suggestion.display}
                        </div>
                      ))}
                    </div>
                  )}
                  {isLoadingPostal && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleSearch}
                  className="bg-primary text-white px-8 py-3 rounded-full shadow-lg hover:bg-primary-dark transition-all duration-200 hover:shadow-xl"
                >
                  Rechercher
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto">
        <MonetizationBanner url="https://www.profitableratecpm.com/z8jj97wv?key=21713001843103ea1def6c2e4b45be45" className="max-w-4xl mx-auto px-4" />
      </div>

      <section className="container mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Protégez notre planète</h3>
            <p className="text-gray-600">En évitant d'acheter du neuf</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <PiggyBank className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Arrondissez vos fins de mois</h3>
            <p className="text-gray-600">En mettant en location vos biens</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Changez le monde</h3>
            <p className="text-gray-600">En aidant vos voisins ou vos proches</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <div className="relative categories-dropdown">
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="w-full md:w-auto flex items-center justify-between space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span>{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Toutes les catégories'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showCategories && (
                <div className="absolute z-20 mt-2 w-72 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer font-medium border-b border-gray-200"
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedSubcategory('');
                      setShowCategories(false);
                      fetchListings();
                    }}
                  >
                    Toutes les catégories
                  </div>

                  {categories.map(category => (
                    <div key={category.id} className="border-b border-gray-100 last:border-b-0">
                      <div
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer font-medium"
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setSelectedSubcategory('');
                          setShowCategories(false);
                          fetchListings();
                        }}
                      >
                        {category.name}
                      </div>
                      {selectedCategory === category.id && category.subcategories && (
                        <div className="ml-4 border-l border-gray-200">
                          {category.subcategories.map(subcategory => (
                            <div
                              key={subcategory.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                setSelectedSubcategory(subcategory.id);
                                setShowCategories(false);
                                fetchListings();
                              }}
                            >
                              {subcategory.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                fetchListings();
              }}
              className="w-full md:w-auto border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="recent">Plus récents</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {listings.length} annonce{listings.length !== 1 ? 's' : ''} trouvée{listings.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : listingsWithAds.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listingsWithAds.map((item, index) => (
                <React.Fragment key={item.id}>
                  {(item as any).isAd ? (
                    <MonetizationListingAd url="https://www.profitableratecpm.com/z8jj97wv?key=21713001843103ea1def6c2e4b45be45" />
                  ) : (
                    <Link
                      to={`/listing/${item.id}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="relative w-full" style={{ paddingTop: '75%' }}>
                        {item.is_promoted && (isSearchActive || selectedCategory || selectedSubcategory) && <BoostedBadge />}
                        <ListingImage
                          src={item.images?.[0]}
                          alt={item.title}
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        
                        <div className="flex items-center text-gray-600 mt-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm line-clamp-1">{item.location}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-500">
                            {item.categories?.name || 'Catégorie non spécifiée'}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {item.price_per_day}€ <span className="text-sm font-normal">/jour</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune annonce ne correspond à votre recherche</p>
          </div>
        )}
      </section>

      <div className="container mx-auto">
        <MonetizationBanner url="https://www.profitableratecpm.com/z8jj97wv?key=21713001843103ea1def6c2e4b45be45" className="max-w-4xl mx-auto px-4 mb-8" />
      </div>
    </div>
  );
}
