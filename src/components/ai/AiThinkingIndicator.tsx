import { Sparkles, Globe, Download, Code2, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SonicIcon from './SonicIcon';

interface AiThinkingIndicatorProps {
  isThinking: boolean;
  currentTool?: 'web_search' | 'web_scraping' | 'python_exec' | null;
  reasoning?: string;
  sources?: string[];
  status?: 'thinking' | 'success' | 'error';
  connectionStatus?: {
    platform: string;
    isConnected: boolean;
  };
}

export default function AiThinkingIndicator({ 
  isThinking, 
  currentTool, 
  reasoning,
  sources,
  status = 'thinking',
  connectionStatus
}: AiThinkingIndicatorProps) {
  if (!isThinking) return null;

  // Determinar emoção do Sonic baseado no status
  const getEmotion = () => {
    switch (status) {
      case 'success':
        return 'happy';
      case 'error':
        return 'angry';
      default:
        return 'thinking';
    }
  };

  const getToolIcon = () => {
    switch (currentTool) {
      case 'web_search':
        return <Globe className="h-4 w-4" />;
      case 'web_scraping':
        return <Download className="h-4 w-4" />;
      case 'python_exec':
        return <Code2 className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getToolName = () => {
    switch (currentTool) {
      case 'web_search':
        return 'Pesquisando na web';
      case 'web_scraping':
        return 'Raspando dados';
      case 'python_exec':
        return 'Executando código Python';
      default:
        return 'Pensando...';
    }
  };

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="flex items-start gap-3">
        {/* Ícone Sonic 3D Azul */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <SonicIcon emotion={getEmotion()} size={48} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="gap-2">
              {getToolIcon()}
              {getToolName()}
            </Badge>
          </div>

          {/* Raciocínio */}
          {reasoning && (
            <div className="mb-3 p-3 bg-white/60 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700">{reasoning}</p>
            </div>
          )}

          {/* Fontes sendo pesquisadas */}
          {sources && sources.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600 mb-1">Fontes consultadas:</p>
              {sources.map((source, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                  <Globe className="h-3 w-3" />
                  <span className="truncate">{source}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status de Conexão (se relevante) */}
      {connectionStatus && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center gap-2">
            {connectionStatus.isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-600">
                  {connectionStatus.platform} conectado
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-xs text-gray-600">
                  {connectionStatus.platform} não conectado
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

