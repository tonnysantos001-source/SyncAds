/**
 * CHAT MODAL NORMAL
 * Modal de chat tradicional com painel de mídia integrado (estilo ChatGPT)
 *
 * @version 3.0.0 — Watermark fixa no fundo
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconSend,
  IconBrandOpenai,
  IconLoader2,
  IconPlus,
  IconPhoto,
  IconFileZip,
  IconX,
} from '@tabler/icons-react';
import Textarea from 'react-textarea-autosize';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useModalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useModalError } from '@/hooks/useModalError';
import { storageService } from '@/lib/storage';
import { useToast } from '@/components/ui/use-toast';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { useCallback } from 'react';

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
  const [stagedAttachment, setStagedAttachment] = useState<{file: File, url: string, type: 'image' | 'file', name: string} | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const isAssistantTyping = useChatStore((state) => state.isAssistantTyping);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  const { handleError } = useModalError();

  const shortcuts = useModalShortcuts({
    onSend: () => {
      if ((input.trim() || stagedAttachment) && !isAssistantTyping) {
        handleSend();
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAssistantTyping]);

  useEffect(() => {
    if (input.trim() && onDetectContext) {
      const timeoutId = setTimeout(() => {
        onDetectContext(input);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [input, onDetectContext]);



  const handleSend = async () => {
    if ((!input.trim() && !stagedAttachment) || isAssistantTyping) return;
    
    let messageToSend = input.trim();
    setInput('');

    if (stagedAttachment) {
      let attachmentMarkdown = '';
      if (stagedAttachment.type === 'image') {
        attachmentMarkdown = `🖼️ **Imagem importada:** ${stagedAttachment.name}\n![Imagem do usuário](${stagedAttachment.url})`;
      } else {
        attachmentMarkdown = `📁 **Arquivo enviado para revisão:** ${stagedAttachment.name}\n[📎 Baixar arquivo](${stagedAttachment.url})`;
      }
      
      if (messageToSend) {
        messageToSend = `${messageToSend}\n\n${attachmentMarkdown}`;
      } else {
        messageToSend = attachmentMarkdown;
      }
      
      setStagedAttachment(null);
    }

    try {
      onSendMessage?.(messageToSend);
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

  const handleUpload = useCallback(async (file: File, type: 'image' | 'file') => {
    if (!file) return;

    const isImage = type === 'image';
    if (isImage) setIsUploadingImage(true);
    else setIsUploadingFile(true);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const path = `chat/${fileName}`;
      
      const result = await storageService.upload({
        file,
        path,
        bucket: 'chat-attachments',
      });

      if (result.success && result.data) {
        const url = result.data.publicUrl;
        
        setStagedAttachment({
          file,
          url,
          type: isImage ? 'image' : 'file',
          name: file.name
        });
        
        toast({
          title: "✅ Arquivo pronto",
          description: `O arquivo foi preparado para envio. Digite sua mensagem.`,
        });
      } else {
        throw new Error(result.error || 'Erro no upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "❌ Erro no upload",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      if (isImage) setIsUploadingImage(false);
      else setIsUploadingFile(false);
    }
  }, [onSendMessage, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, 'image');
    if (e.target) e.target.value = ''; // Reset input
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, 'file');
    if (e.target) e.target.value = ''; // Reset input
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden" role="region" aria-label="Chat com IA">

      {/* ════════════════════════════════════════════════
          MARCA D'ÁGUA — position:absolute no wrapper
          NÃO está dentro do div de scroll, então NUNCA rola.
          Com as mesmas cores de fundo, usamos mask-image 
          para as bordas sumirem 100% num gradiente suave.
      ════════════════════════════════════════════════ */}
      <div
        className="absolute left-0 right-0 top-0 bottom-[88px] z-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <motion.img
          src="/chat-watermark.png"
          alt=""
          className="object-contain select-none w-72 sm:w-80 md:w-[400px] lg:w-[480px] h-auto -translate-y-16"
          draggable={false}
          style={{
            WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, black 85%, transparent 100%)',
            maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, black 85%, transparent 100%)'
          }}
          animate={{ opacity: [0.72, 0.88, 0.72] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ════════════════════════════════════════════════
          MENSAGENS — z-10, rola por cima da marca fixa
      ════════════════════════════════════════════════ */}
      <div
        className="relative z-10 flex flex-col flex-1 overflow-y-auto overflow-x-hidden px-4 py-6"
        role="log"
        aria-live="polite"
      >
        {/* Estado vazio — sugestões rápidas */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-end h-full text-center pb-6 space-y-4"
          >
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-lg">
                Como posso ajudar hoje?
              </h2>
              <p className="text-gray-400 text-sm md:text-base max-w-sm md:max-w-md">
                Sou seu assistente de marketing digital com IA.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl pt-2">
              {QUICK_SUGGESTIONS.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.08 }}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className={cn(
                    'group relative p-4 rounded-xl text-left',
                    'bg-black/50 hover:bg-black/70 backdrop-blur-md',
                    'border border-white/10 hover:border-blue-500/50',
                    'transition-all duration-200'
                  )}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{suggestion.icon}</span>
                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {suggestion.text}
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Mensagens */}
        {messages.length > 0 && (
          <div className="flex flex-col flex-1">
            <div className="space-y-6 mt-auto">
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

              {/* Typing indicator */}
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
                    <div className="flex-1 bg-black/50 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10">
                      <div className="flex items-center gap-2">
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 bg-blue-500 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="ml-2 text-sm text-gray-400">Pensando...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4 flex-shrink-0" />
      </div>

      {/* ════════════════════════════════════════════════
          INPUT
      ════════════════════════════════════════════════ */}
      <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="px-4 py-4">
        <div className="relative">
          {/* File inputs discretos */}
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isUploadingImage || isAssistantTyping}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".zip,.pdf,.doc,.docx,.txt,.js,.ts,.tsx,.html,.css"
            onChange={handleFileChange}
            disabled={isUploadingFile || isAssistantTyping}
          />

          {/* Staged Attachment Preview */}
          <AnimatePresence>
            {stagedAttachment && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                className="mb-3 flex items-center gap-3 p-3 rounded-xl bg-blue-900/20 border border-blue-500/30 w-max pr-12 relative overflow-hidden"
              >
                {stagedAttachment.type === 'image' ? (
                  <div className="w-12 h-12 rounded overflow-hidden bg-black/50 flex-shrink-0 border border-white/10">
                    <img src={stagedAttachment.url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded flex items-center justify-center bg-purple-500/20 text-purple-400 flex-shrink-0 border border-white/10">
                    <IconFileZip className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-blue-100 truncate max-w-[200px]">{stagedAttachment.name}</p>
                  <p className="text-xs text-blue-400/70">Anexo pronto para envio</p>
                </div>
                <button
                  onClick={() => setStagedAttachment(null)}
                  className="absolute right-3 top-3 bottom-3 flex items-center justify-center w-8 rounded-lg text-blue-400 hover:text-white hover:bg-blue-500/20 transition-colors"
                  title="Remover anexo"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Row */}
          <div className="relative flex items-end gap-3 p-3 bg-white/5 border border-white/10 rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50">
            <div className="flex items-center gap-2 mb-0.5">
              {/* Import Image Button */}
              <motion.button
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage || isAssistantTyping}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200 flex-shrink-0 flex items-center justify-center min-w-[40px]",
                  isUploadingImage
                    ? "bg-blue-600/50 cursor-wait"
                    : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                )}
                whileHover={!isUploadingImage && !isAssistantTyping ? { scale: 1.05 } : {}}
                whileTap={!isUploadingImage && !isAssistantTyping ? { scale: 0.95 } : {}}
                title="Importar Imagem"
              >
                {isUploadingImage ? (
                  <IconLoader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <IconPhoto className="w-5 h-5" />
                )}
              </motion.button>

              {/* Upload File Button */}
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile || isAssistantTyping}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200 flex-shrink-0 flex items-center justify-center min-w-[40px]",
                  isUploadingFile
                    ? "bg-purple-600/50 cursor-wait"
                    : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                )}
                whileHover={!isUploadingFile && !isAssistantTyping ? { scale: 1.05 } : {}}
                whileTap={!isUploadingFile && !isAssistantTyping ? { scale: 0.95 } : {}}
                title="Enviar Arquivos (ZIP/Docs)"
              >
                {isUploadingFile ? (
                  <IconLoader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <IconFileZip className="w-5 h-5" />
                )}
              </motion.button>
            </div>

              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                minRows={1}
                maxRows={6}
                disabled={isAssistantTyping}
                className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus:outline-none resize-none py-2 max-h-40"
              />

              {/* Send Button */}
              <motion.button
                onClick={handleSend}
                disabled={!(input.trim() || stagedAttachment) || isAssistantTyping}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200 flex-shrink-0',
                  (input.trim() || stagedAttachment) && !isAssistantTyping
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                )}
                whileHover={(input.trim() || stagedAttachment) && !isAssistantTyping ? { scale: 1.05 } : {}}
                whileTap={(input.trim() || stagedAttachment) && !isAssistantTyping ? { scale: 0.95 } : {}}
              >
                {isAssistantTyping ? (
                  <IconLoader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <IconSend className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Footer hints */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-3">
              <p className="hidden md:block text-xs text-gray-500">
                <kbd className="px-1.5 py-0.5 text-xs bg-white/10 rounded">Ctrl</kbd> +{' '}
                <kbd className="px-1.5 py-0.5 text-xs bg-white/10 rounded">Enter</kbd> para enviar
              </p>
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600">
                <IconPhoto className="w-3 h-3" />
                <IconFileZip className="w-3 h-3" />
                <span>Importe mídia ou arquivos para revisão</span>
              </div>
            </div>
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
