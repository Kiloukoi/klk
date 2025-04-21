import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import BackButton from '../../components/BackButton';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    question: "Comment fonctionne la location sur Kiloukoi ?",
    answer: "Kiloukoi permet aux particuliers de louer leurs biens à d'autres utilisateurs. Le propriétaire fixe le prix et les conditions, le locataire effectue la réservation. Le paiement est réalisé directement avec le propriétaire, selon ses conditions. Si la location de matériel vous offre l'opportunité de répondre à des besoins spécifiques sans casser sa tirelire, nous vous recommandons de prêter une plus grande attention à ces objets qui ne vous appartiennent pas. Respect et confiance sont les maîtres mots de ce type d'échange !",
    category: "Général"
  },
  {
    question: "Comment sont protégés les biens loués ?",
    answer: "Vous souhaitez prêter vos biens de valeur ?  Parlez-en à votre assureur en premier, notamment si sa valeur dépasse un certain seuil. Cela garantit que vous êtes correctement couvert en cas de problème. Vous pourrez avoir l'esprit tranquille ! Si une indemnisation n'est pas directement engagée, deux options s'offrent généralement : le recours ou la protection juridique. Dans le premier cas, si un tiers est responsable des dommages, l'assureur peut engager la responsabilité civile de cette personne pour obtenir réparation.",
    category: "Sécurité"
  },
  {
    question: "Comment fonctionne le paiement ?",
    answer: "Le paiement est réalisé directement avec le propriétaire, selon ses conditions.",
    category: "Paiement"
  }
];

const categories = Array.from(new Set(faqs.map(faq => faq.category)));

export default function FAQ() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton className="mb-6" />
      
      <PageHeader title="Foire aux questions" />

      <div className="mb-8 space-y-4">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-sm ${
              !selectedCategory
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredFaqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
            >
              <span className="font-medium">{faq.question}</span>
              {openItems.includes(index) ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {openItems.includes(index) && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucune question ne correspond à votre recherche
          </div>
        )}
      </div>
    </div>
  );
}