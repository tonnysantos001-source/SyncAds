import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ChatModalManager } from '@/components/chat/modals';
import chatService from '@/lib/api/chatService';
import type { ModalContext } from '@/lib/ai/modalContext';

/**
 * CHAT PAGE - SISTEMA DE MODAIS ADAPTATIVOS
 * 
 * Versão 2.0 - Usando ChatModalManager com detecção automática de contexto
 * 
 * Features:
 * - Detecção automática de intenção do usuário
 * - Transição suave entre modais especializados:
 *   - Chat Normal: conversas gerais
 *   - Visual Editor: criar landing pages (estilo Dualite)
 *   - Image Gallery: gerar/visualizar imagens (estilo Canva)
 *   - Video Gallery: criar/visualizar vídeos
 *   - Browser Automation: controlar navegador via extensão
 * - NLP para classificação de contexto
 * - Analytics e tracking de uso
 * 
 * @version 2.0.0
 * @date 2025-12-08
 */
export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login-v2', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  /**
   * Handle modal changes
   * Track analytics when user switches between modals
   */
  const handleModalChange = (modalType: string) => {
    console.log('[ChatPage] Modal changed:', modalType);

    // TODO: Add analytics tracking
    // analytics.track('modal_changed', {
    //   modalType,
    //   userId: user?.id,
    //   timestamp: Date.now(),
    // });
  };

  /**
   * Handle message sending with context awareness
   * Routes messages to appropriate backend endpoint based on modal context
   */
  const handleSendMessage = async (message: string, context: ModalContext) => {
    console.log('[ChatPage] Sending message:', {
      message: message.substring(0, 50) + '...',
      modalType: context.type,
      confidence: context.confidence,
    });

    try {
      // Send message to backend with context
      // Backend can handle differently based on modal type
      await chatService.sendMessage(message, {
        modalType: context.type,
        confidence: context.confidence,
        params: context.params,
        metadata: context.metadata,
      });

      // TODO: Add success tracking
      // analytics.track('message_sent', {
      //   modalType: context.type,
      //   confidence: context.confidence,
      //   messageLength: message.length,
      // });
    } catch (error) {
      console.error('[ChatPage] Error sending message:', error);

      // TODO: Add error tracking
      // analytics.track('message_error', {
      //   modalType: context.type,
      //   error: error.message,
      // });
    }
  };

  // Don't render until authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <ChatModalManager
        autoDetect={true}
        allowManualSwitch={true}
        initialModal="chat"
        userId={user.id}
        onModalChange={handleModalChange}
        onSendMessage={handleSendMessage}
        className="h-full w-full"
      />
    </div>
  );
}
