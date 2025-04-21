import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Upload, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import debounce from 'lodash/debounce';
import SideBanner from '../components/SideBanner';

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

interface LocationData {
  postalCode: string;
  city: string;
  display: string;
}

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_per_day: '',
    location: '',
    category_id: '',
    subcategory_id: '',
    metadata: {} as Record<string, any>,
    requires_deposit: false,
    deposit_amount: '',
    deposit_type: 'cash',
    brand: '',
    model: ''
  });
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [postalSuggestions, setPostalSuggestions] = useState<LocationData[]>([]);
  const [showPostalSuggestions, setShowPostalSuggestions] = useState(false);
  const [isLoadingPostal, setIsLoadingPostal] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [selectedArticleType, setSelectedArticleType] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [availableArticleTypes, setAvailableArticleTypes] = useState<Array<string | ArticleType>>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Hide footer on this page
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
      footerContainer.style.display = 'none';
    }
    
    // Restore footer when component unmounts
    return () => {
      const footerContainer = document.getElementById('footer-container');
      if (footerContainer) {
        footerContainer.style.display = 'block';
      }
    };
  }, []); // Scroll to top on mount

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      setFetchError(false);
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
      console.error('Erreur lors du chargement des catégories:', error);
      setFetchError(true);
      toast.error('Erreur lors du chargement des catégories. Veuillez réessayer.');
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
      console.error('Erreur lors de la recherche du code postal:', error);
      toast.error('Impossible de charger les suggestions');
    } finally {
      setIsLoadingPostal(false);
    }
  }, 300);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images autorisées');
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const uploadImages = async () => {
    const uploadedUrls: string[] = [];
    setUploading(true);

    try {
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Erreur lors de l\'upload des images:', error);
      throw new Error('Erreur lors de l\'upload des images');
    } finally {
      setUploading(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      category_id: value,
      subcategory_id: '',
      metadata: {}
    }));
    setSelectedArticleType('');
    setSelectedSize('');
    setAvailableArticleTypes([]);
    setAvailableSizes([]);
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const subcategory = categories
      .find(c => c.id === formData.category_id)
      ?.subcategories?.find(s => s.id === value);

    setFormData(prev => ({
      ...prev,
      subcategory_id: value,
      metadata: {}
    }));

    // Reset selections
    setSelectedArticleType('');
    setSelectedSize('');
    setAvailableArticleTypes([]);
    setAvailableSizes([]);

    if (subcategory?.metadata.subcategories) {
      setAvailableArticleTypes(subcategory.metadata.subcategories);
    }
  };

  const handleArticleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setSelectedArticleType(value);
    setSelectedSize('');

    // Find the article type object to get available sizes
    const articleType = availableArticleTypes.find(type => {
      if (typeof type === 'string') {
        return type === value;
      }
      return type.name === value;
    });

    if (typeof articleType !== 'string' && articleType?.sizes) {
      setAvailableSizes(articleType.sizes);
    } else {
      setAvailableSizes([]);
    }

    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        article_type: value
      }
    }));
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setSelectedSize(value);
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        size: value
      }
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, checked, value, type } = e.target as HTMLInputElement & HTMLSelectElement;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // Reset deposit amount if checkbox is unchecked
        deposit_amount: checked ? prev.deposit_amount : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocation) {
      setLocationError('Veuillez sélectionner une ville dans la liste');
      return;
    }

    setLoading(true);

    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      // Prepare metadata with deposit information and brand/model
      const metadata = {
        ...formData.metadata,
        requires_deposit: formData.requires_deposit,
        deposit_amount: formData.requires_deposit ? parseFloat(formData.deposit_amount) || 0 : null,
        deposit_type: formData.requires_deposit ? formData.deposit_type : null,
        brand: formData.brand || null,
        model: formData.model || null,
        article_type: selectedArticleType || null,
        size: selectedSize || null
      };

      const { error } = await supabase.from('listings').insert({
        title: formData.title,
        description: formData.description,
        price_per_day: parseFloat(formData.price_per_day),
        owner_id: user?.id,
        images: imageUrls,
        postal_code: selectedLocation.postalCode,
        city: selectedLocation.city,
        location: selectedLocation.display,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id,
        metadata: metadata
      });

      if (error) throw error;

      toast.success('Annonce créée avec succès !');
      navigate('/my-listings');
    } catch (error) {
      toast.error('Erreur lors de la création de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchCategories();
  };

  if (fetchError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Erreur de connexion</h2>
          <p className="mb-4">Impossible de se connecter à la base de données. Veuillez vérifier votre connexion internet et réessayer.</p>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 relative">
      {/* Side banners */}
      <SideBanner position="left" url="https://phoampor.top/4/9158218" />
      <SideBanner position="right" url="https://phoampor.top/4/9158218" />
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <PageHeader title="Déposer une annonce" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Titre de l'annonce *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              placeholder="Ex: Appareil photo Canon EOS 5D"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                Marque
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                placeholder="Ex: Canon, Samsung, Bosch..."
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                Modèle
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                placeholder="Ex: EOS 5D, Galaxy S21..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
              Catégorie *
            </label>
            <select
              id="category_id"
              name="category_id"
              required
              value={formData.category_id}
              onChange={handleCategoryChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            >
              <option value="">Sélectionnez une catégorie</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {formData.category_id && (
            <div>
              <label htmlFor="subcategory_id" className="block text-sm font-medium text-gray-700">
                Sous-catégorie *
              </label>
              <select
                id="subcategory_id"
                name="subcategory_id"
                required
                value={formData.subcategory_id}
                onChange={handleSubcategoryChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              >
                <option value="">Sélectionnez une sous-catégorie</option>
                {categories
                  .find(c => c.id === formData.category_id)
                  ?.subcategories?.map(subcategory => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {availableArticleTypes.length > 0 && (
            <div>
              <label htmlFor="article_type" className="block text-sm font-medium text-gray-700">
                Type *
              </label>
              <select
                id="article_type"
                name="article_type"
                required
                value={selectedArticleType}
                onChange={handleArticleTypeChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              >
                <option value="">Sélectionnez un type</option>
                {availableArticleTypes.map((type, index) => (
                  <option key={index} value={typeof type === 'string' ? type : type.name}>
                    {typeof type === 'string' ? type : type.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {availableSizes.length > 0 && (
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                Taille *
              </label>
              <select
                id="size"
                name="size"
                required
                value={selectedSize}
                onChange={handleSizeChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              >
                <option value="">Sélectionnez une taille</option>
                {availableSizes.map((size, index) => (
                  <option key={index} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              placeholder="Décrivez votre bien en détail..."
            />
          </div>

          <div>
            <label htmlFor="price_per_day" className="block text-sm font-medium text-gray-700">
              Prix par jour (€) *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="price_per_day"
                name="price_per_day"
                required
                min="0"
                step="0.01"
                value={formData.price_per_day}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-primary focus:ring-primary"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">€</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="requires_deposit"
                name="requires_deposit"
                checked={formData.requires_deposit}
                onChange={handleDepositChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="requires_deposit" className="ml-2 block text-sm font-medium text-gray-700">
                Demander une caution
              </label>
            </div>
            
            {formData.requires_deposit && (
              <div className="mt-2 space-y-4">
                <div className="relative rounded-md shadow-sm">
                  <label htmlFor="deposit_amount" className="block text-sm font-medium text-gray-700">
                    Montant de la caution (€) *
                  </label>
                  <input
                    type="number"
                    id="deposit_amount"
                    name="deposit_amount"
                    required={formData.requires_deposit}
                    min="0"
                    step="0.01"
                    value={formData.deposit_amount}
                    onChange={handleDepositChange}
                    className="mt-1 block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-primary focus:ring-primary"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="deposit_type" className="block text-sm font-medium text-gray-700">
                    Type de caution *
                  </label>
                  <select
                    id="deposit_type"
                    name="deposit_type"
                    required={formData.requires_deposit}
                    value={formData.deposit_type}
                    onChange={handleDepositChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="cash">Espèces</option>
                    <option value="check">Chèque</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Ville *
            </label>
            <div className="mt-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="location"
                name="location"
                required
                value={formData.location}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, location: e.target.value }));
                  searchPostalCodes(e.target.value);
                }}
                onFocus={() => {
                  if (postalSuggestions.length > 0) {
                    setShowPostalSuggestions(true);
                  }
                }}
                className={`block w-full rounded-md pl-10 focus:border-primary focus:ring-primary ${
                  locationError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Rechercher une ville..."
              />
              {showPostalSuggestions && postalSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {postalSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedLocation(suggestion);
                        setFormData(prev => ({ ...prev, location: suggestion.display }));
                        setShowPostalSuggestions(false);
                        setLocationError('');
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
            {locationError && (
              <p className="mt-1 text-sm text-red-600">
                {locationError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Photos (max 5)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="images"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                  >
                    <span>Télécharger des photos</span>
                    <input
                      id="images"
                      name="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG jusqu'à 10MB
                </p>
              </div>
            </div>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-5 gap-4">
                {images.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Aperçu ${index + 1}`}
                      className="h-20 w-20 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading || uploading ?  'Publication en cours...' : 'Publier l\'annonce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}