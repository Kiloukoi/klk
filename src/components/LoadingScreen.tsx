import React, { useState, useEffect } from 'react';
import Logo from './Logo';

interface LoadingScreenProps {
  minDuration?: number; // Minimum time to show the loading screen in ms
}

export default function LoadingScreen({ minDuration = 2000 }: LoadingScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="animate-pulse-slow">
        <Logo className="h-24 md:h-32" />
      </div>
      <div className="mt-8 relative w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-primary rounded-full animate-loadingBar"></div>
      </div>
    </div>
  );
}