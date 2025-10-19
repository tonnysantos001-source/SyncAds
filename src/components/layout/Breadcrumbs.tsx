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
  '/settings/profile': 'Perfil',
  '/settings/security': 'Segurança',
  '/settings/notifications': 'Notificações',
  '/settings/billing': 'Faturamento',
  '/settings/api-keys': 'Chaves de API',
  '/settings/ai': 'Personalidade IA',
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || pathnames[0] === 'login' || pathnames[0] === 'register' || pathnames[0] === 'forgot-password' || pathnames[0] === 'landing') {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 hidden sm:flex">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
            Início
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const name = breadcrumbNameMap[to] || value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <li key={to} className="flex items-center space-x-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Link
                to={to}
                className={cn(
                  isLast ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                )}
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
