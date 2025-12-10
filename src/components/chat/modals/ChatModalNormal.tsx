/**
 * CHAT MODAL NORMAL
 * Modal de chat tradicional para conversas gerais
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconSend,
  IconBrandOpenai,
  IconUserCircle,
  IconSparkles,
  IconLoader2,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { useChatStream } from '@/hooks/useChatStream';
import { useModalError } from '@/hooks/useModalError';

interface ChatModalNormalProps {
  onSendMessage?: (message: string) => void;
  onDetectContext?: (message: string) => void;
  userId?: string;
  isExpanded?: boolean;
}

const QUICK_SUGGESTIONS = [
  { icon: '🎯', text: 'Criar uma campanha de anúncios' },
  { icon: '📊', text: 'Analisar métricas da campanha' },
  { icon: '💡', text: 'Dar ideias para conteúdo' },
  { icon: '🎨', text: 'Criar uma imagem para anúncio' },
];

export function ChatModalNormal({
  onSendMessage,
  onDetectContext,
  userId,
  isExpanded,
}: ChatModalNormalProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const user = useAuthStore((state) => state.user);
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const isAssistantTyping = useChatStore((state) => state.isAssistantTyping);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Usar hooks customizados
  const { sendMessage, isStreaming, streamedContent } = useChatStream();
  const { handleError } = useModalError();

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAssistantTyping, streamedContent]);

  // Detect context on input change
  useEffect(() => {
    if (input.trim() && onDetectContext) {
      const timeoutId = setTimeout(() => {
        onDetectContext(input);
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    }
  }, [input, onDetectContext]);

  // Handle send com streaming
  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const message = input.trim();
    setInput('');

    try {
      // Callback para o manager (detecção de contexto)
      onSendMessage?.(message);

      // Enviar mensagem com streaming
      await sendMessage(message, {
        conversationId: activeConversationId,
        context: 'chat',
      });

      // Focar no textarea após envio
      textareaRef.current?.focus();
    } catch (error) {
      // Error já tratado pelo hook useChatStream
      console.error('Error in handleSend:', error);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center space-y-6"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-600/50"
            >
              <IconSparkles className="w-10 h-10 text-white" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Como posso ajudar hoje?
              </h2>
              <p className="text-gray-400 max-w-md">
                Sou seu assistente de marketing digital especializado em SyncAds.
                Pergunte-me qualquer coisa!
              </p>
            </div>

            {/* Quick suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
              {QUICK_SUGGESTIONS.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className={cn(
                    'group relative p-4 rounded-xl',
                    'bg-white/5 hover:bg-white/10',
                    'border border-white/10 hover:border-blue-500/50',
                    'transition-all duration-200',
                    'text-left'
                  )}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{suggestion.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {suggestion.text}
                      </p>
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          // Messages list
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChatMessage message={message} />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Assistant typing indicator */}
            <AnimatePresence>
              {isAssistantTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <IconBrandOpenai className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-blue-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-blue-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-blue-500 rounded-full"
                      />
                      <span className="ml-2 text-sm text-gray-400">
                        Pensando...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="px-4 py-4">
          <div className="relative">
            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
              maxRows={6}
              disabled={isStreaming}
              className={cn(
                'w-full px-4 py-3 pr-12',
                'bg-white/5 border border-white/10',
                'rounded-xl resize-none',
                'text-white placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            />

            {/* Send button */}
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className={cn(
                'absolute right-2 bottom-2',
                'w-9 h-9 rounded-lg',
                'flex items-center justify-center',
                'transition-all duration-200',
                input.trim() && !isStreaming
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              )}
              whileHover={input.trim() && !isStreaming ? { scale: 1.05 } : {}}
              whileTap={input.trim() && !isStreaming ? { scale: 0.95 } : {}}
            >
              {isStreaming ? (
                <IconLoader2 className="w-5 h-5 animate-spin" />
              ) : (
                <IconSend className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          {/* Character count */}
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-xs text-gray-500">
              Shift + Enter para nova linha
            </p>
            <p className={cn(
              'text-xs',
              input.length > 1800 ? 'text-orange-500' : 'text-gray-500'
            )}>
              {input.length} / 2000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatModalNormal;
