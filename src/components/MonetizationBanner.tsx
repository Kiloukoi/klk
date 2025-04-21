import React, { useEffect, useRef } from 'react';

interface MonetizationBannerProps {
  className?: string;
  url?: string;
}

export default function MonetizationBanner({ className = '', url = 'https://www.profitableratecpm.com/z8jj97wv?key=21713001843103ea1def6c2e4b45be45' }: MonetizationBannerProps) {
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
    
    // Only set src if URL is provided
    if (url) {
      iframe.src = `${url}?${randomParam}&ref=${encodeURIComponent(window.location.hostname)}`;
    } else {
      // Placeholder content when no URL is provided
      iframe.srcdoc = `
        <html>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#f9f9f9;color:#666;font-family:sans-serif;">
            <div style="text-align:center;">
              <div style="font-size:20px;">Emplacement publicitaire</div>
            </div>
          </body>
        </html>
      `;
    }
    
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
      data-ad-url={url}
    ></div>
  );
}
