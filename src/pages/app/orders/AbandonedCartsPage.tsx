import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { ShoppingBag } from 'lucide-react';

const AbandonedCartsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Carrinhos Abandonados"
      description="Recupere vendas de carrinhos abandonados pelos clientes"
      icon={ShoppingBag}
    />
  );
};

export default AbandonedCartsPage;
