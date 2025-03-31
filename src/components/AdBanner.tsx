import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  zoneId: string;
  className?: string;
}

export default function AdBanner({ zoneId, className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://shebudriftaiter.net/tag.min.js';
    script.setAttribute('data-zone', zoneId);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [zoneId]);

  return (
    <div ref={adRef} className={`ad-container min-h-[100px] ${className}`} data-zone={zoneId}>
      {/* Monetag ads will be injected dynamically by the script */}
    </div>
  );
}
