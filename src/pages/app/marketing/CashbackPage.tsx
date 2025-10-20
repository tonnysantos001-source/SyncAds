import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Wallet } from 'lucide-react';

const CashbackPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Cashback"
      description="Configure programa de cashback para fidelizar clientes"
      icon={Wallet}
    />
  );
};

export default CashbackPage;
