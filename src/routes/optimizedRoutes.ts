// ============================================
// OPTIMIZED ROUTES WITH CODE SPLITTING
// ============================================
// Rotas com lazy loading e preloading inteligente
// ============================================

import { lazyWithPreload } from '@/components/LazyLoad';

// ===== AUTH PAGES (Critical - Load First) =====
export const LoginPage = lazyWithPreload(() => import('@/pages/auth/LoginPage'));
export const RegisterPage = lazyWithPreload(() => import('@/pages/auth/RegisterPage'));

// ===== DASHBOARD (Critical - Preload after login) =====
export const UnifiedDashboardPage = lazyWithPreload(() => import('@/pages/app/UnifiedDashboardPage'));
export const ChatPage = lazyWithPreload(() => import('@/pages/app/ChatPage'));

// ===== SUPER ADMIN (High Priority) =====
export const SuperAdminDashboard = lazyWithPreload(() => import('@/pages/super-admin/SuperAdminDashboard'));
export const AdminChatPage = lazyWithPreload(() => import('@/pages/super-admin/AdminChatPage'));
export const OrganizationsPage = lazyWithPreload(() => import('@/pages/super-admin/OrganizationsPage'));
export const GatewaysPage = lazyWithPreload(() => import('@/pages/super-admin/GatewaysPage'));

// ===== PRODUCTS (Medium Priority) =====
export const AllProductsPage = lazyWithPreload(() => import('@/pages/app/products/AllProductsPage'));
export const KitsPage = lazyWithPreload(() => import('@/pages/app/products/KitsPage'));
export const CollectionsPage = lazyWithPreload(() => import('@/pages/app/products/CollectionsPage'));

// ===== ORDERS (Medium Priority) =====
export const AllOrdersPage = lazyWithPreload(() => import('@/pages/app/orders/AllOrdersPage'));
export const AbandonedCartsPage = lazyWithPreload(() => import('@/pages/app/orders/AbandonedCartsPage'));
export const PixRecoveredPage = lazyWithPreload(() => import('@/pages/app/orders/PixRecoveredPage'));

// ===== MARKETING (Medium Priority) =====
export const LeadsPage = lazyWithPreload(() => import('@/pages/app/marketing/LeadsPage'));
export const CouponsPage = lazyWithPreload(() => import('@/pages/app/marketing/CouponsPage'));
export const DiscountsPage = lazyWithPreload(() => import('@/pages/app/marketing/DiscountsPage'));

// ===== CHECKOUT (Medium Priority) =====
export const CheckoutCustomizePage = lazyWithPreload(() => import('@/pages/app/checkout/CheckoutCustomizePage'));
export const CheckoutOnboardingPage = lazyWithPreload(() => import('@/pages/app/CheckoutOnboardingPage'));
export const ShippingPage = lazyWithPreload(() => import('@/pages/app/checkout/ShippingPage'));

// ===== REPORTS (Low Priority - Load on demand) =====
export const ReportsOverviewPage = lazyWithPreload(() => import('@/pages/app/reports/ReportsOverviewPage'));
export const AudiencePage = lazyWithPreload(() => import('@/pages/app/reports/AudiencePage'));

// ===== SETTINGS (Low Priority) =====
export const SettingsPage = lazyWithPreload(() => import('@/pages/app/SettingsPage'));
export const IntegrationsPage = lazyWithPreload(() => import('@/pages/app/IntegrationsPage'));

// ===== PUBLIC (Load on demand) =====
export const LandingPage = lazyWithPreload(() => import('@/pages/public/LandingPage'));
export const PublicCheckoutPage = lazyWithPreload(() => import('@/pages/public/PublicCheckoutPage'));
export const CheckoutSuccessPage = lazyWithPreload(() => import('@/pages/public/CheckoutSuccessPage'));

// ===== PRELOAD STRATEGIES =====

// Preload after user logs in
export const CRITICAL_ROUTES_AFTER_LOGIN = [
  { path: '/app/dashboard', component: UnifiedDashboardPage },
  { path: '/app/chat', component: ChatPage },
];

// Preload for super admin
export const SUPER_ADMIN_ROUTES = [
  { path: '/super-admin', component: SuperAdminDashboard },
  { path: '/super-admin/organizations', component: OrganizationsPage },
  { path: '/super-admin/gateways', component: GatewaysPage },
];

// Preload common user actions
export const COMMON_USER_ROUTES = [
  { path: '/app/products', component: AllProductsPage },
  { path: '/app/orders', component: AllOrdersPage },
  { path: '/app/leads', component: LeadsPage },
];

