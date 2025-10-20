import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Gift } from 'lucide-react';

const KitsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Kit de Produtos"
      description="Crie e gerencie combos e kits de produtos"
      icon={Gift}
    />
  );
};

export default KitsPage;
