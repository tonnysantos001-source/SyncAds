import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ConnectionStatusProps {
  platform: string;
  isConnected: boolean;
  isConnecting?: boolean;
  lastSyncAt?: string;
  errorMessage?: string;
}

export default function ConnectionStatus({ 
  platform, 
  isConnected, 
  isConnecting = false,
  lastSyncAt,
  errorMessage
}: ConnectionStatusProps) {
  const getPlatformName = () => {
    const names: Record<string, string> = {
      'facebook': 'Facebook Ads',
      'meta': 'Meta Ads',
      'google': 'Google Ads',
      'linkedin': 'LinkedIn Ads',
      'tiktok': 'TikTok Ads',
      'twitter': 'Twitter Ads'
    };
    return names[platform.toLowerCase()] || platform;
  };

  const getPlatformIcon = () => {
    const icons: Record<string, string> = {
      'facebook': '📘',
      'meta': '📘',
      'google': '🔍',
      'linkedin': '💼',
      'tiktok': '🎵',
      'twitter': '🐦'
    };
    return icons[platform.toLowerCase()] || '🔗';
  };

  const getStatusBadge = () => {
    if (isConnecting) {
      return (
        <Badge variant="secondary" className="gap-2 bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3" />
          Conectando...
        </Badge>
      );
    }
    
    if (isConnected) {
      return (
        <Badge variant="secondary" className="gap-2 bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3" />
          Conectado
        </Badge>
      );
    }
    
    if (errorMessage) {
      return (
        <Badge variant="secondary" className="gap-2 bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3" />
          Erro
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="gap-2 bg-gray-50 text-gray-700 border-gray-200">
        <XCircle className="h-3 w-3" />
        Não conectado
      </Badge>
    );
  };

  return (
    <Card className="p-3 bg-white border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getPlatformIcon()}</div>
          <div>
            <p className="text-sm font-medium text-gray-900">{getPlatformName()}</p>
            {lastSyncAt && isConnected && (
              <p className="text-xs text-gray-500">
                Última sincronização: {new Date(lastSyncAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>
      
      {errorMessage && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {errorMessage}
        </div>
      )}
    </Card>
  );
}


