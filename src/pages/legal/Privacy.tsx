import React from 'react';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton className="mb-6" />
      
      <PageHeader title="Politique de confidentialité" />
      
      <div className="bg-white rounded-lg shadow-md p-6 prose max-w-none">
        <p className="text-sm text-gray-500 mb-4">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>

        <h2>1. Collecte des données</h2>
        <p>
          Nous collectons les données suivantes :
        </p>
        <ul>
          <li>Informations d'identification (nom, prénom, email)</li>
          <li>Données de connexion</li>
          <li>Informations de paiement</li>
          <li>Historique des locations</li>
        </ul>

        <h2>2. Utilisation des données</h2>
        <p>
          Vos données sont utilisées pour :
        </p>
        <ul>
          <li>Gérer votre compte</li>
          <li>Traiter vos locations</li>
          <li>Améliorer nos services</li>
          <li>Vous envoyer des communications marketing (avec votre consentement)</li>
        </ul>

        <h2>3. Protection des données</h2>
        <p>
          Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données :
        </p>
        <ul>
          <li>Chiffrement des données sensibles</li>
          <li>Accès restreint aux données personnelles</li>
          <li>Surveillance continue de nos systèmes</li>
        </ul>

        <h2>4. Partage des données</h2>
        <p>
          Vos données peuvent être partagées avec :
        </p>
        <ul>
          <li>Nos prestataires de services (hébergement, paiement)</li>
          <li>Les autorités compétentes sur demande</li>
        </ul>

        <h2>5. Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez des droits suivants :
        </p>
        <ul>
          <li>Droit d'accès à vos données</li>
          <li>Droit de rectification</li>
          <li>Droit à l'effacement</li>
          <li>Droit à la portabilité</li>
          <li>Droit d'opposition</li>
        </ul>

        <h2>6. Conservation des données</h2>
        <p>
          Nous conservons vos données pendant la durée nécessaire aux finalités pour lesquelles
          elles ont été collectées.
        </p>

        <h2>7. Cookies</h2>
        <p>
          Notre utilisation des cookies est détaillée dans notre politique de gestion des cookies.
        </p>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Pour exercer vos droits ou pour toute question, contactez notre DPO :
            <a href="mailto:contact@kilou-koi.fr" className="text-primary hover:text-primary-dark ml-1">
              contact@kilou-koi.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}