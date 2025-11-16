/**
 * Componente de mensagem do chat
 * Suporta mensagens normais e mensagens com ações interativas
 */

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { IntegrationActionButtons } from "./IntegrationActionButtons";
import type { IntegrationSlug } from "@/lib/integrations/types";
import ReactMarkdown from "react-markdown";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;

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

  return (
    <div
      className={cn("flex gap-3 p-4", isUser ? "justify-end" : "justify-start")}
    >
      {/* Avatar (só para assistant) */}
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-blue-600 text-white">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Conteúdo */}
      <div
        className={cn("flex flex-col gap-2 max-w-[80%]", isUser && "items-end")}
      >
        {/* Mensagem de texto */}
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

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
          <AvatarFallback className="bg-gray-600 text-white">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});
