import React, { useEffect, useState, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastContainer } from "./components/Toast";
import { Loader } from "lucide-react";

// Pages - Lazy Loaded
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CustomerSetup = lazy(() => import("./pages/CustomerSetup"));
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

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-stone-50">
    <Loader className="h-8 w-8 animate-spin text-stone-400" />
  </div>
);

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

  if (loading) return <PageLoader />;

  if (!user) return <Navigate to="/admin/login" />;

  return children;
};

// Admin Domain Guard
const AdminDomainGuard = ({ children }) => {
  // Only allow if hostname starts with 'admin.' or is localhost (for dev)
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const isAdminDomain = window.location.hostname.startsWith("admin.");
  const isStaging = window.location.hostname.includes("staging");

  if (!isDev && !isAdminDomain && !isStaging) {
    return <RedirectToMain />;
  }
  return children;
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

  // If it's a product subdomain (memoria, noor, ritual, scan) but NOT the main domain
  // We redirect to the main marketing site (in effect to satisfy React Compiler).
  const isMain = host === "kamlimos.com" || host === "www.kamlimos.com";

  if (!isMain) {
    return <RedirectToMain />;
  }

  return <LandingPage />;
};

const RedirectToMain = () => {
  useEffect(() => {
    window.location.href = "https://kamlimos.com";
  }, []);
  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes with Domain Logic */}
            <Route path="/" element={<DomainAwareHome />} />

            {/* The Smart Viewer (QR Target) */}
            <Route path="/v/:id" element={<UniversalViewer />} />

            {/* Legacy / Alias */}
            <Route path="/gift/:id" element={<UniversalViewer />} />

            {/* Customer Setup (Etsy Flow) */}
            <Route path="/setup/:id" element={<CustomerSetup />} />

            {/* Social Gifting (Join Flow) */}
            <Route path="/join/:token" element={<ContributionPage />} />

            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminDomainGuard>
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                </AdminDomainGuard>
              }
            />
            <Route
              path="/admin/create"
              element={
                <AdminDomainGuard>
                  <ProtectedRoute>
                    <GiftWizard />
                  </ProtectedRoute>
                </AdminDomainGuard>
              }
            />
            <Route
              path="/admin/edit/:id"
              element={
                <AdminDomainGuard>
                  <ProtectedRoute>
                    <GiftWizard />
                  </ProtectedRoute>
                </AdminDomainGuard>
              }
            />
            <Route
              path="/admin/print/:id"
              element={
                <ProtectedRoute>
                  <PrintGift />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/shopify"
              element={
                <AdminDomainGuard>
                  <ProtectedRoute>
                    <ShopifyThemeExplorer />
                  </ProtectedRoute>
                </AdminDomainGuard>
              }
            />
          </Routes>
        </Suspense>
      </Router>
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
