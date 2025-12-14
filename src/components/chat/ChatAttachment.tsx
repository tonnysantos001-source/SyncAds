/**
 * ChatAttachment Component
 * Exibe anexos gerados pela IA (imagens, arquivos, links, vídeos)
 *
 * @version 1.0.0
 * @date 02/02/2025
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image,
  FileText,
  Download,
  ExternalLink,
  Video,
  Eye,
  X,
  Check,
  Copy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export interface ChatAttachmentProps {
  type: 'image' | 'video' | 'file' | 'link';
  url: string;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
  onDownload?: () => void;
}

export const ChatAttachment: React.FC<ChatAttachmentProps> = ({
  type,
  url,
  title,
  description,
  metadata,
  onDownload,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: '✅ Link copiado!',
        description: 'URL copiada para a área de transferência',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: '❌ Erro ao copiar',
        description: 'Não foi possível copiar o link',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    } else {
      window.open(url, '_blank');
    }
    toast({
      title: '📥 Download iniciado',
      description: 'Arquivo sendo baixado...',
    });
  };

  // Renderização específica por tipo
  switch (type) {
    case 'image':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative overflow-hidden rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-lg">
            {/* Imagem */}
            <img
              src={url}
              alt={title || 'Imagem gerada'}
              className="w-full h-auto max-h-96 object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            {/* Overlay com ações */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4"
                >
                  {/* Título e descrição */}
                  {(title || description) && (
                    <div className="mb-3">
                      {title && (
                        <h4 className="text-white font-semibold text-sm mb-1">
                          {title}
                        </h4>
                      )}
                      {description && (
                        <p className="text-gray-300 text-xs line-clamp-2">
                          {description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowPreview(true)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleDownload}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCopyUrl}
                      className="px-3"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Badge com metadata */}
            {metadata && (
              <div className="absolute top-2 right-2">
                <Badge
                  variant="secondary"
                  className="bg-black/60 backdrop-blur-sm text-white border-0"
                >
                  {metadata.size || '1024x1024'}
                </Badge>
              </div>
            )}
          </div>

          {/* Modal de Preview */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowPreview(false)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="relative max-w-6xl max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute -top-12 right-0 text-white hover:bg-white/20"
                    onClick={() => setShowPreview(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <img
                    src={url}
                    alt={title || 'Preview'}
                    className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );

    case 'video':
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-xl border-2 border-pink-200 dark:border-pink-800 overflow-hidden shadow-lg"
        >
          <video
            src={url}
            controls
            className="w-full max-h-96"
            poster={metadata?.thumbnail}
          >
            Seu navegador não suporta vídeos.
          </video>
          {title && (
            <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">{title}</h4>
                  {description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {description}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-3 w-3 mr-1" />
                  Baixar
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      );

    case 'file':
      return (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 shadow-md cursor-pointer"
          onClick={handleDownload}
        >
          {/* Ícone do arquivo */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>

          {/* Informações do arquivo */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">
              {title || 'Arquivo'}
            </h4>
            {description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {description}
              </p>
            )}
            {metadata?.size && (
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(metadata.size)}
              </p>
            )}
          </div>

          {/* Botão de download */}
          <Button size="sm" variant="default" className="flex-shrink-0">
            <Download className="h-4 w-4 mr-1" />
            Baixar
          </Button>
        </motion.div>
      );

    case 'link':
      return (
        <motion.a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          className="flex items-start gap-3 p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-md hover:shadow-lg transition-shadow"
        >
          {/* Ícone de link */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
            <ExternalLink className="h-5 w-5 text-white" />
          </div>

          {/* Informações do link */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 hover:underline">
              {title || 'Link'}
            </h4>
            {description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {description}
              </p>
            )}
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 truncate">
              {new URL(url).hostname}
            </p>
          </div>

          {/* Ícone de abrir */}
          <ExternalLink className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
        </motion.a>
      );

    default:
      return null;
  }
};

/**
 * Componente para exibir múltiplos attachments
 */
export const ChatAttachmentList: React.FC<{
  attachments: ChatAttachmentProps[];
}> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-3 mt-3">
      {attachments.map((attachment, index) => (
        <ChatAttachment key={index} {...attachment} />
      ))}
    </div>
  );
};

/**
 * Formata tamanho de arquivo
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

