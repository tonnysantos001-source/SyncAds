import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { ArrowRightLeft } from 'lucide-react';

const RedirectPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Redirecionamento"
      description="Configure redirecionamentos após a compra e páginas de agradecimento"
      icon={ArrowRightLeft}
    />
  );
};

export default RedirectPage;
