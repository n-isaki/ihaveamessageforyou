import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Pages
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PrintGift from './pages/PrintGift';
import Simulator from './pages/Simulator';

// Anima Modules
// Anima Modules
import GiftWizard from './modules/anima/experiences/multimedia-gift/pages/Wizard';
import UniversalViewer from './modules/anima/core/UniversalViewer';
import RitualChat from './modules/anima/experiences/engraving-ritual/pages/RitualChat';

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

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />

        {/* The Smart Viewer (QR Target) */}
        <Route path="/v/:id" element={<UniversalViewer />} />

        {/* Experiences */}
        <Route path="/ritual/:id" element={<RitualChat />} />

        {/* Legacy / Alias */}
        <Route path="/gift/:id" element={<UniversalViewer />} />

        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/create" element={
          <ProtectedRoute>
            <GiftWizard />
          </ProtectedRoute>
        } />
        <Route path="/admin/edit/:id" element={
          <ProtectedRoute>
            <GiftWizard />
          </ProtectedRoute>
        } />
        <Route path="/admin/print/:id" element={
          <ProtectedRoute>
            <PrintGift />
          </ProtectedRoute>
        } />
        <Route path="/admin/simulate" element={
          <ProtectedRoute>
            <Simulator />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
