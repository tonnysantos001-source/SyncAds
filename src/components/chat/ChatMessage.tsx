/**
 * Componente de mensagem do chat
 * Suporta mensagens normais, imagens, vídeos e ações interativas
 */

import React, { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Bot,
  User,
  Download,
  ExternalLink,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import { IntegrationActionButtons } from "./IntegrationActionButtons";
import type { IntegrationSlug } from "@/lib/integrations/types";
import ReactMarkdown from "react-markdown";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;

  // Anexos (imagens, vídeos, arquivos)
  attachments?: Array<{
    type: "image" | "video" | "file";
    url: string;
    name?: string;
    size?: number;
  }>;

  // Metadados para ações interativas
  action?: {
    type: "integration_connect";
    platform: IntegrationSlug;
    userId: string;
  };
}

interface ChatMessageProps {
  message: ChatMessageData;
  onActionComplete?: () => void;
}

export const ChatMessage = React.memo(function ChatMessage({
  message,
  onActionComplete,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});
  const [videoError, setVideoError] = useState<{ [key: string]: boolean }>({});

  // Detectar URLs de imagem no conteúdo (Markdown e diretas)
  const imageUrlRegex =
    /!\[([^\]]*)\]\(([^)]+)\)|(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^\s]*)?)/gi;
  const videoUrlRegex =
    /(https?:\/\/[^\s]+\.(?:mp4|webm|ogg|mov)(?:\?[^\s]*)?)/gi;

  const imageMatches = Array.from(message.content.matchAll(imageUrlRegex));
  const videoMatches = Array.from(message.content.matchAll(videoUrlRegex));

  // Extrair URLs de imagem (tanto markdown quanto diretas)
  const extractedImages = imageMatches
    .map((match) => {
      if (match[2]) {
        // Markdown: ![alt](url)
        return { url: match[2], alt: match[1] || "Imagem" };
      } else if (match[3]) {
        // URL direta
        return { url: match[3], alt: "Imagem" };
      }
      return null;
    })
    .filter(Boolean) as Array<{ url: string; alt: string }>;

  const extractedVideos = videoMatches.map((match) => match[1]);

  // Remover URLs de mídia do conteúdo para não duplicar
  let contentWithoutMedia = message.content;
  extractedImages.forEach((img) => {
    contentWithoutMedia = contentWithoutMedia.replace(img.url, "");
  });
  extractedVideos.forEach((video) => {
    contentWithoutMedia = contentWithoutMedia.replace(video, "");
  });
  contentWithoutMedia = contentWithoutMedia
    .replace(imageUrlRegex, "")
    .replace(videoUrlRegex, "")
    .trim();

  const hasMedia =
    extractedImages.length > 0 ||
    extractedVideos.length > 0 ||
    (message.attachments && message.attachments.length > 0);

  return (
    <div
      className={cn("flex gap-3 p-4", isUser ? "justify-end" : "justify-start")}
    >
      {/* Avatar (só para assistant) */}
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Conteúdo */}
      <div
        className={cn("flex flex-col gap-2 max-w-[80%]", isUser && "items-end")}
      >
        {/* Mensagem de texto */}
        {contentWithoutMedia && (
          <div
            className={cn(
              "rounded-lg px-4 py-2",
              isUser
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700",
            )}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap">
                {contentWithoutMedia}
              </p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{contentWithoutMedia}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Imagens extraídas do conteúdo */}
        {extractedImages.length > 0 && (
          <div
            className={cn(
              "flex flex-col gap-2",
              isUser ? "items-end" : "items-start",
            )}
          >
            {extractedImages.map((img, index) => (
              <div
                key={`extracted-img-${index}`}
                className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
              >
                {imageError[img.url] ? (
                  <div className="flex items-center gap-2 p-4 text-gray-500">
                    <ImageIcon className="h-5 w-5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Erro ao carregar imagem
                      </span>
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Abrir em nova aba <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="max-w-sm max-h-96 object-contain"
                      onError={() =>
                        setImageError((prev) => ({ ...prev, [img.url]: true }))
                      }
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white text-xs flex items-center gap-1 hover:underline"
                      >
                        <Download className="h-3 w-3" />
                        Baixar imagem
                      </a>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Vídeos extraídos do conteúdo */}
        {extractedVideos.length > 0 && (
          <div
            className={cn(
              "flex flex-col gap-2",
              isUser ? "items-end" : "items-start",
            )}
          >
            {extractedVideos.map((videoUrl, index) => (
              <div
                key={`extracted-video-${index}`}
                className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-black"
              >
                {videoError[videoUrl] ? (
                  <div className="flex items-center gap-2 p-4 text-gray-500">
                    <Play className="h-5 w-5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Erro ao carregar vídeo
                      </span>
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Abrir em nova aba <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <video
                    src={videoUrl}
                    controls
                    className="max-w-sm max-h-96"
                    onError={() =>
                      setVideoError((prev) => ({ ...prev, [videoUrl]: true }))
                    }
                    preload="metadata"
                  >
                    Seu navegador não suporta vídeos.
                  </video>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Anexos (imagens, vídeos, arquivos) */}
        {message.attachments && message.attachments.length > 0 && (
          <div
            className={cn(
              "flex flex-col gap-2",
              isUser ? "items-end" : "items-start",
            )}
          >
            {message.attachments.map((attachment, index) => (
              <div
                key={`attachment-${index}`}
                className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                {attachment.type === "image" && (
                  <div className="relative bg-white dark:bg-gray-800">
                    <img
                      src={attachment.url}
                      alt={attachment.name || "Anexo"}
                      className="max-w-sm max-h-96 object-contain"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <div className="flex items-center justify-between text-white text-xs">
                        <span>{attachment.name || "Imagem"}</span>
                        <a
                          href={attachment.url}
                          download
                          className="flex items-center gap-1 hover:underline"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {attachment.type === "video" && (
                  <div className="bg-black">
                    <video
                      src={attachment.url}
                      controls
                      className="max-w-sm max-h-96"
                      preload="metadata"
                    >
                      Seu navegador não suporta vídeos.
                    </video>
                  </div>
                )}

                {attachment.type === "file" && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {attachment.name || "Arquivo"}
                      </p>
                      {attachment.size && (
                        <p className="text-xs text-gray-500">
                          {(attachment.size / 1024).toFixed(2)} KB
                        </p>
                      )}
                    </div>
                    <a
                      href={attachment.url}
                      download
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Componente de ação interativa (se houver) */}
        {!isUser && message.action?.type === "integration_connect" && (
          <IntegrationActionButtons
            platform={message.action.platform}
            userId={message.action.userId}
            onSkip={onActionComplete}
            onSuccess={onActionComplete}
            onError={(error) => {
              console.error("Erro na ação:", error);
            }}
          />
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* Avatar (só para user) */}
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-700 text-white">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});
