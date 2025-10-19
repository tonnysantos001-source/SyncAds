import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbNameMap: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/campaigns': 'Campanhas',
  '/analytics': 'Analytics',
  '/chat': 'Chat IA',
  '/integrations': 'Integrações',
  '/settings': 'Configurações',
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav aria-label="Breadcrumb" className="mb-4 hidden md:block">
      <ol className="flex items-center space-x-1 text-sm text-muted-foreground">
        <li>
          <Link to="/dashboard" className="hover:text-foreground">
            Início
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const name = breadcrumbNameMap[to] || value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <li key={to} className="flex items-center">
              <ChevronRight className="h-4 w-4" />
              <Link
                to={to}
                className={cn('ml-1', isLast ? 'font-medium text-foreground' : 'hover:text-foreground')}
                aria-current={isLast ? 'page' : undefined}
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
