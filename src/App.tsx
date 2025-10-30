import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { useAuthStore } from './store/authStore';
import { useCampaignsStore } from './store/campaignsStore';
import { useChatStore } from './store/chatStore';
import { useIntegrationsStore } from './store/integrationsStore';
import { useStore } from './store/useStore';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { initSentry, setUser as setSentryUser, clearUser as clearSentryUser } from './lib/sentry';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const UnifiedDashboardPage = lazy(() => import('./pages/app/UnifiedDashboardPage'));
const CampaignDetailsPage = lazy(() => import('./pages/app/campaigns/CampaignDetailsPage'));
const ChatPage = lazy(() => import('./pages/app/ChatPage'));
const IntegrationsPage = lazy(() => import('./pages/app/IntegrationsPage'));
const SettingsPage = lazy(() => import('./pages/app/SettingsPage'));
const IntegrationCallbackPage = lazy(() => import('./pages/IntegrationCallbackPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Public Checkout pages
const PublicCheckoutPage = lazy(() => import('./pages/public/PublicCheckoutPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/public/CheckoutSuccessPage'));

// Super Admin pages
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/SuperAdminDashboard'));
const AdminChatPage = lazy(() => import('./pages/super-admin/AdminChatPage'));
// OrganizationsPage REMOVIDO - não usamos mais organizações
const ClientsPage = lazy(() => import('./pages/super-admin/ClientsPage'));
const BillingPage = lazy(() => import('./pages/super-admin/BillingPage'));
const UsagePage = lazy(() => import('./pages/super-admin/UsagePage'));
const SuperAdminGatewaysPage = lazy(() => import('./pages/super-admin/GatewaysPage'));
const GlobalAiPage = lazy(() => import('./pages/super-admin/GlobalAiPage'));
const OAuthConfigPage = lazy(() => import('./pages/super-admin/OAuthConfigPage'));

// Reports pages
const ReportsOverviewPage = lazy(() => import('./pages/app/reports/ReportsOverviewPage'));
const AudiencePage = lazy(() => import('./pages/app/reports/AudiencePage'));
const UtmsPage = lazy(() => import('./pages/app/reports/UtmsPage'));
const AdsPage = lazy(() => import('./pages/app/reports/AdsPage'));

// Orders pages
const AllOrdersPage = lazy(() => import('./pages/app/orders/AllOrdersPage'));
const AbandonedCartsPage = lazy(() => import('./pages/app/orders/AbandonedCartsPage'));
const PixRecoveredPage = lazy(() => import('./pages/app/orders/PixRecoveredPage'));

// Products pages
const AllProductsPage = lazy(() => import('./pages/app/products/AllProductsPage'));
const CollectionsPage = lazy(() => import('./pages/app/products/CollectionsPage'));
const KitsPage = lazy(() => import('./pages/app/products/KitsPage'));

// Customers pages
const AllCustomersPage = lazy(() => import('./pages/app/customers/AllCustomersPage'));
const LeadsPage = lazy(() => import('./pages/app/customers/LeadsPage'));

// Marketing pages
const CouponsPage = lazy(() => import('./pages/app/marketing/CouponsPage'));
const OrderBumpPage = lazy(() => import('./pages/app/marketing/OrderBumpPage'));
const UpsellPage = lazy(() => import('./pages/app/marketing/UpsellPage'));
const CrossSellPage = lazy(() => import('./pages/app/marketing/CrossSellPage'));
const DiscountBannerPage = lazy(() => import('./pages/app/marketing/DiscountBannerPage'));
const CashbackPage = lazy(() => import('./pages/app/marketing/CashbackPage'));
const PixelsPage = lazy(() => import('./pages/app/marketing/PixelsPage'));

// Checkout pages
const CheckoutDiscountsPage = lazy(() => import('./pages/app/checkout/DiscountsPage'));
const CheckoutCustomizePage = lazy(() => import('./pages/app/checkout/CheckoutCustomizePage'));
const SocialProofPage = lazy(() => import('./pages/app/checkout/SocialProofPage'));
const CheckoutGatewaysPage = lazy(() => import('./pages/app/checkout/GatewaysPage'));
const RedirectPage = lazy(() => import('./pages/app/checkout/RedirectPage'));
const CheckoutOnboardingPage = lazy(() => import('./pages/app/CheckoutOnboardingPage'));
const DomainValidationPage = lazy(() => import('./pages/app/DomainValidationPage'));
const ShippingPage = lazy(() => import('./pages/app/ShippingPage'));


function App() {
  // Auth state (novo authStore)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initAuth = useAuthStore((state) => state.initAuth);

  // Data loaders (novos stores)
  const loadCampaigns = useCampaignsStore((state) => state.loadCampaigns);
  const loadConversations = useChatStore((state) => state.loadConversations);
  const loadIntegrations = useIntegrationsStore((state) => state.loadIntegrations);
  const loadAiConnections = useStore((state) => state.loadAiConnections);

  // Init Sentry on mount
  useEffect(() => {
    initSentry();
  }, []);

  // Init auth on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Update Sentry user context when user changes
  useEffect(() => {
    if (user) {
      setSentryUser({
        id: user.id,
        email: user.email || undefined,
        name: user.name || undefined,
      });
    } else {
      clearSentryUser();
    }
  }, [user]);

  // Load user data after authentication (só se não for super admin)
  useEffect(() => {
    if (isAuthenticated && user && !user.isSuperAdmin) {
      Promise.all([
        loadCampaigns(user.id),
        loadConversations(user.id),
        loadIntegrations(user.id),
        loadAiConnections(user.id),
      ]);
    }
  }, [isAuthenticated, user, loadCampaigns, loadConversations, loadIntegrations, loadAiConnections]);

  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  // Determine where to redirect authenticated users
  // Super Admin vai direto para /super-admin
  // Usuários normais vão para /onboarding (página inicial de checkout)
  const redirectPath = user?.isSuperAdmin ? '/super-admin' : '/onboarding';

  return (
    <ErrorBoundary>
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
            
            {/* Public Checkout Routes */}
            <Route path="/checkout/:orderId" element={<PublicCheckoutPage />} />
            <Route path="/checkout/success/:transactionId" element={<CheckoutSuccessPage />} />
            
            {/* Super Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/chat" element={<AdminChatPage />} />
              {/* OrganizationsPage REMOVIDO - não usamos mais organizações */}
              <Route path="/super-admin/clients" element={<ClientsPage />} />
              <Route path="/super-admin/billing" element={<BillingPage />} />
              <Route path="/super-admin/usage" element={<UsagePage />} />
              <Route path="/super-admin/gateways" element={<SuperAdminGatewaysPage />} />
              <Route path="/super-admin/ai-connections" element={<GlobalAiPage />} />
              <Route path="/super-admin/oauth-config" element={<OAuthConfigPage />} />
            </Route>

            {/* Protected App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/dashboard" element={<UnifiedDashboardPage />} />
              <Route path="/campaigns/:id" element={<CampaignDetailsPage />} />
              
              {/* Reports */}
              <Route path="/reports/overview" element={<ReportsOverviewPage />} />
              <Route path="/reports/audience" element={<AudiencePage />} />
              <Route path="/reports/utms" element={<UtmsPage />} />
              <Route path="/reports/ads" element={<AdsPage />} />
              
              {/* Orders */}
              <Route path="/orders/all" element={<AllOrdersPage />} />
              <Route path="/orders/abandoned-carts" element={<AbandonedCartsPage />} />
              <Route path="/orders/pix-recovered" element={<PixRecoveredPage />} />
              
              {/* Products */}
              <Route path="/products/all" element={<AllProductsPage />} />
              <Route path="/products/collections" element={<CollectionsPage />} />
              <Route path="/products/kits" element={<KitsPage />} />
              
              {/* Customers */}
              <Route path="/customers/all" element={<AllCustomersPage />} />
              <Route path="/customers/leads" element={<LeadsPage />} />
              
              {/* Marketing */}
              <Route path="/marketing/coupons" element={<CouponsPage />} />
              <Route path="/marketing/order-bump" element={<OrderBumpPage />} />
              <Route path="/marketing/upsell" element={<UpsellPage />} />
              <Route path="/marketing/cross-sell" element={<CrossSellPage />} />
              <Route path="/marketing/discount-banner" element={<DiscountBannerPage />} />
              <Route path="/marketing/cashback" element={<CashbackPage />} />
              <Route path="/marketing/pixels" element={<PixelsPage />} />
              
              {/* Checkout */}
              <Route path="/onboarding" element={<CheckoutOnboardingPage />} />
              <Route path="/checkout/domain" element={<DomainValidationPage />} />
              <Route path="/checkout/shipping" element={<ShippingPage />} />
              <Route path="/checkout/discounts" element={<CheckoutDiscountsPage />} />
              <Route path="/checkout/customize" element={<CheckoutCustomizePage />} />
              <Route path="/checkout/social-proof" element={<SocialProofPage />} />
              <Route path="/checkout/gateways" element={<CheckoutGatewaysPage />} />
              <Route path="/checkout/redirect" element={<RedirectPage />} />
              
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/integrations/callback" element={<IntegrationCallbackPage />} />
              <Route path="/settings/*" element={<SettingsPage />} />
            </Route>

            {/* Not Found Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
