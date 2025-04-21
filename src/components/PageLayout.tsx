import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="relative min-h-screen">
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}