import React from 'react';
import { Calendar, Tag, Clock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BlogPost } from '../data/blogPosts';

interface BlogPostCardProps {
  post: BlogPost;
  className?: string;
}

export default function BlogPostCard({ post, className = '' }: BlogPostCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/blog/${post.id}`);
  };

  return (
    <article
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="relative">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-48 object-cover"
        />
        {post.featured && (
          <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
            À la une
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center text-xs text-gray-500 mb-2 gap-2">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{new Date(post.date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="flex items-center">
            <Tag className="w-3 h-3 mr-1" />
            <span>{post.category}</span>
          </div>
          {post.readTime && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{post.readTime} min</span>
            </div>
          )}
          {post.views && (
            <div className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              <span>{post.views}</span>
            </div>
          )}
        </div>
        <h2 className="text-xl font-semibold mb-2 line-clamp-2">{post.title}</h2>
        <p className="text-gray-600 mb-4 text-sm line-clamp-3">{post.excerpt}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author}`} 
              alt={post.author} 
              className="w-8 h-8 rounded-full mr-2"
            />
            <span className="text-sm text-gray-700">{post.author}</span>
          </div>
          <button className="text-primary hover:text-primary-dark font-medium text-sm">
            Lire la suite
          </button>
        </div>
      </div>
    </article>
  );
}