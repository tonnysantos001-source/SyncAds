/**
 * CHAT MODAL MANAGER
 * Gerenciador inteligente de modais contextuais para o chat
 *
 * Detecta automaticamente qual modal exibir baseado na mensagem do usuário:
 * - Chat Normal: conversas gerais
 * - Visual Editor: criar/editar páginas (tipo Dualite)
 * - Image Gallery: gerar/ver imagens (tipo Canva)
 * - Video Gallery: criar/ver vídeos
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  detectModalContext,
  shouldAutoTransition,
  getTransitionConfig,
  type ModalType,
  type ModalContext,
} from '@/lib/ai/modalContext';
import { cn } from '@/lib/utils';
import {
  IconMessageCircle,
  IconMaximize,
  IconMinimize,
  IconMenu2,
  IconArrowLeft,
  IconX,
  IconChevronDown,
  IconCheck,
  IconTrash,
  IconPlus,
} from '@tabler/icons-react';
import { useChatStore } from '@/store/chatStore';

// Import do modal principal
import { ChatModalNormal } from './ChatModalNormal';

interface ChatModalManagerProps {
  /** Se deve detectar automaticamente o contexto */
  autoDetect?: boolean;
  /** Callback quando o modal muda */
  onModalChange?: (type: ModalType) => void;
  /** Callback quando uma mensagem é enviada */
  onSendMessage?: (message: string, context: ModalContext) => void;
  /** Estado inicial do modal */
  initialModal?: ModalType;
  /** Se deve permitir trocar manual */
  allowManualSwitch?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** Dados do usuário */
  userId?: string;
  /** Action de toggle do sidebar inserido via wrapper */
  onOpenSidebar?: () => void;
  /** Controla se mostra ícone de sidebar */
  showSidebarToggle?: boolean;
  /** Função de "Sair" do chat */
  onExit?: () => void;
  /** Função para criar nova conversa */
  onCreateConversation?: () => Promise<string | null>;
  /** ID da Conversa Ativa */
  conversationId?: string;
  /** Lista de conversas para o seletor mobile */
  conversations?: Array<{ id: string; title: string; messages?: Array<{ content: string }> }>;
  /** ID da conversa ativa */
  activeConversationId?: string | null;
  /** Callback ao selecionar conversa */
  onSelectConversation?: (id: string) => void;
  /** Callback para criar nova conversa */
  onNewConversation?: () => void;
}

// Chat IA principal com suporte a upload de imagens e arquivos
const MODAL_ICONS: Record<string, React.ComponentType<any>> = {
  chat: IconMessageCircle,
};

const MODAL_NAMES: Record<string, string> = {
  chat: 'Chat IA',
};

