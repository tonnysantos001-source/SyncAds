import {
    LayoutDashboard,
    Settings,
    MessageSquare,
    Wand2,
    Cpu,
    Users,
} from 'lucide-react';
import { Icon } from 'lucide-react';
import Logo from '@/components/layout/Logo';

export interface MenuItem {
    id: string;
    label: string;
    icon: Icon;
    path?: string;
    subItems?: Omit<MenuItem, 'subItems' | 'icon'>[];
}

export const MENU_ITEMS: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'talk-to-ai', label: 'Falar com IA', icon: MessageSquare, path: '/ai/chat' },
    { id: 'create-with-ai', label: 'Criar com IA', icon: Wand2, path: '/ai/creation' },
    { id: 'mother-ai', label: 'IA Mãe', icon: Cpu, path: '/mother-ai' },
    { id: 'users', label: 'Usuários', icon: Users, path: '/users' },
];

export const BOTTOM_MENU_ITEMS: MenuItem[] = [
    { 
        id: 'settings', 
        label: 'Configurações', 
        icon: Settings,
        subItems: [
            { id: 'profile', label: 'Perfil', path: '/settings/profile' },
            { id: 'billing', label: 'Faturamento', path: '/settings/billing' },
        ]
    },
];

export const LOGO_ICON = Logo;
