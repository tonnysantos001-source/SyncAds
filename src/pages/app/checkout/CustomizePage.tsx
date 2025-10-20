import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Palette } from 'lucide-react';

const CustomizePage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Personalizar Checkout"
      description="Personalize cores, logos e layout do seu checkout"
      icon={Palette}
    />
  );
};

export default CustomizePage;
