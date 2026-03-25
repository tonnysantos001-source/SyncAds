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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from '@tabler/icons-react';

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
}

// Somente o chat é exibido como aba — mídia fica integrada no MediaGeneratorPanel
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
}: ChatModalManagerProps) {
  const [currentModal, setCurrentModal] = useState<ModalType>(initialModal);
  const [previousModal, setPreviousModal] = useState<ModalType>(initialModal);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [detectedContext, setDetectedContext] = useState<ModalContext | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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
   * Renderiza o modal atual (sempre ChatModalNormal — mídia integrada via MediaGeneratorPanel)
   */
  const renderCurrentModal = () => {
    const modalProps = {
      onSendMessage: handleMessageSend,
      onDetectContext: handleMessageDetection,
      userId,
      isExpanded,
    };
    return <ChatModalNormal {...modalProps} onSwitchModal={handleManualSwitch} />;
  };

  return (
    <div
      className={cn(
        'relative flex flex-col h-full w-full',
        'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950',
        className
      )}
    >
      {/* Header com seletores de modal */}
      <div className="flex items-center px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm w-full overflow-hidden">
        
        {/* Menu Toggle no Mobile incorporado ao cabeçalho flexível */}
        {showSidebarToggle && onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="md:hidden mr-3 p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
            aria-label="Abrir Menu"
          >
            <IconMenu2 className="w-5 h-5" />
          </button>
        )}

        {/* Modal Switcher - Apenas Chat IA visível; Imagem/Vídeo/Áudio integrados no botão + */}
        <div className="flex items-center gap-2 flex-grow overflow-x-auto no-scrollbar scroll-smooth pl-1 pr-4">
          {Object.keys(MODAL_NAMES).map((type) => {
            const Icon = MODAL_ICONS[type];
            const isActive = true; // always chat
            const isDetected = false;

            return (
              <motion.button
                key={type}
                className={cn(
                  'relative flex items-center gap-2 px-3 py-2 rounded-lg',
                  'transition-all duration-200',
                  'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                )}
                whileHover={!isTransitioning ? { scale: 1.05 } : {}}
                whileTap={!isTransitioning ? { scale: 0.95 } : {}}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{MODAL_NAMES[type]}</span>

                {/* Indicador de detecção */}
                {isDetected && !isActive && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Controls - Separados e fixos à direita */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0 border-l border-white/10 pl-4 bg-transparent">
          {/* Exit Button */}
          {onExit && (
            <motion.button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 transition-colors mr-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold hidden sm:inline">Voltar</span>
            </motion.button>
          )}
          
          {/* Expand/Collapse */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors hidden sm:flex"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isExpanded ? (
              <IconMinimize className="w-4 h-4" />
            ) : (
              <IconMaximize className="w-4 h-4" />
            )}
          </motion.button>
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
            {renderCurrentModal()}
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

