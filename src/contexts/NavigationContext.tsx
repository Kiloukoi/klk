import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

interface NavigationContextType {
  isNavigating: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(true); // Start with loading on first render
  const [showLoader, setShowLoader] = useState(true);
  const location = useLocation();

  // Handle initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigating(false);
      setShowLoader(false);
    }, 2200); // Slightly longer than the LoadingScreen's minDuration

    return () => clearTimeout(timer);
  }, []);

  // Handle navigation changes
  useEffect(() => {
    if (!showLoader) { // Skip the first render which is handled above
      setIsNavigating(true);
      setShowLoader(true);
      
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setShowLoader(false);
      }, 2200);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <NavigationContext.Provider value={{ isNavigating }}>
      {showLoader && <LoadingScreen />}
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}