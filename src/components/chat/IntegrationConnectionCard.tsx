import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface IntegrationConnectionCardProps {
  platform: string;
  platformName: string;
  icon?: string;
  onSkip?: () => void;
  onSuccess?: () => void;
}

export const IntegrationConnectionCard: React.FC<IntegrationConnectionCardProps> = ({
  platform,
  platformName,
  icon,
  onSkip,
  onSuccess
}) => {
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');

  const handleConnect = async () => {
    setConnecting(true);
    setStatus('connecting');

    try {
      // Obter URL de OAuth do backend
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Você precisa estar logado');
      }

      // Chamar Edge Function para iniciar OAuth
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          platform: platform.toUpperCase(),
          redirectUrl: `${window.location.origin}/oauth/callback`
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao iniciar conexão');
      }

      const { authUrl } = await response.json();

      // Abrir popup OAuth
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'oauth-popup',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listener para quando o OAuth completar
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'oauth-success') {
          setStatus('success');
          setConnecting(false);
          popup?.close();
          onSuccess?.();
          window.removeEventListener('message', handleMessage);
        } else if (event.data?.type === 'oauth-error') {
          setStatus('error');
          setConnecting(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout de 5 minutos
      setTimeout(() => {
        if (connecting) {
          setStatus('error');
          setConnecting(false);
          popup?.close();
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Erro ao conectar:', error);
      setStatus('error');
      setConnecting(false);
    }
  };

  const getPlatformIcon = () => {
    const icons: Record<string, string> = {
      'facebook': '📘',
      'meta': '📘',
      'google': '🔍',
      'linkedin': '💼',
      'tiktok': '🎵',
      'twitter': '🐦',
      'canva': '🎨',
      'instagram': '📸'
    };
    return icon || icons[platform.toLowerCase()] || '🔗';
  };

  return (
    <div className="my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Mensagem da IA */}
      <div className="mb-3">
        <p className="text-sm text-gray-700">
          Vou conectar sua conta do <strong>{platformName}</strong> ao SyncAds.
        </p>
      </div>

      {/* Status de Conexão */}
      {connecting && (
        <div className="flex items-center gap-2 mb-3 text-sm text-blue-600">
          <span className="text-2xl">{getPlatformIcon()}</span>
          <span>Connecting {platformName}...</span>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}

      {/* Card de Ação */}
      <Card className="border-2 border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <div className="mb-3">
            <p className="text-sm text-gray-700">
              I'll need to connect your {platformName} account to continue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => onSkip?.()}
              variant="ghost"
              disabled={connecting}
              className="text-gray-600 hover:text-gray-900"
            >
              Skip
            </Button>
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>Connect {platformName}</>
              )}
            </Button>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <a
              href="/privacy"
              target="_blank"
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              How we handle your data
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Mensagens de Status */}
          {status === 'success' && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              ✅ Conectado com sucesso!
            </div>
          )}

          {status === 'error' && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              ❌ Erro ao conectar. Tente novamente.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
