import React from 'react';
import Logo from './Logo';

interface PageHeaderProps {
  title: string;
  showLogo?: boolean;
}

export default function PageHeader({ title, showLogo = true }: PageHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-center mb-8">
      {showLogo && (
        <Logo className="h-16 mb-4" />
      )}
      <h1 className="text-2xl font-bold text-center">{title}</h1>
    </div>
  );
}