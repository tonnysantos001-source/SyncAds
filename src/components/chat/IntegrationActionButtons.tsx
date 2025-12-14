/**
 * Componente de botões de ação para integrações
 * Similar ao Claude.ai - mostra botões "Skip" e "Connect [Platform]"
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generateOAuthUrl } from '@/lib/integrations/oauthConfig';
import { INTEGRATIONS_CONFIG } from '@/lib/integrations/types';
import type { IntegrationSlug } from '@/lib/integrations/types';
import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';

interface IntegrationActionButtonsProps {
  platform: IntegrationSlug;
  userId: string;
  onSkip?: () => void;
  onConnecting?: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function IntegrationActionButtons({
  platform,
  userId,
  onSkip,
  onConnecting,
  onSuccess,
  onError
}: IntegrationActionButtonsProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const config = INTEGRATIONS_CONFIG[platform];

  const handleSkip = () => {
    onSkip?.();
  };

  const handleConnect = () => {
    try {
      setIsConnecting(true);
      onConnecting?.();

      // Gerar URL OAuth
      const authUrl = generateOAuthUrl(platform, userId);

      // Abrir popup ou nova aba
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      // Verificar se popup foi bloqueado
      if (!popup || popup.closed) {
        // Fallback: abrir em nova aba
        window.open(authUrl, '_blank');
      }

      // Listener para detectar quando o OAuth foi completado
      const checkOAuthComplete = setInterval(() => {
        try {
          if (popup && popup.closed) {
            clearInterval(checkOAuthComplete);
            setIsConnecting(false);
            
            // Verificar se foi bem-sucedido (você pode implementar lógica adicional)
            const wasSuccessful = localStorage.getItem(`oauth_success_${platform}_${userId}`);
            
            if (wasSuccessful) {
              localStorage.removeItem(`oauth_success_${platform}_${userId}`);
              onSuccess?.();
            }
          }
        } catch (e) {
          // Ignorar erros de cross-origin
        }
      }, 500);

      // Timeout de 10 minutos
      setTimeout(() => {
        clearInterval(checkOAuthComplete);
        setIsConnecting(false);
      }, 10 * 60 * 1000);

    } catch (error: any) {
      console.error('Erro ao conectar:', error);
      setIsConnecting(false);
      onError?.(error.message || 'Erro ao conectar integração');
    }
  };

  return (
    <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
      <div className="flex flex-col gap-3">
        {/* Mensagem */}
        <div className="flex items-start gap-3">
          <div className="text-2xl">{config.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              I'll need to connect your {config.name} account to continue.
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              This will allow me to manage your ad campaigns and get insights.
            </p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={isConnecting}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <X className="h-4 w-4 mr-1" />
            Skip
          </Button>
          
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-1" />
                Connect {config.name}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

