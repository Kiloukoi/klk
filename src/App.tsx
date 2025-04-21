import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './AppRoutes';
import Footer from './components/Footer';
import WelcomePopup from './components/WelcomePopup';
import CookieConsent from './components/CookieConsent';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <AppRoutes />
          <div id="footer-container">
            <Footer />
          </div>
          <Toaster position="top-right" />
          <WelcomePopup />
          <CookieConsent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;