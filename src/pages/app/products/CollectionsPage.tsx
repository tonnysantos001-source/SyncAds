import React from 'react';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { FolderKanban } from 'lucide-react';

const CollectionsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Coleções"
      description="Organize seus produtos em coleções personalizadas"
      icon={FolderKanban}
    />
  );
};

export default CollectionsPage;
