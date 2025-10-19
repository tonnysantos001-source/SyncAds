import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { ProfileTab } from './settings/ProfileTab';
import { SecurityTab } from './settings/SecurityTab';
import { NotificationsTab } from './settings/NotificationsTab';
import { BillingTab } from './settings/BillingTab';
import { ApiKeysTab } from './settings/ApiKeysTab';
import { AiTab } from './settings/AiTab';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { User, ShieldCheck, Bell, CreditCard, KeyRound, Bot } from 'lucide-react';

const settingsNav = [
  { path: '', label: 'Perfil', icon: User },
  { path: 'security', label: 'Segurança', icon: ShieldCheck },
  { path: 'notifications', label: 'Notificações', icon: Bell },
  { path: 'billing', label: 'Faturamento', icon: CreditCard },
  { path: 'api-keys', label: 'Chaves de API', icon: KeyRound },
  { path: 'ai', label: 'Personalidade IA', icon: Bot },
];

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua conta e preferências.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <nav className="flex flex-col w-full md:w-1/5 shrink-0 gap-1">
          {settingsNav.map(item => {
            const targetPath = item.path ? `/settings/${item.path}` : '/settings';
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={targetPath}
                end={item.path === ''}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: 'ghost', size: 'default' }),
                    'w-full justify-start text-base md:text-sm h-12',
                    isActive 
                      ? 'bg-muted hover:bg-muted font-semibold text-primary' 
                      : 'hover:bg-muted/50 text-muted-foreground'
                  )
                }
              >
                <Icon className="mr-3 h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="flex-1">
          <Routes>
            <Route index element={<ProfileTab />} />
            <Route path="security" element={<SecurityTab />} />
            <Route path="notifications" element={<NotificationsTab />} />
            <Route path="billing" element={<BillingTab />} />
            <Route path="api-keys" element={<ApiKeysTab />} />
            <Route path="ai" element={<AiTab />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
