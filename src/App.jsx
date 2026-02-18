import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastContainer } from "./components/Toast";
import { Loader } from "lucide-react";

// Pages - Lazy Loaded
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CustomerSetup = lazy(() => import("./pages/CustomerSetup.redesign"));
const PrintGift = lazy(() => import("./pages/PrintGift"));
const ShopifyThemeExplorer = lazy(() => import("./pages/ShopifyThemeExplorer"));
const ContributionPage = lazy(() => import("./pages/ContributionPage"));

// Anima Modules - Lazy Loaded
const GiftWizard = lazy(() =>
  import("./modules/anima/experiences/multimedia-gift/pages/Wizard")
);
const UniversalViewer = lazy(() =>
  import("./modules/anima/core/UniversalViewer")
);

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-stone-950 flex items-center justify-center">
    <Loader className="animate-spin text-rose-500 h-8 w-8" />
  </div>
);

// Admin Domain Guard – wie auf main: localhost, admin.*, staging; keine harte Umleitung auf /admin/login
const AdminDomainGuard = ({ children }) => {
  const host = window.location.hostname;
  const isDev = host === "localhost" || host === "127.0.0.1";
  const isAdminDomain = host.startsWith("admin.");
  const isStaging = host.includes("staging");
  const isMain = host === "kamlimos.com" || host === "www.kamlimos.com";

  if (isDev || isAdminDomain || isStaging || isMain) {
    return children;
  }
  // Unbekannte Subdomains (z. B. memoria., noor.) → zur Hauptseite, nicht zu /admin/login
  return <Navigate to="/" replace />;
};

// Domain Routing Logic
const DomainAwareHome = () => {
  const host = window.location.hostname;
  
  // If user visits admin.kamlimos.com (root path), go to dashboard
  if (host.startsWith("admin.")) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // Allow Staging/Localhost to show Landing Page directly
  const isStagingOrDev =
    host.includes("staging") ||
    host.includes("localhost") ||
    host.includes("127.0.0.1");
  if (isStagingOrDev) {
    return <LandingPage />;
  }
  
  // If it's a product subdomain (memoria, noor, ritual, scan) but NOT main domain
  // We redirect to the main marketing site (in effect to satisfy React Compiler).
  const isMain = host === "kamlimos.com" || host === "www.kamlimos.com";
  
  if (!isMain) {
    return <Navigate to="/admin/login" />;
  }
  
  return <LandingPage />;
};

// Auth-geschützte Route: nur für eingeloggte Admins
function ProtectedRoute({ children, user, loading }) {
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<DomainAwareHome />} />
            <Route path="/wizard/:giftId" element={<GiftWizard />} />
            <Route path="/view/:giftId" element={<UniversalViewer />} />
            <Route path="/contribute/:giftId" element={<ContributionPage />} />
            <Route path="/contribute/:giftId/:token" element={<ContributionPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminDomainGuard>
                  <ProtectedRoute user={user} loading={loading}>
                    <AdminDashboard />
                  </ProtectedRoute>
                </AdminDomainGuard>
              }
            />
            <Route
              path="/admin/create"
              element={
                <AdminDomainGuard>
                  <ProtectedRoute user={user} loading={loading}>
                    <GiftWizard />
                  </ProtectedRoute>
                </AdminDomainGuard>
              }
            />
            <Route
              path="/admin/edit/:id"
              element={
                <AdminDomainGuard>
                  <ProtectedRoute user={user} loading={loading}>
                    <GiftWizard />
                  </ProtectedRoute>
                </AdminDomainGuard>
              }
            />
            <Route
              path="/admin/print/:id"
              element={
                <AdminDomainGuard>
                  <ProtectedRoute user={user} loading={loading}>
                    <PrintGift />
                  </ProtectedRoute>
                </AdminDomainGuard>
              }
            />
            <Route
              path="/admin/shopify"
              element={
                <AdminDomainGuard>
                  <ProtectedRoute user={user} loading={loading}>
                    <ShopifyThemeExplorer />
                  </ProtectedRoute>
                </AdminDomainGuard>
              }
            />
            
            {/* Catch-all for customer setup */}
            <Route path="/setup/:giftId" element={<CustomerSetup />} />
            <Route path="/setup/:giftId/:token" element={<CustomerSetup />} />
            
            {/* Fallback for admin routes */}
            <Route
              path="/admin/*"
              element={
                <AdminDomainGuard>
                  <Navigate to="/admin/login" />
                </AdminDomainGuard>
              }
            />
          </Routes>
        </Suspense>
        <ToastContainer />
      </Router>
    </ErrorBoundary>
  );
}

// Auth Hook
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
