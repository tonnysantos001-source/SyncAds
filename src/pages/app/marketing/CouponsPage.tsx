import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Tag } from 'lucide-react';

const CouponsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Cupons"
      description="Crie e gerencie cupons de desconto para seus clientes"
      icon={Tag}
    />
  );
};

export default CouponsPage;
