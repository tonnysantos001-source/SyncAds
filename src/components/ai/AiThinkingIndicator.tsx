import { Sparkles, Globe, Download, Code2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AiThinkingIndicatorProps {
  isThinking: boolean;
  currentTool?: 'web_search' | 'web_scraping' | 'python_exec' | null;
  reasoning?: string;
  sources?: string[];
}

export default function AiThinkingIndicator({ 
  isThinking, 
  currentTool, 
  reasoning,
  sources 
}: AiThinkingIndicatorProps) {
  if (!isThinking) return null;

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
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg animate-pulse">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-3xl">🦔</div> {/* Sonic placeholder */}
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-ping"></div>
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
    </div>
  );
}

