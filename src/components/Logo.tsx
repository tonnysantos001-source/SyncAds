import React from 'react';
import { Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';

const Logo = () => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const to = isAuthenticated ? '/dashboard' : '/';

  return (
    <Link to={to} className="flex items-center space-x-2">
      <Bot className="h-8 w-8 text-primary" />
      <span className="text-xl font-bold tracking-tight text-foreground">
        SyncAds
      </span>
    </Link>
  );
};

export default Logo;
