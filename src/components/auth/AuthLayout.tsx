import React from 'react';
import Logo from '@/components/layout/Logo';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, description }) => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-dark-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Logo className="h-8 w-8 text-brand-primary" />
            <h1 className="text-2xl font-bold tracking-tighter text-gray-900 dark:text-white">SyncAds AI</h1>
          </Link>
        </div>
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
