import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoaderCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { session, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-light-bg dark:bg-dark-bg">
        <LoaderCircle className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin') {
    toast.error('Acesso Negado', {
        description: 'Você não tem permissão para aceder a esta página.',
        icon: <ShieldAlert className="h-5 w-5 text-red-500" />,
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
