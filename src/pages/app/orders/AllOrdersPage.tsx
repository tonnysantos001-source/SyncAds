import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { ShoppingCart } from 'lucide-react';

const AllOrdersPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Todos os Pedidos"
      description="Visualize e gerencie todos os pedidos da sua loja"
      icon={ShoppingCart}
    />
  );
};

export default AllOrdersPage;
