import { useState, useEffect, useRef } from 'react';
import { Loader2, Send, Shield, Sparkles, PlusCircle, Trash2, Menu, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  timestamp: Date;
  metadata?: {
    stats?: any;
    query?: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const ADMIN_SYSTEM_PROMPT = `Você é um assistente de IA para administradores. Responda de forma clara e objetiva.`;

export default function AdminChatPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar lista de conversas antigas
  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ChatConversation')
        .select('id, title, createdAt, updatedAt')
        .eq('userId', user.id)
        .order('updatedAt', { ascending: false })
        .limit(20);

      if (error) throw error;

      setConversations(data || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  // Carregar mensagens de uma conversa específica (SOB DEMANDA)
  const loadConversationMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('ChatMessage')
        .select('id, role, content, createdAt')
        .eq('conversationId', convId)
        .order('createdAt', { ascending: true });

      if (error) throw error;

      // Converter para formato Message
      const loadedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'USER' | 'ASSISTANT' | 'SYSTEM',
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));

      setMessages(loadedMessages);
      setConversationId(convId);
      
      console.log(`✅ ${loadedMessages.length} mensagens carregadas da conversa ${convId}`);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar mensagens.',
        variant: 'destructive',
      });
    }
  };

  // Deletar uma conversa específica
  const deleteConversation = async (convId: string) => {
    try {
      // Deletar mensagens primeiro
      await supabase
        .from('ChatMessage')
        .delete()
        .eq('conversationId', convId);

      // Deletar conversa
      await supabase
        .from('ChatConversation')
        .delete()
        .eq('id', convId);

      // Se for a conversa atual, limpar
      if (conversationId === convId) {
        setMessages([]);
        setConversationId(null);
      }

      // Recarregar lista
      await loadConversations();

      toast({
        title: '✅ Conversa deletada!',
        description: 'Conversa removida com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao deletar conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar conversa.',
        variant: 'destructive',
      });
    }
  };

  // Inicializar: apenas carregar conversas existentes (NÃO criar nova!)
  useEffect(() => {
    const initConversation = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Usuário não autenticado:', authError);
          toast({
            title: 'Erro de autenticação',
            description: 'Você precisa fazer login novamente.',
            variant: 'destructive',
          });
          window.location.href = '/login';
          return;
        }

        // APENAS carregar conversas existentes (NÃO criar nova!)
        await loadConversations();
        
        // Se houver conversas, carregar a primeira automaticamente
        const { data, error } = await supabase
          .from('ChatConversation')
          .select('id, title, createdAt, updatedAt')
          .eq('userId', user.id)
          .order('updatedAt', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          console.log('✅ Carregando conversa existente:', data.id);
          setConversationId(data.id);
          await loadConversationMessages(data.id);
        } else {
          console.log('📋 Nenhuma conversa existente. Use "Nova Conversa" para começar.');
        }
      } catch (error) {
        console.error('Erro ao inicializar conversa:', error);
      }
    };

    initConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const executeAdminQuery = async (userMessage: string, convId: string): Promise<string> => {
    try {
      // Chamar Edge Function de chat-stream (nova com memória)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // URL hardcoded para evitar problema de env vars (usando função chat-enhanced com persistência e personalidade)
      const chatUrl = 'https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-enhanced';
      
      // Converter mensagens para formato conversationHistory
      const history = messages.map(msg => ({
        role: msg.role.toLowerCase(), // USER, ASSISTANT, SYSTEM → user, assistant, system
        content: msg.content
      }));
      
      console.log('🌐 Calling chat-stream (Admin):', chatUrl);
      console.log('📜 History length:', history.length);
      
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E'
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: convId,
          conversationHistory: history, // ✅ ENVIA HISTÓRICO COMPLETO
          systemPrompt: undefined // Usa o padrão da função
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar mensagem');
      }

      const data = await response.json();
      console.log('📦 Response data:', data);
      
      // Verificar se houve erro na resposta
      if (data.error) {
        console.error('❌ Erro na resposta:', data.error);
        return `⚠️ ${data.response || data.error}`;
      }
      
      // Retornar resposta ou mensagem de fallback
      if (!data.response || data.response === 'Sem resposta da IA') {
        console.error('❌ IA não retornou resposta válida');
        return '⚠️ IA não configurada ou sem resposta. Configure uma IA em Configurações > IA Global.';
      }
      
      return data.response;
      
    } catch (error: any) {
      console.error('Admin chat error:', error);
      return `❌ Erro: ${error.message}`;
    }
  };

  // Função para limpar mensagens
  const handleClearMessages = async () => {
    if (!conversationId) return;
    
    try {
      // Deletar todas mensagens da conversa atual
      await supabase
        .from('ChatMessage')
        .delete()
        .eq('conversationId', conversationId);

      // Limpar mensagens na tela
      setMessages([]);
      
      toast({
        title: '✅ Mensagens limpas!',
        description: 'Chat limpo com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao limpar mensagens:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível limpar mensagens.',
        variant: 'destructive',
      });
    }
  };

  // Função para criar nova conversa
  const handleNewConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar organizationId do usuário
      const { data: userData } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', user.id)
        .single();

      if (!userData?.organizationId) {
        throw new Error('Usuário sem organização');
      }

      // Criar nova conversa
      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('ChatConversation')
        .insert({
          id: newId,
          userId: user.id,
          organizationId: userData.organizationId,
          title: '🆕 Nova Conversa',
          createdAt: now,
          updatedAt: now
        });

      if (error) throw error;

      // Limpar mensagens e atualizar ID
      setMessages([]);
      setConversationId(newId);
      
      // Recarregar lista de conversas
      await loadConversations();
      
      toast({
        title: '✅ Nova conversa criada!',
        description: 'Comece um novo chat do zero.',
      });
    } catch (error: any) {
      console.error('Erro ao criar nova conversa:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar nova conversa.',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !conversationId) {
      console.log('Botão desabilitado:', {
        inputTrim: !input.trim(),
        isLoading,
        conversationId: !!conversationId
      });
      return;
    }

    console.log('Enviando mensagem:', input.trim());
    const userContent = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Verificar se tem conversationId
      if (!conversationId) {
        throw new Error('Conversa não inicializada');
      }

      const activeConvId = conversationId;
      console.log('Active conversation ID:', activeConvId);

      // Adicionar mensagem do usuário ao estado local (UI imediata)
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'USER',
        content: userContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // Executar query administrativa (Edge Function cuida de tudo)
      const response = await executeAdminQuery(userContent, activeConvId);

      // Adicionar resposta ao estado local
      const assistantMessage: Message = {
        id: `temp-${Date.now() + 1}`,
        role: 'ASSISTANT',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('ERRO COMPLETO:', error);

      // Mostrar erro visual no chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'ASSISTANT',
        content: `❌ ERRO DETALHADO:\n\n${error.message}\n\n${error.stack || 'Sem stack trace'}\n\n${JSON.stringify(error, null, 2)}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Erro ao processar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="h-[calc(100vh-80px)] flex">
        {/* SIDEBAR - Conversas Antigas */}
        <div className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Conversas</h2>
              <Button
                onClick={() => setIsSidebarOpen(false)}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleNewConversation}
              className="w-full gap-2"
              size="sm"
            >
              <PlusCircle className="h-4 w-4" />
              Nova Conversa
            </Button>
          </div>

          {/* Lista de Conversas */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${
                  conversationId === conv.id ? 'bg-blue-50 border border-blue-200' : 'bg-white'
                }`}
                onClick={() => loadConversationMessages(conv.id)}
              >
                <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {conv.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(conv.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* ÁREA PRINCIPAL DO CHAT */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!isSidebarOpen && (
                  <Button
                    onClick={() => setIsSidebarOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Chat Administrativo</h1>
                  <p className="text-sm text-gray-500">Chat com IA</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleClearMessages}
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:bg-red-50 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  Limpar Chat
                </Button>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[80%] ${
                  message.role === 'USER'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : message.role === 'SYSTEM'
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                    : 'bg-white'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      {message.role === 'ASSISTANT' && (
                        <Shield className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                      )}
                      {message.role === 'SYSTEM' && (
                        <Sparkles className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                      )}
                      <div className={`flex-1 whitespace-pre-wrap break-words text-sm ${
                        message.role === 'USER' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                    <div className={`text-xs mt-2 ${
                      message.role === 'USER' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('pt-BR')}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-500">Processando...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-white/80 backdrop-blur-xl">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Digite seu comando... (Ex: '/help', 'quantos usuários temos?', '/stats')"
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || !conversationId}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
