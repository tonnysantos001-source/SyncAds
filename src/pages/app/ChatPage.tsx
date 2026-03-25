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
import { conversationsApi, chatApi } from '@/lib/api';

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

    // Detectar se é comando de browser automation
    const browserTriggers = ['abr', 'vá', 'acesse', 'entr', 'cliqu', 'naveg', 'visit'];
    const isBrowserCommand = browserTriggers.some(trigger => message.toLowerCase().includes(trigger));

    if (isBrowserCommand) {
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
      // 1. ✅ PRIMEIRO: Garantir que existe uma conversa ativa
      let convId = activeConversationId;
      if (!convId && user) {
        console.log('[ChatPage] Sem conversa ativa - criando automaticamente...');
        try {
          const newConv = await createNewConversation(
            user.id,
            `Conversa ${new Date().toLocaleString('pt-BR')}`,
            'web'
          );
          if (newConv?.id) {
            convId = newConv.id;
            console.log('[ChatPage] Conversa criada:', convId);
          }
        } catch (convError) {
          console.error('[ChatPage] Erro ao criar conversa:', convError);
          throw new Error('Não foi possível criar uma conversa.');
        }
      }

      if (!convId) throw new Error('Nenhuma conversa disponível.');

      // 2. ✅ IMEDIATAMENTE: Adicionar mensagem do usuário ao estado local (aparece na tela AGORA)
      const { addMessage } = useChatStore.getState();
      const userMsgId = crypto.randomUUID();
      const tempUserMessage = {
        id: userMsgId,
        role: 'user' as const,
        content: message,
        timestamp: new Date(),
      };
      await addMessage(user!.id, convId, tempUserMessage as any);

      // 3. ✅ Só agora ativar loading (a mensagem do usuário já está visível)
      setAssistantTyping(true);

      // 4. Enviar para IA e obter resposta (IA salva do lado do servidor)
      const response = await chatService.sendMessage(message, convId);

      // Resetar loading após receber resposta
      setAssistantTyping(false);

      // 5. ✅ PRIMEIRO: Usar a resposta já retornada pelo chatService (mais rápido)
      // Isso funciona para respostas normais E para imagens geradas pelo interceptor
      if (response && typeof response === 'string' && response.trim()) {
        const aiMessage = {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: response,
          timestamp: new Date(),
        };
        await addMessage(user!.id, convId, aiMessage as any);
        setToolStatus('idle');
      } else {
        // 6. Fallback: Buscar a última resposta do assistente no banco
        const { data: latestMessages } = await supabase
          .from('ChatMessage')
          .select('*')
          .eq('conversationId', convId)
          .eq('role', 'ASSISTANT')
          .order('createdAt', { ascending: false })
          .limit(1);

        if (latestMessages && latestMessages.length > 0) {
          const aiMsg = latestMessages[0];
          const aiMessage = {
            id: aiMsg.id,
            role: 'assistant' as const,
            content: aiMsg.content,
            timestamp: new Date(aiMsg.createdAt),
          };
          await addMessage(user!.id, convId, aiMessage as any);

          // Verificar metadata de tool execution
          if (aiMsg.metadata) {
            const metadata = aiMsg.metadata as any;
            if (metadata.tool_success !== undefined) {
              setToolLogs(metadata.execution_logs || []);
              if (metadata.tool_success) setToolStatus('success');
              else { setToolStatus('error'); setToolError(metadata.tool_message || 'Erro desconhecido'); }
            } else {
              setToolStatus('idle');
            }
          }
        }
      }



    } catch (error) {
      console.error('[ChatPage] Error sending message:', error);

      // Resetar loading em caso de erro também
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
      const newConv = await createNewConversation(user.id, undefined, 'web'); // Web context is the 3rd param
      if (newConv?.id) {
        setActiveConversationId(newConv.id);
      }

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
          onOpenSidebar={() => setSidebarOpen(true)}
          showSidebarToggle={!sidebarOpen}
          onExit={() => navigate('/reports/overview')}
          onCreateConversation={async () => {
            if (!user) return null;
            try {
              const newConv = await createNewConversation(user.id, `Conversa ${new Date().toLocaleString('pt-BR')}`, 'web');
              return newConv?.id || null;
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

