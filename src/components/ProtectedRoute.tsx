import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import DashboardLayout from './layout/DashboardLayout';

const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;
