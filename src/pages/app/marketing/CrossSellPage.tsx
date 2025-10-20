import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Repeat } from 'lucide-react';

const CrossSellPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Cross-Sell"
      description="Sugira produtos relacionados para aumentar suas vendas"
      icon={Repeat}
    />
  );
};

export default CrossSellPage;
