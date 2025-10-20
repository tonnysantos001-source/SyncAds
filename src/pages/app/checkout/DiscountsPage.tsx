import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Tag } from 'lucide-react';

const DiscountsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Descontos - Checkout"
      description="Configure regras de desconto automático no checkout"
      icon={Tag}
    />
  );
};

export default DiscountsPage;
