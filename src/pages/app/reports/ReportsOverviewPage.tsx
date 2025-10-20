import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { BarChart3 } from 'lucide-react';

const ReportsOverviewPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Visão Geral - Relatórios"
      description="Visualize métricas e KPIs principais do seu negócio"
      icon={BarChart3}
    />
  );
};

export default ReportsOverviewPage;
