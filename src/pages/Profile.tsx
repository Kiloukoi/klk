import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, MapPin, Camera, Trash2, AlertTriangle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';
import SideBanner from '../components/SideBanner';

interface Profile {
  username: string;
  avatar_url: string;
  postal_code: string;
  city: string;
  phone_number: string;
  share_phone_number: boolean;
  gender: string | null;
}

const defaultAvatarUrl = 'https://ighqyvttbwqivsemrqon.supabase.co/storage/v1/object/public/assets//IMG_0006.PNG';
const maleAvatarUrl = 'https://rjmndugrzyjjmmzdobwt.supabase.co/storage/v1/object/public/assets//Avatar_homme.png';
const femaleAvatarUrl = 'https://rjmndugrzyjjmmzdobwt.supabase.co/storage/v1/object/public/assets//Avatar_femme_2.png';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({
    username: '',
    avatar_url: '',
    postal_code: '',
    city: '',
    phone_number: '',
    share_phone_number: false,
    gender: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, postal_code, city, phone_number, share_phone_number, gender')
        .eq('id', user!.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

      if (error) throw error;

      if (data) {
        setProfile({
          username: data.username || '',
          avatar_url: data.avatar_url || '',
          postal_code: data.postal_code || '',
          city: data.city || '',
          phone_number: data.phone_number || '',
          share_phone_number: data.share_phone_number || false,
          gender: data.gender
        });
      } else {
        // If no profile exists, create one with default values
        const defaultProfile = {
          id: user!.id,
          username: `Kilouwer#${Math.floor(1000 + Math.random() * 9000)}`,
          avatar_url: '',
          postal_code: '',
          city: '',
          phone_number: '',
          share_phone_number: false,
          gender: null
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([defaultProfile]);

        if (insertError) throw insertError;

        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          username: profile.username || null,
          avatar_url: profile.avatar_url || null,
          postal_code: profile.postal_code || null,
          city: profile.city || null,
          phone_number: profile.phone_number || null,
          share_phone_number: profile.share_phone_number,
          gender: profile.gender,
          updated_at: new Date()
        });

      if (error) throw error;
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGenderChange = (gender: string | null) => {
    // Update the avatar URL based on gender selection
    let newAvatarUrl = profile.avatar_url;
    
    // Only update avatar if it's not a custom one
    if (!profile.avatar_url || 
        profile.avatar_url === maleAvatarUrl || 
        profile.avatar_url === femaleAvatarUrl) {
      newAvatarUrl = gender === 'male' ? maleAvatarUrl : 
                     gender === 'female' ? femaleAvatarUrl : 
                     '';
    }
    
    setProfile(prev => ({
      ...prev,
      gender,
      avatar_url: newAvatarUrl
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées');
      return;
    }

    const fileSize = file.size / 1024 / 1024; // Convert to MB
    if (fileSize > 2) {
      toast.error('Taille maximale : 2 Mo');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date() })
        .eq('id', user!.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Photo de profil mise à jour');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erreur lors de la mise à jour de la photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile.avatar_url) return;
    
    setUploadingAvatar(true);
    try {
      // Delete avatar from storage if it's not a default avatar
      if (profile.avatar_url !== maleAvatarUrl && profile.avatar_url !== femaleAvatarUrl) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath]);
        }
      }

      // Set avatar based on gender or empty
      let newAvatarUrl = '';
      if (profile.gender === 'male') {
        newAvatarUrl = maleAvatarUrl;
      } else if (profile.gender === 'female') {
        newAvatarUrl = femaleAvatarUrl;
      }

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl, updated_at: new Date() })
        .eq('id', user!.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      toast.success('Photo de profil supprimée');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Erreur lors de la suppression de la photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      toast.error('Veuillez écrire "SUPPRIMER" pour confirmer');
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_user_account', {
        p_user_id: user!.id
      });

      if (error) throw error;

      await signOut();
      toast.success('Votre compte a été supprimé avec succès');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Erreur lors de la suppression du compte');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
    <div className="container mx-auto px-4 py-8 mt-16 relative">
      {/* Side banners - only visible on desktop */}
      <SideBanner position="left" />
      <SideBanner position="right" />
      
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Mon profil" />

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <img
                  src={profile.avatar_url || (profile.gender === 'male' ? maleAvatarUrl : profile.gender === 'female' ? femaleAvatarUrl : defaultAvatarUrl)}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                  key={`profile-avatar-${profile.avatar_url || profile.gender || 'default'}`} // Add key to force re-render
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-all duration-200 flex items-center justify-center">
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 bg-white rounded-full hover:bg-gray-100"
                      disabled={uploadingAvatar}
                      title="Modifier"
                    >
                      <Camera className="h-5 w-5 text-gray-700" />
                    </button>
                    <button 
                      onClick={handleDeleteAvatar}
                      className="p-1 bg-white rounded-full hover:bg-gray-100"
                      disabled={uploadingAvatar || !profile.avatar_url}
                      title="Supprimer"
                    >
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Gender selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Civilité
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`flex flex-col sm:flex-row items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    profile.gender === 'male' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-primary/50'
                  }`}
                  onClick={() => handleGenderChange('male')}
                >
                  <img 
                    src={maleAvatarUrl} 
                    alt="Monsieur" 
                    className="w-16 h-16 rounded-full mb-2 sm:mb-0 sm:mr-3"
                  />
                  <div className="text-center sm:text-left">
                    <div className="font-medium">Monsieur</div>
                  </div>
                </div>
                <div 
                  className={`flex flex-col sm:flex-row items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    profile.gender === 'female' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-primary/50'
                  }`}
                  onClick={() => handleGenderChange('female')}
                >
                  <img 
                    src={femaleAvatarUrl} 
                    alt="Madame" 
                    className="w-16 h-16 rounded-full mb-2 sm:mb-0 sm:mr-3"
                  />
                  <div className="text-center sm:text-left">
                    <div className="font-medium">Madame</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nom d'utilisateur
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={profile.username}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                  Code postal
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={profile.postal_code}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary focus:border-primary"
                  placeholder="Ex: 75001"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  Ville
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={profile.city}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary focus:border-primary"
                  placeholder="Ex: Paris"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                Numéro de téléphone
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={profile.phone_number}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  placeholder="Ex : 06 12 34 56 78"
                />
              </div>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="share_phone_number"
                    checked={profile.share_phone_number}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Partager mon numéro de téléphone sur mes annonces
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>

        {/* Zone de danger */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-red-200">
          <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Zone de danger
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">Supprimer mon compte</h3>
              <p className="text-sm text-red-600 mb-4">
                Cette action est irréversible. Toutes vos données seront définitivement supprimées, y compris vos annonces, réservations, messages et évaluations.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer mon compte
                </button>
              ) : (
                <div className="space-y-3 border-t border-red-200 pt-3">
                  <p className="text-sm font-medium text-red-800">
                    Pour confirmer, écrivez "SUPPRIMER" ci-dessous :
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="SUPPRIMER"
                  />
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Suppression...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Confirmer la suppression
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      disabled={isDeleting}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}