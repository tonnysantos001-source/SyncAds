import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Target } from 'lucide-react';

const AudiencePage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Público Alvo"
      description="Análise detalhada do seu público e comportamento"
      icon={Target}
    />
  );
};

export default AudiencePage;
