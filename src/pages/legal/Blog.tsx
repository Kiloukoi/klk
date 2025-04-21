import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';
import { ArrowLeft } from 'lucide-react';
import { blogPosts } from '../../data/blogPosts';
import BlogPostCard from '../../components/BlogPostCard';
import BlogPostDetail from '../../components/BlogPostDetail';
import MonetizationBanner from '../../components/MonetizationBanner';

export default function Blog() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState(postId ? blogPosts.find(post => post.id === postId) : null);
  const [featuredPosts, setFeaturedPosts] = useState(blogPosts.filter(post => post.featured));
  const [regularPosts, setRegularPosts] = useState(blogPosts.filter(post => !post.featured));

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Update selected post when URL parameter changes
    if (postId) {
      const post = blogPosts.find(post => post.id === postId);
      setSelectedPost(post || null);
    } else {
      setSelectedPost(null);
    }
  }, [postId]);

  const handleBackToList = () => {
    navigate('/blog');
    setSelectedPost(null);
  };

  // If a specific post is selected, show the full article
  if (selectedPost) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button 
          onClick={handleBackToList} 
          className="flex items-center text-primary hover:text-primary-dark mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux articles
        </button>
        
        <BlogPostDetail post={selectedPost} onBack={handleBackToList} />
        
        {/* Monetization Banner */}
        <div className="mt-8">
          <MonetizationBanner />
        </div>
      </div>
    );
  }

  // Otherwise, show the blog listing
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton className="mb-6" />
      
      <PageHeader title="Blog" />
      
      {/* Monetization Banner */}
      <div className="mb-8">
        <MonetizationBanner />
      </div>

      {/* Featured posts */}
      {featuredPosts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">À la une</h2>
          <div className="grid grid-cols-1 gap-8">
            {featuredPosts.map(post => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* Regular posts */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Tous les articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {regularPosts.map(post => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
      
      {/* Bottom Monetization Banner */}
      <div className="mt-8">
        <MonetizationBanner />
      </div>
    </div>
  );
}