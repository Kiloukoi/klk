import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import ListingImage from './ListingImage';

interface SponsoredListingProps {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  imageUrl: string;
  externalUrl: string;
  sponsorName: string;
  className?: string;
}

export default function SponsoredListing({
  id,
  title,
  description,
  price,
  location,
  category,
  imageUrl,
  externalUrl,
  sponsorName,
  className = ''
}: SponsoredListingProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation to listing details
    e.preventDefault();
    // Open external URL in new tab
    window.open(externalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative cursor-pointer"
        onClick={handleClick}
      >
        {/* Sponsored badge */}
        <div className="absolute top-2 right-2 z-10 bg-primary/90 text-white text-xs px-2 py-1 rounded-full">
          Sponsorisé
        </div>
        
        <div className="relative w-full" style={{ paddingTop: '75%' }}> {/* Aspect ratio 4:3 */}
          <ListingImage
            src={imageUrl}
            alt={title}
          />
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1">
            {title}
          </h3>
          
          <div className="flex items-center text-gray-600 mt-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm line-clamp-1">{location}</span>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-500">
              {category}
            </span>
            <span className="text-lg font-bold text-primary">
              {price}€ <span className="text-sm font-normal">/jour</span>
            </span>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Par {sponsorName}
          </div>
        </div>
      </div>
    </div>
  );
}