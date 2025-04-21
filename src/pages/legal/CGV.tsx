import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';

export default function CGV() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton className="mb-6" />
      
      <PageHeader title="Conditions Générales de Vente" />
      
      <div className="bg-white rounded-lg shadow-md p-6 prose max-w-none">
        <p className="text-sm text-gray-500 mb-4">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>

        <h2>1. Préambule</h2>
        <p>
          Les présentes Conditions Générales de Vente (CGV) régissent les relations commerciales
          entre Kiloukoi et ses utilisateurs pour tous les services de location proposés sur la plateforme.
        </p>

        <h2>2. Prix et paiement</h2>
        <h3>2.1 Prix</h3>
        <p>
          Les prix sont affichés en euros TTC. Les propriétaires fixent librement leurs tarifs de location.
        </p>

        <h3>2.2 Paiement</h3>
        <p>
          Le paiement est réalisé directement avec le propriétaire, selon ses conditions. Le paiement peut s'effecteur par :
        </p>
        <ul>
          <li>Carte bancaire</li>
          <li>Espèces</li>
          <li>PayPal</li>
          <li>Virement bancaire</li>
          <li>Chèque</li>
        </ul>

        <h2>3. Commission</h2>
        <p>
          Kiloukoi ne prélève aucune commission sur les locations réalisées via la plateforme.
        </p>

        <h2>4. Caution</h2>
        <p>
          Une caution peut être demandée par le propriétaire. Son montant et ses conditions sont
          précisés dans l'annonce.
        </p>

        <h2>5. Annulation et remboursement</h2>
        <h3>5.1 Conditions d'annulation</h3>
        <ul>
          <li>L'annulation est possible 24h avant la date de début de la réservation par les deux parties.</li>
        </ul>

        <h3>5.2 Cas particuliers</h3>
        <p>
          Des conditions spéciales peuvent s'appliquer en cas de force majeure.
        </p>

        <h2>6. Assurance</h2>
        <p>
          Chaque location est couverte par la responsabilité civile de chaque utilisateur. Parlez-en à votre assureur en premier, notamment si sa valeur dépasse un certain seuil. Cela garantit que vous êtes correctement couvert en cas de problème.
        </p>
        <ul>
        </ul>

        <h2>7. Litiges</h2>
        <p>
          En cas de litige, les parties s'engagent à rechercher une solution amiable avant
          tout recours judiciaire.
        </p>

        <h2>8. Droit de rétractation</h2>
        <p>
          Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation
          ne s'applique pas aux services de location de biens.
        </p>

        <h2>9. Responsabilité</h2>
        <p>
          Kiloukoi ne peut être tenu responsable des dommages directs ou indirects résultant
          de l'utilisation des biens loués.
        </p>

        <h2>10. Modification des CGV</h2>
        <p>
          Kiloukoi se réserve le droit de modifier les présentes CGV à tout moment. Les utilisateurs
          seront informés de toute modification par email.
        </p>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Pour toute question concernant ces CGV, contactez notre service commercial :
            <a href="mailto:contact@kilou-koi.fr" className="text-primary hover:text-primary-dark ml-1">
              contact@kilou-koi.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}