import { Megaphone, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export type Notification = {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  time: string;
  read: boolean;
};

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    icon: CheckCircle,
    title: 'Campanha Concluída',
    description: 'Sua campanha "Promoção Black Friday" foi concluída com sucesso.',
    time: '15 min atrás',
    read: false,
  },
  {
    id: 'notif-2',
    icon: AlertTriangle,
    title: 'Orçamento Baixo',
    description: 'O orçamento da campanha "Lançamento Verão 2025" está quase no fim.',
    time: '1 hora atrás',
    read: false,
  },
  {
    id: 'notif-3',
    icon: Megaphone,
    title: 'Nova Sugestão da IA',
    description: 'Temos uma nova sugestão para otimizar sua campanha de "Geração de Leads B2B".',
    time: '3 horas atrás',
    read: true,
  },
    {
    id: 'notif-4',
    icon: CheckCircle,
    title: 'Integração Conectada',
    description: 'Sua conta do Google Analytics foi conectada com sucesso.',
    time: 'Ontem',
    read: true,
  },
  {
    id: 'notif-5',
    icon: Info,
    title: 'Atualização da Plataforma',
    description: 'Novos recursos de análise de ROI foram adicionados à página de Analytics.',
    time: '2 dias atrás',
    read: true,
  },
];
