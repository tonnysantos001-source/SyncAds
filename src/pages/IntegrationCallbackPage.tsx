import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { integrationsService } from '@/lib/integrations/integrationsService';
import { INTEGRATIONS_CONFIG } from '@/lib/integrations/types';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function IntegrationCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your connection...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Verificar se houve erro
        if (error) {
          throw new Error(error);
        }

        // Validar parâmetros
        if (!code || !state) {
          throw new Error('Missing code or state parameter');
        }

        // Processar callback OAuth
        const result = await integrationsService.handleOAuthCallback(code, state);
        
        const config = INTEGRATIONS_CONFIG[result.slug];
        setStatus('success');
        setMessage(`${config.name} connected successfully!`);
        
        // Salvar flag de sucesso para o popup detectar
        const stateData = JSON.parse(atob(state));
        localStorage.setItem(`oauth_success_${stateData.platform}_${stateData.userId}`, 'true');

        // Fechar popup ou redirecionar
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/chat');
          }
        }, 2000);

      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect integration');

        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/chat');
          }
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Processing...</h1>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-green-600">Success!</h1>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Closing this window...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-red-600">Error</h1>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}
