/**
 * CHAT MODAL NORMAL
 * Modal de chat tradicional para conversas gerais
 *
 * @version 1.1.0
 * @date 2025-12-12
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconSend,
  IconBrandOpenai,
  IconSparkles,
  IconLoader2,
  IconPlus,
  IconFileUpload,
  IconBrush,
  IconPhoto,
  IconVideo,
  IconCode
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { useChatStream } from '@/hooks/useChatStream';
import { useModalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useModalError } from '@/hooks/useModalError';

interface ChatModalNormalProps {
  onSendMessage?: (message: string) => void;
  onDetectContext?: (message: string) => void;
  onSwitchModal?: (type: string) => void;
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
  onSwitchModal,
  userId,
  isExpanded,
}: ChatModalNormalProps) {
  const [input, setInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((state) => state.user);
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const isAssistantTyping = useChatStore((state) => state.isAssistantTyping);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  const { sendMessage, isStreaming, streamedContent } = useChatStream();
  const { handleError } = useModalError();

  const shortcuts = useModalShortcuts({
    onSend: () => {
      if (input.trim() && !isStreaming) {
        handleSend();
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAssistantTyping, streamedContent]);

  useEffect(() => {
    if (input.trim() && onDetectContext) {
      const timeoutId = setTimeout(() => {
        onDetectContext(input);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [input, onDetectContext]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const message = input.trim();
    setInput('');

    try {
      onSendMessage?.(message);
      await sendMessage(message, {
        conversationId: activeConversationId,
        context: 'chat',
      });
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Error in handleSend:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const handleMenuOption = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  const menuOptions = [
    {
      label: 'Carregar Arquivo',
      icon: IconFileUpload,
      action: () => {
        // Placeholder for file upload logic
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => console.log('File selected:', (e.target as HTMLInputElement).files);
        input.click();
      },
      color: 'text-blue-400'
    },
    {
      label: 'Criar Imagem',
      icon: IconPhoto,
      action: () => onSwitchModal?.('image-gallery'),
      color: 'text-pink-400'
    },
    {
      label: 'Criar Site',
      icon: IconBrush,
      action: () => onSwitchModal?.('visual-editor'),
      color: 'text-purple-400'
    },
    {
      label: 'Criar Vídeo',
      icon: IconVideo,
      action: () => onSwitchModal?.('video-gallery'),
      color: 'text-orange-400'
    },
  ];

  return (
    <div className="flex flex-col h-full" role="region" aria-label="Chat com IA">
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
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
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
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

      <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="px-4 py-4">
          <div className="relative flex items-end gap-3 p-3 bg-white/5 border border-white/10 rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50">
            {/* Plus Menu Button */}
            <div className="relative" ref={menuRef}>
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isMenuOpen ? "bg-blue-600 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Abrir menu de opções"
              >
                <IconPlus className={cn("w-5 h-5 transition-transform", isMenuOpen && "rotate-45")} />
              </motion.button>

              {/* Menu Popup */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: -10, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50 backdrop-blur-md"
                  >
                    <div className="space-y-1">
                      {menuOptions.map((option, idx) => (
                        <motion.button
                          key={idx}
                          onClick={() => handleMenuOption(option.action)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left group"
                          whileHover={{ x: 4 }}
                        >
                          <div className={cn("p-1.5 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors", option.color)}>
                            <option.icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm text-gray-300 group-hover:text-white font-medium">
                            {option.label}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Ctrl+Enter para enviar)"
              minRows={1}
              maxRows={6}
              disabled={isStreaming}
              className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus:outline-none resize-none py-2 max-h-40"
            />

            {/* Send button */}
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className={cn(
                'p-2 rounded-lg transition-all duration-200',
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

          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 text-xs bg-white/10 rounded">Ctrl</kbd> +{' '}
              <kbd className="px-1.5 py-0.5 text-xs bg-white/10 rounded">Enter</kbd> para enviar
            </p>
            <p className="text-xs text-gray-500">
              {input.length} / 2000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatModalNormal;
