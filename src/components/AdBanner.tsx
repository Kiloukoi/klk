import React from 'react';

interface AdBannerProps {
  adLink: string;
  className?: string;
}

export default function AdBanner({ adLink, className = '' }: AdBannerProps) {
  return (
    <a href={adLink} target="_blank" rel="noopener noreferrer" className="block">
      <iframe 
        src={adLink}
        width="100%" 
        height="250" 
        style={{ border: 'none', overflow: 'hidden' }}
        scrolling="no"
        allowFullScreen
      ></iframe>
    </a>
  );
}
