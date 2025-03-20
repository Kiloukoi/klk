import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';

export default function Legal() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton className="mb-6" />
      
      <PageHeader title="Mentions légales" />
      
      <div className="bg-white rounded-lg shadow-md p-6 prose max-w-none">
        <h2>1. Informations légales</h2>
        <p>
          Kiloukoi est édité par la société Kiloukoi SAS :
        </p>
        <ul>
          <li>Siège social : 123 rue de la Location, 75001 Paris</li>
          <li>SIRET : 123 456 789 00001</li>
          <li>Capital social : 10 000€</li>
          <li>RCS Paris B 123 456 789</li>
          <li>N° TVA : FR 12 345 678 901</li>
        </ul>

        <h2>2. Contact</h2>
        <ul>
          <li>Email : contact@kilou-koi.fr</li>
        </ul>

        <h2>3. Direction de la publication</h2>
        <p>
          Directeur de la publication : Souphanh Benyoucef, Président
        </p>

        <h2>4. Hébergement</h2>
        <p>
          Le site est hébergé par :
        </p>
        <ul>
          <li>Société : IONOS SARL</li>
          <li>Adresse : 7 PLACE DE LA GARE, 57200 SARREGUEMINES</li>
        </ul>

        <h2>5. Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu du site (textes, images, vidéos, etc.) est protégé par le droit
          d'auteur et est la propriété exclusive de Kiloukoi SAS.
        </p>

        <h2>6. Protection des données</h2>
        <p>
          Conformément à la loi Informatique et Libertés et au RGPD, vous disposez d'un droit
          d'accès, de rectification et de suppression de vos données.
        </p>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Pour toute question concernant les mentions légales, contactez notre service juridique :
            <a href="mailto:conatct@kilou-koi.fr" className="text-primary hover:text-primary-dark ml-1">
              conatact@kilou-koi.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}