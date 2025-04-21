import React, { useEffect, useRef } from 'react';

interface MonetizationBannerProps {
  className?: string;
  url?: string;
}

export default function MonetizationBanner({ className = '', url = 'https://phoampor.top/4/9154371' }: MonetizationBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create a dynamic iframe to avoid detection
    const iframe = document.createElement('iframe');
    
    // Set attributes that help bypass blockers
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.minHeight = '100px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.title = 'Content Frame';
    iframe.loading = 'eager'; // Use eager loading
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    
    // Add random parameter to bypass caching
    const randomParam = Math.floor(Math.random() * 1000000);
    iframe.src = `${url}?${randomParam}&ref=${encodeURIComponent(window.location.hostname)}`;
    
    // Clear container and append iframe
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);
    
    // Return cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [url]);

  return (
    <div 
      ref={containerRef} 
      className={`monetization-container min-h-[100px] w-full ${className}`}
      data-ad-container="true"
    ></div>
  );
}