import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className = ''
}: PaginationProps) {
  // Ne pas afficher la pagination s'il n'y a qu'une seule page
  if (totalPages <= 1) return null;

  // Calculer les pages à afficher (max 5)
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Toujours afficher la première page
    pageNumbers.push(1);
    
    // Calculer la plage de pages à afficher autour de la page courante
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Ajuster pour toujours afficher 3 pages au milieu si possible
    if (endPage - startPage < 2) {
      if (startPage === 2) {
        endPage = Math.min(totalPages - 1, startPage + 2);
      } else if (endPage === totalPages - 1) {
        startPage = Math.max(2, endPage - 2);
      }
    }
    
    // Ajouter des ellipses si nécessaire
    if (startPage > 2) {
      pageNumbers.push('...');
    }
    
    // Ajouter les pages du milieu
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Ajouter des ellipses si nécessaire
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }
    
    // Toujours afficher la dernière page si elle existe
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* Bouton précédent */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Page précédente"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {/* Numéros de page */}
      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-3 py-2">...</span>
          ) : (
            <button
              onClick={() => typeof page === 'number' && onPageChange(page)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      
      {/* Bouton suivant */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Page suivante"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}