import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/store/useStore';

const PublicRoute: React.FC = () => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
