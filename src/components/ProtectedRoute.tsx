import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import DashboardLayout from './layout/DashboardLayout';

const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super Admin routes don't use DashboardLayout (they have their own layout)
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin');

  if (isSuperAdminRoute) {
    return <Outlet />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;
