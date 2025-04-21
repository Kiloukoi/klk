import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

export default function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adRef.current) return;
    
    try {
      // Create a custom script element
      const script = document.createElement('script');
      script.async = true;
      script.dataset.adClient = 'ca-pub-3280343302166205';
      script.dataset.adSlot = slot;
      script.dataset.adFormat = format;
      script.dataset.fullWidthResponsive = 'true';
      
      // Add a random ID to avoid caching
      const randomId = `ad-${Math.random().toString(36).substring(2, 15)}`;
      script.id = randomId;
      
      // Set the script content
      script.innerHTML = `
        (function() {
          const adElement = document.getElementById('${randomId}');
          if (!adElement || !adElement.parentNode) return;
          
          const adContainer = adElement.parentNode;
          const ins = document.createElement('ins');
          ins.className = 'adsbygoogle';
          ins.style.display = 'block';
          ins.style.minHeight = '100px';
          ins.dataset.adClient = 'ca-pub-3280343302166205';
          ins.dataset.adSlot = '${slot}';
          ins.dataset.adFormat = '${format}';
          ins.dataset.fullWidthResponsive = 'true';
          
          adContainer.appendChild(ins);
          
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        })();
      `;
      
      // Add the script to the container
      adRef.current.appendChild(script);
    } catch (error) {
      console.error('Error loading AdSense ad:', error);
    }
    
    // Cleanup function
    return () => {
      if (adRef.current) {
        adRef.current.innerHTML = '';
      }
    };
  }, [slot, format]);

  return (
    <div ref={adRef} className={`ad-container min-h-[100px] ${className}`} data-ad-container="true"></div>
  );
}