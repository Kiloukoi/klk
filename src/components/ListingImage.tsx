import React from 'react';
import Logo from './Logo';

interface ListingImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export default function ListingImage({ src, alt, className = '', onClick }: ListingImageProps) {
  // Use the new default image URL if no src is provided
  const imageUrl = src || 'https://ighqyvttbwqivsemrqon.supabase.co/storage/v1/object/public/assets//IMG_0006.PNG';

  return (
    <div 
      className={`absolute inset-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
      />
      {/* Watermark */}
      <div className="absolute bottom-2 right-2 opacity-30 pointer-events-none">
        <Logo className="h-6 w-auto" color="white" />
      </div>
    </div>
  );
}