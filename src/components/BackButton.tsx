import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BackButtonProps {
  className?: string;
}

export default function BackButton({ className = '' }: BackButtonProps) {
  return (
    <Link 
      to="/" 
      className={`inline-flex items-center text-gray-600 hover:text-primary transition-colors ${className}`}
    >
      <ChevronLeft className="w-5 h-5" />
      <span>Retour à l'accueil</span>
    </Link>
  );
}