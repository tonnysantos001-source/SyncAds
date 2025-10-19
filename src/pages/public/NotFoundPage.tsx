import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ServerCrash } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <ServerCrash className="h-24 w-24 text-primary mb-4" />
      <h1 className="text-4xl md:text-6xl font-bold mb-2">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4">Página Não Encontrada</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Oops! A página que você está procurando não existe. Pode ter sido movida ou deletada.
      </p>
      <Button asChild>
        <Link to="/dashboard">Voltar para o Dashboard</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;
