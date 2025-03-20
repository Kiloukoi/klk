import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './AppRoutes';
import Footer from './components/Footer';
import WelcomePopup from './components/WelcomePopup';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <AppRoutes />
          <Footer />
          <Toaster position="top-right" />
          <WelcomePopup />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;