import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import UpdatePassword from './pages/UpdatePassword';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import ListingDetails from './pages/ListingDetails';
import Messages from './pages/Messages';
import BookingsReceived from './pages/BookingsReceived';
import BookingsSent from './pages/BookingsSent';
import MyListings from './pages/MyListings';
import UserListings from './pages/UserListings';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Favorites from './pages/Favorites';
import Kilouwers from './pages/Kilouwers';
import About from './pages/legal/About';
import Contact from './pages/legal/Contact';
import FAQ from './pages/legal/FAQ';
import Blog from './pages/legal/Blog';
import CGU from './pages/legal/CGU';
import CGV from './pages/legal/CGV';
import Privacy from './pages/legal/Privacy';
import Cookies from './pages/legal/Cookies';
import Legal from './pages/legal/Legal';
import MyReviews from './pages/MyReviews';
import CreateReview from './pages/CreateReview';
import EditReview from './pages/EditReview';
import UserReviews from './pages/UserReviews';
import PromoteListing from './pages/PromoteListing';
import PaymentCallback from './pages/PaymentCallback';

function AppRoutes() {
  const location = useLocation();
  
  // Hide footer on profile page
  useEffect(() => {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
      if (location.pathname === '/profile') {
        footerContainer.style.display = 'none';
      } else {
        footerContainer.style.display = 'block';
      }
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/edit-listing/:id" element={<EditListing />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/bookings/received" element={<BookingsReceived />} />
          <Route path="/bookings/sent" element={<BookingsSent />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/user/:userId/listings" element={<UserListings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user-profile/:userId" element={<UserProfile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/kilouwers" element={<Kilouwers />} />
          <Route path="/promote-listing/:id" element={<PromoteListing />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />
          
          {/* Évaluations */}
          <Route path="/my-reviews" element={<MyReviews />} />
          <Route path="/review/create/:bookingId" element={<CreateReview />} />
          <Route path="/review/edit/:reviewId" element={<EditReview />} />
          <Route path="/user/:userId/reviews" element={<UserReviews />} />
          
          {/* Pages légales */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:postId" element={<Blog />} />
          <Route path="/cgu" element={<CGU />} />
          <Route path="/cgv" element={<CGV />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/legal" element={<Legal />} />
        </Routes>
      </main>
    </div>
  );
}

export default AppRoutes;