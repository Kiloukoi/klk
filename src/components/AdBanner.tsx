import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  zoneId: string;
  adLink: string;
  className?: string;
}

export default function AdBanner({ zoneId, adLink, className = '' }: AdBannerProps) {
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
    <a href={adLink} target="_blank" rel="noopener noreferrer" className="block">
      <div ref={adRef} className={`ad-container min-h-[100px] ${className}`} data-zone={zoneId}>
        {/* Monetag ads will be injected dynamically by the script */}
      </div>
    </a>
  );
}
