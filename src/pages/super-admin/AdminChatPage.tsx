import { useState, useEffect, useRef } from 'react';
import { Loader2, Send, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    stats?: any;
    query?: string;
  };
}

const ADMIN_SYSTEM_PROMPT = `Você é um assistente de IA para administradores. Responda de forma clara e objetiva.`;

export default function AdminChatPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar ou criar conversa administrativa
  useEffect(() => {
    const initConversation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Buscar conversa admin existente
        const { data: existingConv } = await supabase
          .from('ChatConversation')
          .select('*')
          .eq('userId', user.id)
          .eq('title', '🛡️ Admin Chat')
          .single();

        if (existingConv) {
          setConversationId(existingConv.id);
          
          // Carregar mensagens
          const { data: msgs } = await supabase
            .from('ChatMessage')
            .select('id, role, content, createdAt, userId')
            .eq('conversationId', existingConv.id)
            .order('createdAt', { ascending: true });

          if (msgs) {
            setMessages(msgs.map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant' | 'system',
              content: m.content,
              timestamp: new Date(m.createdAt)
            })));
          }
        } else {
          // Criar nova conversa admin
          const { data: newConv } = await supabase
            .from('ChatConversation')
            .insert({
              userId: user.id,
              title: '🛡️ Admin Chat'
            })
            .select()
            .single();

          if (newConv) {
            setConversationId(newConv.id);
          }
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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: convId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar mensagem');
      }

      const data = await response.json();
      return data.response || 'Sem resposta';
      
    } catch (error: any) {
      console.error('Admin chat error:', error);
      return `❌ Erro: ${error.message}`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Usar ID fixo para admin chat (ou criar se não existir)
      let activeConvId = conversationId || 'admin-chat-default';

      // Adicionar mensagem do usuário ao estado local (UI imediata)
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: userContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // Executar query administrativa (Edge Function cuida de tudo)
      const response = await executeAdminQuery(userContent, activeConvId);

      // Adicionar resposta ao estado local
      const assistantMessage: Message = {
        id: `temp-${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
        
    } catch (error: any) {
      console.error('ERRO COMPLETO:', error);
      
      // Mostrar erro visual no chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
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
      <div className="h-[calc(100vh-80px)] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Chat Administrativo</h1>
                <p className="text-sm text-gray-500">Chat com IA</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">
              <Sparkles className="h-3 w-3 mr-1" />
              Online
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : message.role === 'system'
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                  : 'bg-white'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <Shield className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    )}
                    {message.role === 'system' && (
                      <Sparkles className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 whitespace-pre-wrap break-words text-sm">
                      {message.content}
                    </div>
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-white/70' : 'text-gray-500'
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
                  handleSend();
                }
              }}
              placeholder="Digite seu comando... (Ex: 'stats gerais', 'audite o sistema', 'clientes ativos')"
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
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
    </SuperAdminLayout>
  );
}
