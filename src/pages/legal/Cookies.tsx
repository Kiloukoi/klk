import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';

export default function Cookies() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        </p>

        <h2>2. Les cookies que nous utilisons</h2>
        <h3>2.1 Cookies essentiels</h3>
        <ul>
          <li>Session utilisateur</li>
          <li>Sécurité</li>
          <li>Préférences techniques</li>
        </ul>

        <h3>2.2 Cookies analytiques</h3>
        <ul>
          <li>Google Analytics</li>
          <li>Statistiques de navigation</li>
        </ul>

        <h3>2.3 Cookies marketing</h3>
        <ul>
          <li>Publicités personnalisées</li>
          <li>Réseaux sociaux</li>
        </ul>

        <h2>3. Durée de conservation</h2>
        <p>
          Les cookies peuvent être :
        </p>
        <ul>
          <li>Temporaires (supprimés à la fermeture du navigateur)</li>
          <li>Persistants (durée maximale de 13 mois)</li>
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
        </p>

        <div className="mt-8 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Gérer vos préférences</h3>
            <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors">
              Paramètres des cookies
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Pour toute question concernant les cookies, contactez-nous à :
              <a href="mailto:privacy@kiloukoi.fr" className="text-primary hover:text-primary-dark ml-1">
                privacy@kiloukoi.fr
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}