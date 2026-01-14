import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PrintGift from './pages/PrintGift';


// Anima Modules
// Anima Modules
import GiftWizard from './modules/anima/experiences/multimedia-gift/pages/Wizard';
import UniversalViewer from './modules/anima/core/UniversalViewer';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) return <Navigate to="/admin/login" />;

  return children;
};

// Admin Domain Guard
const AdminDomainGuard = ({ children }) => {
  // Only allow if hostname starts with 'admin.' or is localhost (for dev)
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isAdminDomain = window.location.hostname.startsWith('admin.');

  if (!isDev && !isAdminDomain) {
    // Redirect to main domain root if trying to access admin on wrong domain
    window.location.href = 'https://kamlimos.com';
    return null;
  }
  return children;
};

// Domain Routing Logic
const DomainAwareHome = () => {
  const host = window.location.hostname;

  // If user visits admin.kamlimos.com (root path), go to dashboard
  if (host.startsWith('admin.')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If user visits /admin/* on non-admin domain, redirect to home (or could redirect to admin subdomain)
  // This logic is better handled in the route guard, but if we are at root and NOT admin subdomain, we show LandingPage.
  // The actual protection for /admin routes needs to be in the Route definition.

  // Otherwise show standard Landing Page
  return <LandingPage />;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public Routes with Domain Logic */}
          <Route path="/" element={<DomainAwareHome />} />

          {/* The Smart Viewer (QR Target) */}
          <Route path="/v/:id" element={<UniversalViewer />} />

          {/* Experiences */}


          {/* Legacy / Alias */}
          <Route path="/gift/:id" element={<UniversalViewer />} />

          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <AdminDomainGuard>
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            </AdminDomainGuard>
          } />
          <Route path="/admin/create" element={
            <AdminDomainGuard>
              <ProtectedRoute>
                <GiftWizard />
              </ProtectedRoute>
            </AdminDomainGuard>
          } />
          <Route path="/admin/edit/:id" element={
            <AdminDomainGuard>
              <ProtectedRoute>
                <GiftWizard />
              </ProtectedRoute>
            </AdminDomainGuard>
          } />
          <Route path="/admin/print/:id" element={
            <ProtectedRoute>
              <PrintGift />
            </ProtectedRoute>
          } />

        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
