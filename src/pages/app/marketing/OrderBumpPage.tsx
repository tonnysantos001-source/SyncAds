import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { TrendingUp } from 'lucide-react';

const OrderBumpPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Order Bump"
      description="Adicione ofertas complementares no checkout para aumentar o ticket médio"
      icon={TrendingUp}
    />
  );
};

export default OrderBumpPage;
