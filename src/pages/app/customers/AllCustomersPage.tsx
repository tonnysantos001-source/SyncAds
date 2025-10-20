import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Users } from 'lucide-react';

const AllCustomersPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Todos os Clientes"
      description="Visualize e gerencie todos os clientes cadastrados"
      icon={Users}
    />
  );
};

export default AllCustomersPage;
