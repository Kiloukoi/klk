import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton className="mb-6" />
      
      <PageHeader title="Qui sommes-nous ?" />
      
      <div className="bg-white rounded-lg shadow-md p-6 prose max-w-none">
        <p>
          Kiloukoi est né d'une vision simple : faciliter le partage et la location d'objets entre particuliers.
        </p>
        <br></br>
        <h2>Notre Mission : </h2><br></br>
        <p>
          Nous croyons en une économie du partage qui profite à tous. Notre plateforme permet de :
        </p><br></br>
        <ul>
          <li>- Donner une seconde vie aux objets</li>
          <li>- Réduire le gaspillage et la surconsommation</li>
          <li>- Créer du lien social entre les membres de la communauté</li>
          <li>- Permettre à chacun de générer des revenus complémentaires</li>
        </ul><br></br>

        <h2>Notre Histoire : </h2><br></br>
        <p>
          Fondé en 2020, pendant le COVID-19, Kiloukoi est le fruit d'une collaboration entre passionnés de l'économie collaborative.
        </p><br></br>

        <h2>Nos Valeurs :</h2><br></br>
        <ul>
          <li>- Confiance et transparence</li>
          <li>- Responsabilité environnementale</li>
          <li>- Innovation et simplicité</li>
          <li>- Communauté et partage</li>
        </ul><br></br>

        <h2>Notre Équipe :</h2><br></br>
        <p>
          Une équipe passionnée travaille chaque jour pour améliorer votre expérience sur Kiloukoi.
        </p>

        <div className="mt-8 text-center">
          <p className="italic">
            "Ensemble, construisons une économie plus collaborative et responsable."
          </p>
        </div>
      </div>
    </div>
  );
}