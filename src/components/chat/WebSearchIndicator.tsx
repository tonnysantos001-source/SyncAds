import React from 'react';
import { Search, Globe, ExternalLink } from 'lucide-react';

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
}

interface WebSearchIndicatorProps {
  isSearching: boolean;
  searchResults?: WebSearchResult[];
  searchQuery?: string;
}

export const WebSearchIndicator: React.FC<WebSearchIndicatorProps> = ({
  isSearching,
  searchResults = [],
  searchQuery
}) => {
  if (!isSearching && searchResults.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-800">
          {isSearching ? 'Pesquisando na web...' : 'Resultados da pesquisa:'}
        </span>
      </div>
      
      {searchQuery && (
        <p className="text-xs text-blue-600 mb-2">
          <strong>Consulta:</strong> "{searchQuery}"
        </p>
      )}

      {isSearching ? (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <span className="text-xs text-blue-600">Buscando informações...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {searchResults.slice(0, 3).map((result, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-white rounded border">
              <div className="flex-shrink-0 mt-0.5">
                {result.favicon ? (
                  <img 
                    src={result.favicon} 
                    alt="" 
                    className="w-4 h-4"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-gray-900 truncate">
                  {result.title}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {result.snippet}
                </p>
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver fonte
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente para mostrar logos dos sites pesquisados
export const SearchSourcesIndicator: React.FC<{
  sources: string[];
  isSearching: boolean;
}> = ({ sources, isSearching }) => {
  if (isSearching) {
    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Pesquisando em múltiplas fontes...
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {sources.map((source, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs text-gray-600"
            >
              <Globe className="w-3 h-3" />
              {source}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

