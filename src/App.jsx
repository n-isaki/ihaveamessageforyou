import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CustomerSetup from './pages/CustomerSetup';
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
  const isStaging = window.location.hostname.includes('staging');

  if (!isDev && !isAdminDomain && !isStaging) {
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

  // Allow Staging/Localhost to show Landing Page directly
  const isStagingOrDev = host.includes('staging') || host.includes('localhost') || host.includes('127.0.0.1');
  if (isStagingOrDev) {
    return <LandingPage />;
  }

  // If it's a product subdomain (memoria, noor, ritual, scan) but NOT the main domain
  // We redirect to the main marketing site
  // We assume main domain is kamlimos.com or www.kamlimos.com
  // If host is NOT main, redirect.
  const isMain = host === 'kamlimos.com' || host === 'www.kamlimos.com';

  if (!isMain) {
    window.location.href = 'https://kamlimos.com';
    return null;
  }

  // Otherwise show standard Landing Page on main domain
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

          {/* Customer Setup (Etsy Flow) */}
          <Route path="/setup/:id" element={<CustomerSetup />} />

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
