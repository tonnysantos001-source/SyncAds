import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';

const Logo = () => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const to = isAuthenticated ? '/dashboard' : '/';

  return (
    <Link to={to} className="flex items-center gap-3 group">
      {/* Logo Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
        <div className="relative h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-black text-xl">S</span>
          {/* Sparkle */}
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-400 rounded-full animate-pulse" />
        </div>
      </div>
      
      {/* Logo Text */}
      <div className="flex flex-col">
        <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          SyncAds
        </span>
        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 -mt-1 tracking-wider">
          MARKETING AI
        </span>
      </div>
    </Link>
  );
};

export default Logo;
