import React, { useState, useEffect } from 'react';
import { X, Check, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    personalization: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consentStatus = localStorage.getItem('cookie-consent-status');
    
    if (!consentStatus) {
      // If no choice has been made, show the banner
      setIsOpen(true);
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(localStorage.getItem('cookie-preferences') || '{}');
        setPreferences(prev => ({
          ...prev,
          ...savedPreferences
        }));
      } catch (error) {
        console.error('Error parsing saved cookie preferences:', error);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true
    };
    
    setPreferences(allAccepted);
    saveConsent(allAccepted, 'accepted_all');
    setIsOpen(false);
  };

  const handleRejectAll = () => {
    const allRejected = {
      necessary: true, // Always required
      analytics: false,
      marketing: false,
      personalization: false
    };
    
    setPreferences(allRejected);
    saveConsent(allRejected, 'rejected_all');
    setIsOpen(false);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences, 'custom');
    setIsOpen(false);
    setShowPreferences(false);
  };

  const saveConsent = (prefs: CookiePreferences, status: string) => {
    // Save the consent status and preferences
    localStorage.setItem('cookie-consent-status', status);
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    
    // Apply the preferences (in a real app, this would enable/disable specific cookies)
    applyPreferences(prefs);
  };

  const applyPreferences = (prefs: CookiePreferences) => {
    // Example implementation - in a real app, you would enable/disable specific tracking scripts
    
    // Analytics (e.g., Google Analytics)
    if (prefs.analytics) {
      // Enable analytics cookies/scripts
      console.log('Analytics cookies enabled');
      // In a real implementation, you might initialize Google Analytics here
    } else {
      // Disable analytics cookies/scripts
      console.log('Analytics cookies disabled');
    }
    
    // Marketing (e.g., ads)
    if (prefs.marketing) {
      // Enable marketing cookies/scripts
      console.log('Marketing cookies enabled');
    } else {
      // Disable marketing cookies/scripts
      console.log('Marketing cookies disabled');
    }
    
    // Personalization
    if (prefs.personalization) {
      // Enable personalization cookies/scripts
      console.log('Personalization cookies enabled');
    } else {
      // Disable personalization cookies/scripts
      console.log('Personalization cookies disabled');
    }
  };

  const handlePreferenceChange = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Cannot change necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const openCookieSettings = () => {
    setIsOpen(true);
    setShowPreferences(true);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={openCookieSettings}
        className="fixed bottom-4 left-4 z-50 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        aria-label="Cookie settings"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  // Main banner at the bottom of the page
  if (!showPreferences) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200 p-4 animate-slideUp">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Nous respectons votre vie privée</h2>
              <p className="text-gray-600 text-sm">
                Nous utilisons des cookies pour améliorer votre expérience, personnaliser le contenu et analyser notre trafic.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Personnaliser
              </button>
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Refuser
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center justify-center text-sm"
              >
                <Check className="w-4 h-4 mr-2" />
                Tout accepter
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
            <span>
              En savoir plus sur notre <Link to="/cookies" className="text-primary hover:underline">politique de cookies</Link>
            </span>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preferences modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowPreferences(false)}></div>
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Paramètres des cookies</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Cookies nécessaires</h3>
                <p className="text-sm text-gray-500">Ces cookies sont indispensables au fonctionnement du site</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={preferences.necessary}
                  disabled
                  className="sr-only"
                />
                <div className="w-10 h-5 bg-primary rounded-full"></div>
                <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transform translate-x-5"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Cookies analytiques</h3>
                <p className="text-sm text-gray-500">Nous aident à comprendre comment vous utilisez le site</p>
              </div>
              <div 
                className="relative cursor-pointer"
                onClick={() => handlePreferenceChange('analytics')}
              >
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={() => {}}
                  className="sr-only"
                />
                <div className={`w-10 h-5 ${preferences.analytics ? 'bg-primary' : 'bg-gray-300'} rounded-full transition-colors`}></div>
                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transform transition-transform ${preferences.analytics ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Cookies marketing</h3>
                <p className="text-sm text-gray-500">Utilisés pour vous montrer des publicités pertinentes</p>
              </div>
              <div 
                className="relative cursor-pointer"
                onClick={() => handlePreferenceChange('marketing')}
              >
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={() => {}}
                  className="sr-only"
                />
                <div className={`w-10 h-5 ${preferences.marketing ? 'bg-primary' : 'bg-gray-300'} rounded-full transition-colors`}></div>
                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transform transition-transform ${preferences.marketing ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Cookies de personnalisation</h3>
                <p className="text-sm text-gray-500">Permettent de personnaliser votre expérience</p>
              </div>
              <div 
                className="relative cursor-pointer"
                onClick={() => handlePreferenceChange('personalization')}
              >
                <input
                  type="checkbox"
                  checked={preferences.personalization}
                  onChange={() => {}}
                  className="sr-only"
                />
                <div className={`w-10 h-5 ${preferences.personalization ? 'bg-primary' : 'bg-gray-300'} rounded-full transition-colors`}></div>
                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transform transition-transform ${preferences.personalization ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Link 
              to="/cookies" 
              className="text-primary hover:text-primary-dark text-sm"
              onClick={() => setIsOpen(false)}
            >
              En savoir plus sur notre politique de cookies
            </Link>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            onClick={handleRejectAll}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Tout refuser
          </button>
          <button
            onClick={handleSavePreferences}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Enregistrer mes choix
          </button>
        </div>
      </div>
    </div>
  );
}