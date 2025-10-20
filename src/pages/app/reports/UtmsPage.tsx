import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Link2 } from 'lucide-react';

const UtmsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="UTMs"
      description="Gerencie e acompanhe seus parâmetros UTM para rastreamento de campanhas"
      icon={Link2}
    />
  );
};

export default UtmsPage;
