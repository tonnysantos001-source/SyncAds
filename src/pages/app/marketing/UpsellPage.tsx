import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { ArrowRightLeft } from 'lucide-react';

const UpsellPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Upsell"
      description="Configure ofertas de upgrade após a compra"
      icon={ArrowRightLeft}
    />
  );
};

export default UpsellPage;
