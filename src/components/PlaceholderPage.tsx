import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ElementType;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon: Icon = Construction,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {Icon && <Icon className="h-8 w-8 text-blue-500" />}
            {title}
          </h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Em Desenvolvimento */}
      <Alert className="border-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
        <Construction className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-yellow-900 dark:text-yellow-100 font-bold">
          Página em Desenvolvimento
        </AlertTitle>
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          Esta funcionalidade está sendo construída e estará disponível em breve. 
          Estamos trabalhando para trazer a melhor experiência para você!
        </AlertDescription>
      </Alert>

      {/* Content Preview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Em breve</CardTitle>
            <CardDescription>Funcionalidades virão aqui</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Em breve</CardTitle>
            <CardDescription>Funcionalidades virão aqui</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Em breve</CardTitle>
            <CardDescription>Funcionalidades virão aqui</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Aguarde as próximas atualizações</CardTitle>
          <CardDescription>
            Esta página faz parte do novo módulo de checkout e gerenciamento de pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Você terá acesso a:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Interface completa e intuitiva</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Relatórios detalhados</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Automações inteligentes</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Integração com principais plataformas</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
