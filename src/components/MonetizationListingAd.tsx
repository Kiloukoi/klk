import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface MonetizationListingAdProps {
  url?: string;
  className?: string;
}

export default function MonetizationListingAd({ 
  className = '', 
  url = 'https://phoampor.top/4/9154484' 
}: MonetizationListingAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!adContainerRef.current) return;
    
    // Create a dynamic iframe to avoid detection
    const iframe = document.createElement('iframe');
    
    // Set attributes that help bypass blockers
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.title = 'Sponsored Content';
    iframe.loading = 'eager'; // Use eager loading
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    
    // Add random parameter to bypass caching
    const randomParam = Math.floor(Math.random() * 1000000);
    iframe.src = `${url}?${randomParam}&ref=${encodeURIComponent(window.location.hostname)}`;
    
    // Clear container and append iframe
    adContainerRef.current.innerHTML = '';
    adContainerRef.current.appendChild(iframe);
    
    // Return cleanup function
    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
    };
  }, [url]);

  return (
    <div 
      ref={containerRef}
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${className}`}
      style={{ height: '100%' }}
      data-ad-listing="true"
    >
      <div className="relative w-full" style={{ paddingTop: '75%' }}>
        <div 
          ref={adContainerRef} 
          className="absolute inset-0 bg-gray-100"
          data-ad-container="true"
        ></div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-700 line-clamp-1">
          Annonce sponsorisée
        </h3>
        <div className="flex items-center text-gray-600 mt-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm line-clamp-1">Partout en France</span>
        </div>
      </div>
    </div>
  );
}