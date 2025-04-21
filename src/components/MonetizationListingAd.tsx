import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface MonetizationListingAdProps {
  url?: string;
  className?: string;
}

export default function MonetizationListingAd({ 
  className = '', 
  url = 'https://www.profitableratecpm.com/z8jj97wv?key=21713001843103ea1def6c2e4b45be45' 
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
    
    // Only set src if URL is provided
    if (url) {
      iframe.src = `${url}?${randomParam}&ref=${encodeURIComponent(window.location.hostname)}`;
    } else {
      // Placeholder content when no URL is provided
      iframe.srcdoc = `
        <html>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#f0f0f0;color:#666;font-family:sans-serif;height:100%;">
            <div style="text-align:center;">
              <div style="font-size:14px;">Emplacement publicitaire</div>
            </div>
          </body>
        </html>
      `;
    }
    
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
          data-ad-url={url}
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