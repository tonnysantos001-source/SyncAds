import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { ChatModalManager } from '@/components/chat/modals';
import { ConversationSidebar, MenuToggleButton } from '@/components/chat/ConversationSidebar';
import { ToolExecutionIndicator, ToolExecutionStatus } from '@/components/chat/ToolExecutionIndicator';
import { AdminBadge } from '@/components/admin/AdminBadge';
import chatService from '@/lib/api/chatService';
import type { ModalContext } from '@/lib/ai/modalContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { conversationsApi } from '@/lib/api';

/**
 * CHAT PAGE - SISTEMA DE MODAIS ADAPTATIVOS COM SIDEBAR
 * 
 * Versão 3.0 - Sidebar restaurada + ChatModalManager
 * 
 * Features:
 * - ✅ Sidebar com histórico de conversas (estilo ChatGPT)
 * - ✅ Auto-hide sidebar ao enviar mensagem
 * - ✅ Toggle Menu button para mostrar/esconder
 * - ✅ Detecção automática de contexto (modais adaptativos)
 * - ✅ Separação de contextos web/extension
 * 
 * @version 3.0.0
 * @date 2025-12-14
 */
export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Chat store
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const createNewConversation = useChatStore((state) => state.createNewConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const loadConversations = useChatStore((state) => state.loadConversations);
  const setAssistantTyping = useChatStore((state) => state.setAssistantTyping);

  // Sidebar state (open by default on desktop, closed on mobile)
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 768
  );

  // Tool execution indicator state
  const [toolStatus, setToolStatus] = useState<ToolExecutionStatus>('idle');
  const [toolAction, setToolAction] = useState<string>('');
  const [toolError, setToolError] = useState<string>('');
  const [toolLogs, setToolLogs] = useState<string[]>([]);

  // Auth check
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login-v2', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Load conversations for web context only
  useEffect(() => {
    if (user) {
      loadConversations(user.id, 'web'); // Only web conversations
    }
  }, [user?.id, loadConversations]);

  // Handle modal changes
  const handleModalChange = (modalType: string) => {
    console.log('[ChatPage] Modal changed:', modalType);
  };

  // Handle message sending with sidebar auto-hide
  const handleSendMessage = async (message: string, context: ModalContext) => {
    console.log('[ChatPage] Sending message:', {
      message: message.substring(0, 50) + '...',
      modalType: context.type,
    });

    // Auto-hide sidebar when sending message (ChatGPT behavior)
    setSidebarOpen(false);

    // ✅ CRÍTICO: Setar loading IMEDIATAMENTE (antes de qualquer await)
    setAssistantTyping(true);

    // Detectar se é comando de browser automation
    const browserTriggers = ['abr', 'vá', 'acesse', 'entr', 'cliqu', 'naveg', 'visit'];
    const isBrowserCommand = browserTriggers.some(trigger => message.toLowerCase().includes(trigger));

    if (isBrowserCommand) {
      // Extrair ação
      let action = 'Processando comando';
      if (message.toLowerCase().includes('google')) action = 'Abrindo Google';
      else if (message.toLowerCase().includes('facebook')) action = 'Abrindo Facebook';
      else if (message.toLowerCase().includes('instagram')) action = 'Abrindo Instagram';
      else action = 'Executando navegação';

      setToolAction(action);
      setToolStatus('executing');
      setToolLogs([]);
    }

    try {
      // ✅ FIX CRÍTICO: Auto-criar conversa web se não houver uma ativa
      let convId = activeConversationId;
      if (!convId && user) {
        console.log('[ChatPage] Sem conversa ativa - criando automaticamente...');
        try {
          const newConv = await conversationsApi.createConversation(
            user.id,
            `Conversa ${new Date().toLocaleString('pt-BR')}`,
            'web'
          );
          convId = newConv.id;
          setActiveConversationId(convId);
          // Adicionar à lista local
          const { addConversation } = useChatStore.getState();
          addConversation({ id: convId, title: newConv.title, createdAt: newConv.createdAt, messages: [] });
          console.log('[ChatPage] Conversa criada:', convId);
        } catch (convError) {
          console.error('[ChatPage] Erro ao criar conversa:', convError);
          throw new Error('Não foi possível criar uma conversa.');
        }
      }

      if (!convId) throw new Error('Nenhuma conversa disponível.');

      const response = await chatService.sendMessage(message, convId);

      // ✅ Resetar loading após receber resposta
      setAssistantTyping(false);

      // Recarregar mensagens do banco após resposta da IA
      const { data: updatedMessages } = await supabase
        .from('ChatMessage')
        .select('*')
        .eq('conversationId', convId)
        .order('createdAt', { ascending: true });

      if (updatedMessages && updatedMessages.length > 0) {
        const formatted = updatedMessages.map(msg => ({
          id: msg.id,
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        }));
        const { setConversationMessages } = useChatStore.getState();
        setConversationMessages(convId, formatted);
      }

      // Verificar metadata de tool execution
      if (convId && updatedMessages && updatedMessages.length > 0) {
        const lastAssistant = [...updatedMessages].reverse().find(m => m.role === 'ASSISTANT');
        if (lastAssistant?.metadata) {
          const metadata = lastAssistant.metadata as any;
          if (metadata.tool_success !== undefined) {
            setToolLogs(metadata.execution_logs || []);
            if (metadata.tool_success) setToolStatus('success');
            else { setToolStatus('error'); setToolError(metadata.tool_message || 'Erro desconhecido'); }
          } else {
            setToolStatus('idle');
          }
        }
      }

    } catch (error) {
      console.error('[ChatPage] Error sending message:', error);

      // ✅ Resetar loading em caso de erro também
      setAssistantTyping(false);

      // Atualizar indicador para erro
      if (toolStatus === 'executing') {
        setToolStatus('error');
        setToolError(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      }

      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    }
  };

  // Handle new conversation
  const handleNewConversation = async () => {
    if (!user) return;

    try {
      const newConv = await createNewConversation(user.id, 'web'); // Web context
      setActiveConversationId(newConv.id);

      toast({
        title: '✨ Nova Conversa',
        description: 'Conversa criada com sucesso!',
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar nova conversa.',
        variant: 'destructive',
      });
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      // Delete messages first
      await supabase
        .from('ChatMessage')
        .delete()
        .eq('conversationId', conversationId);

      // Delete conversation
      await supabase
        .from('ChatConversation')
        .delete()
        .eq('id', conversationId);

      // Reload conversations
      await loadConversations(user.id, 'web');

      // Clear active if deleted
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }

      toast({
        title: '🗑️ Conversa deletada',
        description: 'A conversa foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a conversa.',
        variant: 'destructive',
      });
    }
  };

  // Load conversation messages
  const loadConversationMessages = async (conversationId: string) => {
    setActiveConversationId(conversationId);

    // Carregar mensagens do banco
    try {
      const { data: messages } = await supabase
        .from('ChatMessage')
        .select('*')
        .eq('conversationId', conversationId)
        .order('createdAt', { ascending: true });

      if (messages && messages.length > 0) {
        // Converter para formato do store
        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        }));

        // Atualizar store com mensagens
        const { setConversationMessages } = useChatStore.getState();
        setConversationMessages(conversationId, formattedMessages);
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as mensagens.',
        variant: 'destructive',
      });
    }
  };

  // Don't render until authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Sidebar */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onClose={() => setSidebarOpen(false)}
        onNewConversation={handleNewConversation}
        onSelectConversation={loadConversationMessages}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Menu Toggle Button (visible when sidebar is closed) */}
        {!sidebarOpen && (
          <div className="absolute top-4 left-4 z-10">
            <MenuToggleButton onClick={() => setSidebarOpen(true)} />
          </div>
        )}

        {/* Chat Modal Manager */}
        <ChatModalManager
          autoDetect={true}
          allowManualSwitch={true}
          initialModal="chat"
          userId={user.id}
          conversationId={activeConversationId || undefined}
          onModalChange={handleModalChange}
          onSendMessage={handleSendMessage}
          className="h-full w-full"
          onCreateConversation={async () => {
            if (!user) return null;
            try {
              const newConv = await conversationsApi.createConversation(user.id, `Conversa ${new Date().toLocaleString('pt-BR')}`, 'web');
              setActiveConversationId(newConv.id);
              const { addConversation } = useChatStore.getState();
              addConversation({ id: newConv.id, title: newConv.title, createdAt: newConv.createdAt, messages: [] });
              return newConv.id;
            } catch { return null; }
          }}
        />
      </div>

      {/* Tool Execution Indicator */}
      <ToolExecutionIndicator
        status={toolStatus}
        action={toolAction}
        errorMessage={toolError}
        logs={toolLogs}
        onDismiss={() => setToolStatus('idle')}
      />

      {/* Admin Badge - mostra se é ADMIN ou SUPER_ADMIN */}
      <AdminBadge />
    </div>
  );
}

