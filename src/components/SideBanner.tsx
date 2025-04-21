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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Create a random ID to avoid caching issues
    const randomId = Math.floor(Math.random() * 1000000);
    
    if (iframeRef.current) {
      iframeRef.current.src = `${url}?${randomId}`;
    }
  }, [url]);

  return (
    <div 
      className={`fixed ${position === 'left' ? 'left-0' : 'right-0'} top-1/2 transform -translate-y-1/2 z-40 hidden lg:block ${className}`}
      style={{ width: '160px', height: '600px' }}
    >
      <iframe 
        ref={iframeRef}
        title={`${position} side banner`}
        width="100%" 
        height="100%" 
        style={{ border: 'none', overflow: 'hidden' }}
        scrolling="no"
        loading="lazy"
        allow="autoplay"
      />
    </div>
  );
}