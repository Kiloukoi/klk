import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Upload, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import debounce from 'lodash/debounce';

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

interface Listing {
  title: string;
  description: string;
  price_per_day: number;
  location: string;
  category_id: string;
  subcategory_id: string;
  images: string[];
  owner_id: string;
  metadata: Record<string, any>;
  brand: string;
  model: string;
}

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Listing>({
    title: '',
    description: '',
    price_per_day: 0,
    location: '',
    category_id: '',
    subcategory_id: '',
    images: [],
    owner_id: '',
    metadata: {},
    brand: '',
    model: ''
  });
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositType, setDepositType] = useState('cash');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [postalSuggestions, setPostalSuggestions] = useState<Array<{
    display: string;
    postalCode: string;
    city: string;
  }>>([]);
  const [showPostalSuggestions, setShowPostalSuggestions] = useState(false);
  const [isLoadingPostal, setIsLoadingPostal] = useState(false);
  const [selectedArticleType, setSelectedArticleType] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [availableArticleTypes, setAvailableArticleTypes] = useState<Array<string | ArticleType>>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]); // Scroll to top when listing ID changes

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchCategories();
    fetchListing();
  }, [user, id, navigate]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        toast.error('Erreur lors du chargement des catégories');
        return;
      }

      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .order('name');

      if (subcategoriesError) {
        toast.error('Erreur lors du chargement des sous-catégories');
        return;
      }

      const categoriesWithSubs = data.map(category => ({
        ...category,
        subcategories: subcategoriesData.filter(sub => sub.category_id === category.id)
      }));

      setCategories(categoriesWithSubs);
    } catch (error) {
      toast.error('Erreur lors du chargement des catégories');
    }
  };

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data.owner_id !== user?.id) {
        toast.error('Vous n\'êtes pas autorisé à modifier cette annonce');
        navigate('/my-listings');
        return;
      }

      setFormData({
        ...data,
        brand: data.metadata?.brand || '',
        model: data.metadata?.model || '',
        subcategory_id: data.subcategory_id || ''
      });
      
      // Set deposit information from metadata
      if (data.metadata) {
        setRequiresDeposit(data.metadata.requires_deposit || false);
        setDepositAmount(data.metadata.deposit_amount ? data.metadata.deposit_amount.toString() : '');
        setDepositType(data.metadata.deposit_type || 'cash');
        
        // Set article type and size if available
        if (data.metadata.article_type) {
          setSelectedArticleType(data.metadata.article_type);
        }
        
        if (data.metadata.size) {
          setSelectedSize(data.metadata.size);
        }
      }
      
      // Load subcategory metadata for article types and sizes
      if (data.subcategory_id) {
        const { data: subcategoryData, error: subcategoryError } = await supabase
          .from('subcategories')
          .select('*')
          .eq('id', data.subcategory_id)
          .single();
          
        if (!subcategoryError && subcategoryData?.metadata?.subcategories) {
          setAvailableArticleTypes(subcategoryData.metadata.subcategories);
          
          // If article type is set, find available sizes
          if (data.metadata?.article_type) {
            const articleType = subcategoryData.metadata.subcategories.find(type => {
              if (typeof type === 'string') {
                return type === data.metadata.article_type;
              }
              return type.name === data.metadata.article_type;
            });
            
            if (typeof articleType !== 'string' && articleType?.sizes) {
              setAvailableSizes(articleType.sizes);
            }
          }
        }
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'annonce');
      navigate('/my-listings');
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
          display: `${code} ${commune.nom}`,
          postalCode: code,
          city: commune.nom
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
    if (files.length + formData.images.length + newImages.length > 5) {
      toast.error('Maximum 5 images autorisées');
      return;
    }
    setNewImages(prev => [...prev, ...files]);
  };

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const uploadedUrls: string[] = [];
    setUploading(true);

    try {
      for (const file of newImages) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrls: string[] = [];
      if (newImages.length > 0) {
        imageUrls = await uploadImages();
      }

      // Update metadata with deposit information and brand/model
      const updatedMetadata = {
        ...formData.metadata,
        requires_deposit: requiresDeposit,
        deposit_amount: requiresDeposit ? parseFloat(depositAmount) || 0 : null,
        deposit_type: requiresDeposit ? depositType : null,
        brand: formData.brand || null,
        model: formData.model || null,
        article_type: selectedArticleType || formData.metadata.article_type,
        size: selectedSize || formData.metadata.size
      };

      const { error } = await supabase
        .from('listings')
        .update({
          ...formData,
          images: [...formData.images, ...imageUrls],
          metadata: updatedMetadata
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Annonce mise à jour avec succès !');
      navigate('/my-listings');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price_per_day' ? parseFloat(value) : value
    }));
  };

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, checked, value, type } = e.target;
    
    if (type === 'checkbox') {
      setRequiresDeposit(checked);
      if (!checked) {
        setDepositAmount('');
      }
    } else if (name === 'deposit_amount') {
      setDepositAmount(value);
    } else if (name === 'deposit_type') {
      setDepositType(value);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <PageHeader title="Modifier l'annonce" />

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
                checked={requiresDeposit}
                onChange={handleDepositChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="requires_deposit" className="ml-2 block text-sm font-medium text-gray-700">
                Demander une caution
              </label>
            </div>
            
            {requiresDeposit && (
              <div className="mt-2 space-y-4">
                <div className="relative rounded-md shadow-sm">
                  <label htmlFor="deposit_amount" className="block text-sm font-medium text-gray-700">
                    Montant de la caution (€) *
                  </label>
                  <input
                    type="number"
                    id="deposit_amount"
                    name="deposit_amount"
                    required={requiresDeposit}
                    min="0"
                    step="0.01"
                    value={depositAmount}
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
                    required={requiresDeposit}
                    value={depositType}
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
                  handleChange(e);
                  searchPostalCodes(e.target.value);
                }}
                onFocus={() => {
                  if (postalSuggestions.length > 0) {
                    setShowPostalSuggestions(true);
                  }
                }}
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary focus:ring-primary"
                placeholder="Ex: 75011 Paris"
              />
              {showPostalSuggestions && postalSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {postalSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, location: suggestion.display }));
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Photos existantes
            </label>
            <div className="mt-4 grid grid-cols-5 gap-4">
              {formData.images.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Ajouter des photos (max 5 au total)
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
              {newImages.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-4">
                  {newImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Nouvelle image ${index + 1}`}
                        className="h-20 w-20 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading || uploading ? 'Mise à jour en cours...' : 'Mettre à jour l\'annonce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}