import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import DashboardLayout from "./layout/DashboardLayout";

const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login-v2" replace />;
  }

  // Super Admin routes don't use DashboardLayout (they have their own layout)
  const isSuperAdminRoute = location.pathname.startsWith("/super-admin");

  // Checkout Customize page doesn't use DashboardLayout (has its own full-page editor)
  const isCheckoutCustomizePage = location.pathname === "/checkout/customize";

  if (isSuperAdminRoute || isCheckoutCustomizePage) {
    return <Outlet />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;

