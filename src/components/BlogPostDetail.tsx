import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Tag, ArrowLeft, Clock, Eye } from 'lucide-react';
import { BlogPost } from '../data/blogPosts';
import { blogPosts } from '../data/blogPosts';

interface BlogPostDetailProps {
  post: BlogPost;
  onBack: () => void;
}

export default function BlogPostDetail({ post, onBack }: BlogPostDetailProps) {
  const navigate = useNavigate();
  
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden">
      <img
        src={post.image}
        alt={post.title}
        className="w-full h-64 md:h-96 object-cover"
      />
      
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center text-sm text-gray-500 mb-4 gap-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{new Date(post.date).toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            <span>{post.author}</span>
          </div>
          <div className="flex items-center">
            <Tag className="w-4 h-4 mr-1" />
            <span>{post.category}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{post.readTime} min de lecture</span>
          </div>
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            <span>{post.views} vues</span>
          </div>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold mb-4">{post.title}</h1>
        
        <div className="prose max-w-none">
          {post.fullContent.map((paragraph, index) => (
            <React.Fragment key={index}>
              {paragraph.type === 'paragraph' && <p>{paragraph.content}</p>}
              {paragraph.type === 'heading' && <h2 className="text-xl font-semibold mt-6 mb-3">{paragraph.content}</h2>}
              {paragraph.type === 'list' && (
                <ul className="list-disc pl-5 my-4">
                  {paragraph.items?.map((item, i) => (
                    <li key={i} className="mb-2">{item}</li>
                  ))}
                </ul>
              )}
              {paragraph.type === 'image' && (
                <div className="my-6">
                  <img 
                    src={paragraph.src} 
                    alt={paragraph.alt || ''} 
                    className="rounded-lg w-full"
                  />
                  {paragraph.caption && (
                    <p className="text-sm text-gray-500 text-center mt-2">{paragraph.caption}</p>
                  )}
                </div>
              )}
              {paragraph.type === 'quote' && (
                <blockquote className="border-l-4 border-primary pl-4 italic my-6">
                  {paragraph.content}
                  {paragraph.author && (
                    <footer className="text-sm mt-2">— {paragraph.author}</footer>
                  )}
                </blockquote>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Author bio */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-start">
            <img 
              src={post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author}`} 
              alt={post.author} 
              className="w-12 h-12 rounded-full mr-4"
            />
            <div>
              <h3 className="font-medium">{post.author}</h3>
              <p className="text-sm text-gray-600 mt-1">{post.authorBio || "Rédacteur chez Kiloukoi"}</p>
            </div>
          </div>
        </div>
        
        {/* Related posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold mb-4">Articles similaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.relatedPosts.map(relatedPostId => {
                const relatedPost = blogPosts.find(p => p.id === relatedPostId);
                if (!relatedPost) return null;
                
                return (
                  <div 
                    key={relatedPost.id} 
                    className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => navigate(`/blog/${relatedPost.id}`)}
                  >
                    <img 
                      src={relatedPost.image} 
                      alt={relatedPost.title} 
                      className="w-16 h-16 object-cover rounded-md mr-3"
                    />
                    <div>
                      <h4 className="font-medium text-sm line-clamp-2">{relatedPost.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(relatedPost.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}