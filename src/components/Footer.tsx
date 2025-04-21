import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <Logo className="h-8 mb-4" />
            <p className="text-gray-600 mb-4">
              Kiloukoi est la première plateforme de location entre particuliers.
              Louez et mettez en location vos biens en toute sécurité.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href="https://www.instagram.com/kiloukoi/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="mailto:contact@kilou-koi.fr"
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Email"
              >
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Liens */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">À propos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-primary">
                  Qui sommes-nous ?
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-600 hover:text-primary">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Mentions légales */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Mentions légales</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/cgu" className="text-gray-600 hover:text-primary">
                  CGU
                </Link>
              </li>
              <li>
                <Link to="/cgv" className="text-gray-600 hover:text-primary">
                  CGV
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-primary">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-600 hover:text-primary">
                  Gestion des cookies
                </Link>
              </li>
              <li>
                <Link to="/legal" className="text-gray-600 hover:text-primary">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
          © {currentYear} Kiloukoi. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}