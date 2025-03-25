import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';
import AdBanner from '../components/AdBanner';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  category: string;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: "Comment bien préparer son bien pour la location",
    excerpt: "Découvrez nos conseils pour maximiser vos chances de louer votre bien rapidement et au meilleur prix.",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
    date: "2025-01-15",
    author: "Marie Dupont",
    category: "Conseils"
  },
  {
    id: '2',
    title: "Les tendances de la location entre particuliers en 2025",
    excerpt: "Analyse des nouvelles tendances qui façonnent le marché de la location entre particuliers.",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692",
    date: "2025-01-10",
    author: "Jean Martin",
    category: "Tendances"
  }
];

export default function Blog() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton className="mb-6" />
      
      <PageHeader title="Blog"/>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {blogPosts.map(post => (
          <article
            key={post.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >

            <img
              src={post.image}
              alt={post.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <span>{new Date(post.date).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>{post.category}</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Par {post.author}</span>
                <button className="text-primary hover:text-primary-dark font-medium">
                  Lire la suite
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
