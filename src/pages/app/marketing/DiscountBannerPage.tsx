import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Percent } from 'lucide-react';

const DiscountBannerPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Faixa de Desconto"
      description="Configure banners promocionais no topo da sua loja"
      icon={Percent}
    />
  );
};

export default DiscountBannerPage;
