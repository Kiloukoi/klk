import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if this is a new login by looking for a flag in sessionStorage
    const hasShownWelcome = sessionStorage.getItem('hasShownWelcome');
    
    if (user && !hasShownWelcome) {
      setIsOpen(true);
      // Set the flag to prevent showing on reload
      sessionStorage.setItem('hasShownWelcome', 'true');
    }
  }, [user]); // Only depend on user to show popup on login

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fadeIn">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Bienvenue sur Kiloukoi ! 👋
        </h2>

        <p className="text-gray-600 mb-6">
          Le site est en évolution constante. Si vous rencontrez un dysfonctionnement, n'hésitez pas à nous le faire savoir en nous contactant via la page "Contact".
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
          <Link
            to="/contact"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  );
}