/**
 * Utility functions for managing cookies in compliance with CNIL regulations
 */

// Cookie categories
export enum CookieCategory {
  NECESSARY = 'necessary',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization'
}

// Cookie consent status
export enum ConsentStatus {
  ACCEPTED_ALL = 'accepted_all',
  REJECTED_ALL = 'rejected_all',
  CUSTOM = 'custom',
  PENDING = 'pending'
}

// Interface for cookie preferences
export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

// Default preferences (only necessary cookies enabled)
export const defaultPreferences: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  personalization: false
};

// Get current cookie consent status
export const getConsentStatus = (): ConsentStatus => {
  const status = localStorage.getItem('cookie-consent-status');
  return (status as ConsentStatus) || ConsentStatus.PENDING;
};

// Get current cookie preferences
export const getCookiePreferences = (): CookiePreferences => {
  try {
    const savedPreferences = JSON.parse(localStorage.getItem('cookie-preferences') || '{}');
    return {
      ...defaultPreferences,
      ...savedPreferences
    };
  } catch (error) {
    console.error('Error parsing saved cookie preferences:', error);
    return defaultPreferences;
  }
};

// Check if a specific cookie category is allowed
export const isCookieCategoryAllowed = (category: CookieCategory): boolean => {
  if (category === CookieCategory.NECESSARY) return true; // Necessary cookies are always allowed
  
  const preferences = getCookiePreferences();
  return preferences[category] === true;
};

// Save cookie preferences
export const saveCookiePreferences = (
  preferences: CookiePreferences, 
  status: ConsentStatus
): void => {
  localStorage.setItem('cookie-consent-status', status);
  localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
  
  // Apply the preferences (enable/disable cookies)
  applyPreferences(preferences);
};

// Apply cookie preferences by enabling/disabling specific scripts
const applyPreferences = (preferences: CookiePreferences): void => {
  // Example implementation - in a real app, you would enable/disable specific tracking scripts
  
  // Analytics (e.g., Google Analytics)
  if (preferences.analytics) {
    enableAnalytics();
  } else {
    disableAnalytics();
  }
  
  // Marketing (e.g., ads)
  if (preferences.marketing) {
    enableMarketing();
  } else {
    disableMarketing();
  }
  
  // Personalization
  if (preferences.personalization) {
    enablePersonalization();
  } else {
    disablePersonalization();
  }
};

// Helper functions to enable/disable specific cookie categories
function enableAnalytics() {
  // In a real implementation, you would initialize Google Analytics here
  if (window.gtag) {
    console.log('Analytics enabled');
    // Example: window.gtag('consent', 'update', { analytics_storage: 'granted' });
  }
}

function disableAnalytics() {
  // Disable analytics cookies/scripts
  if (window.gtag) {
    console.log('Analytics disabled');
    // Example: window.gtag('consent', 'update', { analytics_storage: 'denied' });
  }
}

function enableMarketing() {
  // Enable marketing cookies/scripts
  console.log('Marketing cookies enabled');
  // Example: enable ad scripts
}

function disableMarketing() {
  // Disable marketing cookies/scripts
  console.log('Marketing cookies disabled');
  // Example: disable ad scripts
}

function enablePersonalization() {
  // Enable personalization cookies/scripts
  console.log('Personalization cookies enabled');
}

function disablePersonalization() {
  // Disable personalization cookies/scripts
  console.log('Personalization cookies disabled');
}

// Delete all non-necessary cookies
export const deleteNonEssentialCookies = (): void => {
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    // Skip necessary cookies (you would need to define which cookies are necessary)
    if (isNecessaryCookie(name)) continue;
    
    // Delete the cookie by setting an expired date
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

// Helper function to determine if a cookie is necessary
function isNecessaryCookie(name: string): boolean {
  // Define your list of necessary cookies
  const necessaryCookies = [
    'supabase-auth-token',
    'sb-access-token',
    'sb-refresh-token',
    'cookie-consent-status',
    'cookie-preferences'
  ];
  
  return necessaryCookies.includes(name);
}

// Add type definition for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}