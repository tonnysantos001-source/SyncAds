import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Package } from 'lucide-react';

const AllProductsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Todos os Produtos"
      description="Gerencie o catálogo completo de produtos da sua loja"
      icon={Package}
    />
  );
};

export default AllProductsPage;
