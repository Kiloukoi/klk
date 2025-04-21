import React from 'react';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';

export default function CGU() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton className="mb-6" />
      
      <PageHeader title="Conditions Générales d'Utilisation" />
      
      <div className="bg-white rounded-lg shadow-md p-6 prose max-w-none">
        <p className="text-sm text-gray-500 mb-4">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>

        <h2>1. Objet</h2>
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme Kiloukoi,
          accessible via le site web www.kilou-koi.fr.
        </p>

        <h2>2. Inscription et compte utilisateur</h2>
        <p>
          Pour utiliser nos services, vous devez :
        </p>
        <ul>
          <li>Être âgé d'au moins 18 ans</li>
          <li>Créer un compte avec des informations exactes</li>
          <li>Maintenir la confidentialité de vos identifiants</li>
        </ul>

        <h2>3. Services proposés</h2>
        <p>
          Kiloukoi permet la mise en relation entre particuliers pour la location de biens.
        </p>

        <h2>4. Responsabilités</h2>
        <h3>4.1 Responsabilités de Kiloukoi</h3>
        <p>
          Kiloukoi s'engage à :
        </p>
        <ul>
          <li>Maintenir la plateforme accessible</li>
          <li>Assurer la sécurité des données</li>
          <li>Modérer les contenus inappropriés</li>
        </ul>

        <h3>4.2 Responsabilités des utilisateurs</h3>
        <p>
          Les utilisateurs s'engagent à :
        </p>
        <ul>
          <li>Fournir des informations exactes</li>
          <li>Respecter les conditions de location</li>
          <li>Ne pas utiliser la plateforme à des fins illégales</li>
        </ul>

        <h2>5. Propriété intellectuelle</h2>
        <p>
          Tous les contenus présents sur Kiloukoi sont protégés par le droit de la propriété intellectuelle.
        </p>

        <h2>6. Protection des données personnelles</h2>
        <p>
          Vos données personnelles sont traitées conformément à notre politique de confidentialité.
        </p>

        <h2>7. Modification des CGU</h2>
        <p>
          Kiloukoi se réserve le droit de modifier les présentes CGU à tout moment.
        </p>

        <h2>8. Droit applicable</h2>
        <p>
          Les présentes CGU sont soumises au droit français.
        </p>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Pour toute question concernant ces CGU, contactez-nous à :
            <a href="mailto:legal@kiloukoi.fr" className="text-primary hover:text-primary-dark ml-1">
              contact@kilou-koi.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}