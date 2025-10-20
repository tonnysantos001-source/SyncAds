import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { DollarSign } from 'lucide-react';

const PixRecoveredPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Pix Recuperados"
      description="Acompanhe pagamentos PIX recuperados e aprovados"
      icon={DollarSign}
    />
  );
};

export default PixRecoveredPage;
