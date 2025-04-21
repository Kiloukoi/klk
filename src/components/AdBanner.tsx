import React from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

export default function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const adRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Wait for the element to be properly sized
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        try {
          // Only push ad if container has width
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          // Disconnect after successful push
          observer.disconnect();
        } catch (error) {
          console.error('Error loading AdSense ad:', error);
        }
      }
    });

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={adRef} className={`ad-container min-h-[100px] ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '100px' }}
        data-ad-client="ca-pub-3280343302166205"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}