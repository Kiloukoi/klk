import React, { useEffect, useRef } from 'react';

interface MonetizationBannerProps {
  className?: string;
  url?: string;
}

export default function MonetizationBanner({ className = '', url = 'https://phoampor.top/4/9154371' }: MonetizationBannerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Create a random ID to avoid caching issues
    const randomId = Math.floor(Math.random() * 1000000);
    
    if (iframeRef.current) {
      iframeRef.current.src = `${url}?${randomId}`;
    }
  }, [url]);

  return (
    <div className={`monetization-container min-h-[100px] w-full ${className}`}>
      <iframe 
        ref={iframeRef}
        title="Monetization Content"
        width="100%" 
        height="100%" 
        style={{ minHeight: '100px', border: 'none', overflow: 'hidden' }}
        scrolling="no"
        loading="lazy"
        allow="autoplay"
      />
    </div>
  );
}