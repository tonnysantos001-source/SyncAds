import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-background">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-3xl font-semibold text-foreground">Página Não Encontrada</h2>
      <p className="mt-2 text-muted-foreground">
        Desculpe, a página que você está procurando não existe.
      </p>
      <Button asChild className="mt-8">
        <Link to="/dashboard">Voltar para o Dashboard</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;
