import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';
import { 
  getCookiePreferences, 
  saveCookiePreferences, 
  ConsentStatus,
  CookieCategory
} from '../../utils/cookieManager';

export default function Cookies() {
  const [preferences, setPreferences] = useState(getCookiePreferences());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePreferenceChange = (category: keyof typeof preferences) => {
    if (category === 'necessary') return; // Cannot change necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSavePreferences = () => {
    saveCookiePreferences(preferences, ConsentStatus.CUSTOM);
    window.location.reload(); // Reload to apply changes
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton className="mb-6" />
      
      <PageHeader title="Gestion des cookies" />
      
      <div className="bg-white rounded-lg shadow-md p-6 prose max-w-none">
        <p className="text-sm text-gray-500 mb-4">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>

        <h2>1. Qu'est-ce qu'un cookie ?</h2>
        <p>
          Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d'un site web.
          Il permet de stocker des informations relatives à votre navigation et de vous offrir une expérience
          personnalisée.
        </p>

        <h2>2. Les cookies que nous utilisons</h2>
        
        <div className="space-y-4 my-6">
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

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSavePreferences}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Enregistrer mes préférences
            </button>
          </div>
        </div>

        <h2>3. Durée de conservation</h2>
        <p>
          Les cookies peuvent être :
        </p>
        <ul>
          <li>Temporaires (supprimés à la fermeture du navigateur)</li>
          <li>Persistants (durée maximale de 13 mois conformément aux recommandations de la CNIL)</li>
        </ul>

        <h2>4. Gestion des cookies</h2>
        <p>
          Vous pouvez à tout moment :
        </p>
        <ul>
          <li>Accepter ou refuser les cookies</li>
          <li>Modifier vos préférences</li>
          <li>Supprimer les cookies existants</li>
        </ul>

        <h2>5. Impact du refus des cookies</h2>
        <p>
          Le refus des cookies essentiels peut limiter l'accès à certaines fonctionnalités du site.
          Les cookies non essentiels n'affecteront pas votre expérience de navigation principale.
        </p>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Pour toute question concernant les cookies, contactez-nous à :
            <a href="mailto:privacy@kiloukoi.fr" className="text-primary hover:text-primary-dark ml-1">
              privacy@kiloukoi.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}