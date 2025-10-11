import React from 'react';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  return (
    <header className="flex-shrink-0 h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card">
      <div>
        {/* Placeholder for breadcrumbs or page title */}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {/* Other header items can go here */}
      </div>
    </header>
  );
};

export default Header;
