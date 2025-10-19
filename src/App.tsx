import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { useStore } from './store/useStore';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/app/DashboardPage'));
const CampaignsPage = lazy(() => import('./pages/app/CampaignsPage'));
const CampaignDetailsPage = lazy(() => import('./pages/app/campaigns/CampaignDetailsPage'));
const AnalyticsPage = lazy(() => import('./pages/app/AnalyticsPage'));
const ChatPage = lazy(() => import('./pages/app/ChatPage'));
const IntegrationsPage = lazy(() => import('./pages/app/IntegrationsPage'));
const SettingsPage = lazy(() => import('./pages/app/SettingsPage'));
const IntegrationCallbackPage = lazy(() => import('./pages/IntegrationCallbackPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Super Admin pages
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/SuperAdminDashboard'));
const OrganizationsPage = lazy(() => import('./pages/super-admin/OrganizationsPage'));
const GlobalAiPage = lazy(() => import('./pages/super-admin/GlobalAiPage'));
const SubscriptionsPage = lazy(() => import('./pages/super-admin/SubscriptionsPage'));

// Team page
const TeamPage = lazy(() => import('./pages/app/TeamPage'));

function App() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const user = useStore((state) => state.user);
  const isInitialized = useStore((state) => state.isInitialized);
  const initAuth = useStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  // Determine where to redirect authenticated users
  const redirectPath = user?.isSuperAdmin ? '/super-admin' : '/dashboard';

  return (
    <>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={isAuthenticated ? <Navigate to={redirectPath} /> : <Navigate to="/landing" />} />
            <Route path="/landing" element={<LandingPage />} />

            {/* Auth Routes (only for non-authenticated users) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            
            {/* Super Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/organizations" element={<OrganizationsPage />} />
              <Route path="/super-admin/ai-connections" element={<GlobalAiPage />} />
              <Route path="/super-admin/subscriptions" element={<SubscriptionsPage />} />
            </Route>

            {/* Protected App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/:id" element={<CampaignDetailsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/integrations/callback" element={<IntegrationCallbackPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/settings/*" element={<SettingsPage />} />
            </Route>

            {/* Not Found Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster />
    </>
  );
}

export default App;
