import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const noPaddingRoutes = ['/ai/chat', '/ai/creation'];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebarCollapsed', false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const isChatPage = location.pathname === '/ai/chat';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100 dark:bg-dark-bg">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {!isChatPage && <Header />}
        <main className={`flex-1 flex flex-col overflow-y-auto ${isChatPage ? '' : 'bg-gray-100 dark:bg-dark-bg'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
