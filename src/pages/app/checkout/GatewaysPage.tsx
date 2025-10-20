import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { CreditCard } from 'lucide-react';

const GatewaysPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Gateways de Pagamento"
      description="Configure os métodos de pagamento aceitos no checkout"
      icon={CreditCard}
    />
  );
};

export default GatewaysPage;
