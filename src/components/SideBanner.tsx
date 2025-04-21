import React, { useEffect, useRef } from 'react';

interface SideBannerProps {
  position: 'left' | 'right';
  url?: string;
  className?: string;
}

export default function SideBanner({ 
  position, 
  url = 'https://phoampor.top/4/9211914',
  className = '' 
}: SideBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create a dynamic iframe to avoid detection
    const iframe = document.createElement('iframe');
    
    // Set attributes that help bypass blockers
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.title = `${position} side content`;
    iframe.loading = 'eager'; // Use eager loading
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    
    // Add random parameter to bypass caching
    const randomParam = Math.floor(Math.random() * 1000000);
    const timestamp = Date.now();
    iframe.src = `${url}?${randomParam}&t=${timestamp}&ref=${encodeURIComponent(window.location.hostname)}`;
    
    // Clear container and append iframe
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);
    
    // Return cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [url, position]);

  return (
    <div 
      ref={containerRef}
      className={`fixed ${position === 'left' ? 'left-0' : 'right-0'} top-1/2 transform -translate-y-1/2 z-40 hidden lg:block ${className}`}
      style={{ width: '160px', height: '600px' }}
      data-ad-container="true"
      data-position={position}
    ></div>
  );
}