export function ChatModalManager({
  autoDetect = true,
  onModalChange,
  onSendMessage,
  initialModal = 'chat',
  allowManualSwitch = true,
  className,
  userId,
  onOpenSidebar,
  showSidebarToggle,
  onExit,
  onCreateConversation,
  conversationId,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ChatModalManagerProps) {
  const deleteConversation = useChatStore(state => state.deleteConversation);
  const [currentModal, setCurrentModal] = useState<ModalType>(initialModal);
  const [previousModal, setPreviousModal] = useState<ModalType>(initialModal);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [detectedContext, setDetectedContext] = useState<ModalContext | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConvDropdownOpen, setIsConvDropdownOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Open the app navigation sidebar via CustomEvent (bridges ChatPage → DashboardLayout)
  const handleOpenAppSidebar = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-app-sidebar'));
  }, []);

  /**
   * Detecta contexto quando mensagem muda
   */
  const handleMessageDetection = useCallback((message: string) => {
    if (!autoDetect || !message.trim()) {
      return;
    }

    const context = detectModalContext(message);
    setDetectedContext(context);

    // Auto transição se confiança alta
    if (shouldAutoTransition(context) && context.type !== currentModal) {
      transitionToModal(context.type);
    }
  }, [autoDetect, currentModal]);

  /**
   * Faz transição para outro modal
   */
  const transitionToModal = useCallback((newModal: ModalType) => {
    if (newModal === currentModal || isTransitioning) return;

    setIsTransitioning(true);
    setPreviousModal(currentModal);

    setTimeout(() => {
      setCurrentModal(newModal);
      setIsTransitioning(false);
      onModalChange?.(newModal);
    }, 100);
  }, [currentModal, isTransitioning, onModalChange]);

  /**
   * Handle manual switch
   */
  const handleManualSwitch = useCallback((type: ModalType) => {
    if (!allowManualSwitch) return;
    transitionToModal(type);
  }, [allowManualSwitch, transitionToModal]);

  /**
   * Handle message send
   */
  const handleMessageSend = useCallback((message: string) => {
    // Detectar contexto antes de enviar
    const context = detectModalContext(message);

    // Callback
    onSendMessage?.(message, context);

    // Se deve auto-transitar
    if (autoDetect && shouldAutoTransition(context) && context.type !== currentModal) {
      transitionToModal(context.type);
    }
  }, [autoDetect, currentModal, onSendMessage, transitionToModal]);

  /**
   * Configuração de animação
   */
  const transitionConfig = useMemo(() => {
    return getTransitionConfig(previousModal, currentModal);
  }, [previousModal, currentModal]);

  /**
   * Props do modal memoizadas para evitar re-renderizações desnecessárias
   */
  const modalProps = useMemo(() => ({
    onSendMessage: handleMessageSend,
    onDetectContext: handleMessageDetection,
    userId,
    isExpanded,
  }), [handleMessageSend, handleMessageDetection, userId, isExpanded]);

  return (
    <div
      className={cn(
        'relative flex flex-col h-full w-full',
        'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950',
        className
      )}
    >
      {/* Mobile-only logo bar */}
      <div className="md:hidden flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/30">
        <img
          src="/syncads-logo.svg"
          alt="SyncAds Logo"
          className="h-9 w-9 object-contain"
        />
        <div>
          <h1 className="text-lg font-black leading-tight text-white">SyncAds</h1>
          <p className="text-[10px] font-bold tracking-wider text-blue-400">MARKETING AI</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center px-3 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm w-full gap-2">

        {/* ☰ Hamburger — mobile only, opens APP navigation sidebar */}
        <button
          onClick={handleOpenAppSidebar}
          className="md:hidden flex-shrink-0 p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Abrir Menu de Navegação"
        >
          <IconMenu2 className="w-5 h-5" />
        </button>

        {/* Conversation selector dropdown — all screen sizes */}
        {/* Desktop spacer pushes to the right */}
        <div className="hidden md:flex flex-1" />

        {/* Separated Nova Conversa button */}
        <button
          onClick={() => {
            onNewConversation?.();
            setIsConvDropdownOpen(false);
          }}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors flex-shrink-0"
          title="Nova Conversa"
        >
          <IconPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Conversa</span>
        </button>

        <div className="flex-1 md:flex-none md:w-64 relative">
          <button
            ref={dropdownButtonRef}
            onClick={() => {
              if (!isConvDropdownOpen && dropdownButtonRef.current) {
                const rect = dropdownButtonRef.current.getBoundingClientRect();
                setDropdownCoords({
                  top: rect.bottom + 8,
                  left: rect.left,
                  width: rect.width,
                });
              }
              setIsConvDropdownOpen(prev => !prev);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
          >
            <IconMessageCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-white truncate">
              {activeConversation?.title || 'Chat IA'}
            </span>
            <IconChevronDown
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0',
                isConvDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown list of conversations via Portal */}
          {createPortal(
            <AnimatePresence>
              {isConvDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'fixed',
                    top: dropdownCoords.top,
                    left: dropdownCoords.left,
                    width: dropdownCoords.width,
                    zIndex: 9999,
                  }}
                  className="bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col"
                >
                  {/* Conversation list */}
                  <div className="overflow-y-auto shrink py-1">
                    {conversations.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">Nenhuma conversa ainda</p>
                    ) : (
                      conversations.map(conv => {
                        let lastMsg = conv.messages?.[conv.messages.length - 1]?.content;
                        if (lastMsg) {
                          lastMsg = lastMsg.replace(/<antigravity_thinking>[\s\S]*?<\/antigravity_thinking>/g, '').trim();
                        }
                        return (
                          <div
                            key={conv.id}
                            className={cn(
                              'group w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer',
                              conv.id === activeConversationId
                                ? 'bg-blue-600/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            )}
                            onClick={() => {
                              onSelectConversation?.(conv.id);
                              setIsConvDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <IconMessageCircle className="w-4 h-4 flex-shrink-0 opacity-60" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{conv.title || 'Nova conversa'}</p>
                                {lastMsg && (
                                  <p className="text-xs text-gray-400 truncate mt-0.5">{lastMsg}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {conv.id === activeConversationId && (
                                <IconCheck className="w-4 h-4 text-blue-400" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // prevent selecting
                                  deleteConversation(conv.id);
                                }}
                                className="p-1.5 rounded-md text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Excluir conversa"
                                aria-label="Excluir conversa"
                              >
                                <IconTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
        </div>

        </div>

      {/* Context Detection Banner */}
      <AnimatePresence>
        {detectedContext && shouldAutoTransition(detectedContext) && detectedContext.type !== currentModal && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2 bg-blue-600/20 border-b border-blue-600/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  {React.createElement(MODAL_ICONS[detectedContext.type], {
                    className: 'w-4 h-4 text-blue-400',
                  })}
                </motion.div>
                <span className="text-blue-300">
                  {detectedContext.metadata?.suggestedAction || 'Contexto detectado'}
                </span>
                <span className="text-blue-400 font-mono text-xs">
                  {(detectedContext.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <button
                onClick={() => setDetectedContext(null)}
                className="p-1 rounded hover:bg-white/10 text-blue-400 hover:text-white transition-colors"
              >
                <IconX className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentModal}
            initial={{
              opacity: 0,
              x: transitionConfig.variant === 'slideLeft' ? 50 : 0,
              scale: transitionConfig.variant === 'fade' ? 0.95 : 1,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: transitionConfig.variant === 'slideLeft' ? -50 : 0,
              scale: transitionConfig.variant === 'fade' ? 0.95 : 1,
            }}
            transition={{
              duration: transitionConfig.duration,
              ease: transitionConfig.ease,
            }}
            className="absolute inset-0"
          >
            <ChatModalNormal 
              {...modalProps} 
              onSwitchModal={handleManualSwitch} 
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatModalManager;

