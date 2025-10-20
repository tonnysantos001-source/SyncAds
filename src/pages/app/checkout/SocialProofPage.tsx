import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { Star } from 'lucide-react';

const SocialProofPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Provas Sociais"
      description="Configure notificações de compras recentes e avaliações"
      icon={Star}
    />
  );
};

export default SocialProofPage;
