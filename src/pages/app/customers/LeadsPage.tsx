import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { UserCircle } from 'lucide-react';

const LeadsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Leads"
      description="Gerencie seus leads e potenciais clientes"
      icon={UserCircle}
    />
  );
};

export default LeadsPage;
