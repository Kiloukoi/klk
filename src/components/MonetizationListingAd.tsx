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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create a random ID to avoid caching issues
    const randomId = Math.floor(Math.random() * 1000000);
    
    if (iframeRef.current) {
      iframeRef.current.src = `${url}?${randomId}`;
    }
  }, [url]);

  return (
    <div 
      ref={containerRef}
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${className}`}
      style={{ height: '100%' }}
    >
      <div className="relative w-full" style={{ paddingTop: '75%' }}>
        <div className="absolute inset-0 bg-gray-100">
          <iframe 
            ref={iframeRef}
            title="Sponsored Content"
            width="100%" 
            height="100%" 
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no"
            loading="lazy"
            allow="autoplay"
          />
        </div>
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