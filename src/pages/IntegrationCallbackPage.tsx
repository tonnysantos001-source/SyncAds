import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { integrationsService } from '@/lib/integrations/integrationsService';
import { INTEGRATIONS_CONFIG } from '@/lib/integrations/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IntegrationCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autorização...');
  const [integrationName, setIntegrationName] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Verificar se houve erro na autorização
      if (error) {
        setStatus('error');
        setMessage(`Autorização cancelada: ${error}`);
        return;
      }

      // Validar parâmetros
      if (!code || !state) {
        setStatus('error');
        setMessage('Parâmetros de autorização inválidos');
        return;
      }

      // Processar callback
      const result = await integrationsService.handleOAuthCallback(code, state);
      
      const config = INTEGRATIONS_CONFIG[result.slug];
      setIntegrationName(config.name);
      setStatus('success');
      setMessage(`${config.name} conectado com sucesso!`);

      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/chat');
      }, 3000);

    } catch (error: any) {
      console.error('Erro no callback OAuth:', error);
      setStatus('error');
      setMessage(error.message || 'Erro ao processar autorização');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Conectando Integração'}
            {status === 'success' && '✅ Sucesso!'}
            {status === 'error' && '❌ Erro'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-12 w-12 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="h-12 w-12 text-destructive" />
          )}
          
          <p className="text-center text-muted-foreground">
            {message}
          </p>

          {status === 'success' && (
            <p className="text-sm text-center text-muted-foreground">
              Redirecionando para o chat...
            </p>
          )}

          {status === 'error' && (
            <Button onClick={() => navigate('/chat')}>
              Voltar para o Chat
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationCallbackPage;
