import React from 'react';
import { Download, FileText, FileSpreadsheet, FileImage, File, ExternalLink, Copy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface DownloadCardProps {
  file: {
    url: string;
    filename: string;
    size?: number;
    mimeType?: string;
    expiresAt?: string;
    format?: string;
  };
  message?: string;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({ file, message }) => {
  const { toast } = useToast();

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Tamanho desconhecido';

    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${kb.toFixed(1)} KB`;
  };

  const getFileIcon = () => {
    const type = file.mimeType || file.format || '';

    if (type.includes('csv') || file.filename.endsWith('.csv')) {
      return <FileText className="w-8 h-8 text-green-500" />;
    }
    if (type.includes('excel') || type.includes('spreadsheet') || file.filename.endsWith('.xlsx')) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    }
    if (type.includes('pdf') || file.filename.endsWith('.pdf')) {
      return <FileImage className="w-8 h-8 text-red-500" />;
    }
    return <File className="w-8 h-8 text-blue-500" />;
  };

  const formatExpiresAt = (dateString?: string): string => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));

      if (hours < 1) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `Expira em ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
      }

      return `Expira em ${hours} hora${hours !== 1 ? 's' : ''}`;
    } catch (e) {
      return '';
    }
  };

  const handleDownload = () => {
    window.open(file.url, '_blank');
    toast({
      title: "Download iniciado",
      description: `Baixando ${file.filename}`,
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(file.url);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para sua área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    // Para CSV e TXT, podemos tentar preview
    if (file.filename.endsWith('.csv') || file.filename.endsWith('.txt')) {
      window.open(file.url, '_blank');
    } else {
      handleDownload();
    }
  };

  return (
    <Card className="p-4 my-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-4">
        {/* Ícone do arquivo */}
        <div className="flex-shrink-0 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {getFileIcon()}
        </div>

        {/* Informações do arquivo */}
        <div className="flex-1 min-w-0">
          {message && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {message}
            </p>
          )}

          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
            {file.filename}
          </h3>

          <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              📦 {formatFileSize(file.size)}
            </span>

            {file.expiresAt && (
              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                ⏰ {formatExpiresAt(file.expiresAt)}
              </span>
            )}

            {file.format && (
              <span className="uppercase font-mono">
                {file.format}
              </span>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handlePreview}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950"
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyLink}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Link
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(file.url, '_blank')}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de progresso de expiração */}
      {file.expiresAt && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Arquivo temporário</span>
            <span>{formatExpiresAt(file.expiresAt)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-1000"
              style={{
                width: calculateProgress(file.expiresAt)
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

// Função auxiliar para calcular progresso de expiração
function calculateProgress(expiresAt: string): string {
  try {
    const expires = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const created = expires - twentyFourHours;

    const elapsed = now - created;
    const total = expires - created;
    const percentage = Math.max(0, Math.min(100, (elapsed / total) * 100));

    return `${100 - percentage}%`;
  } catch (e) {
    return '100%';
  }
}

export default DownloadCard;
