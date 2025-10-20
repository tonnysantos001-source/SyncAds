import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Gauge } from 'lucide-react';

const PixelsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Pixels"
      description="Gerencie pixels de rastreamento do Facebook, Google e outras plataformas"
      icon={Gauge}
    />
  );
};

export default PixelsPage;
