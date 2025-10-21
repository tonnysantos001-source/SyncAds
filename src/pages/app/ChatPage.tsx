import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Paperclip, Send, User, Bot, PanelLeftClose, PanelLeftOpen, Trash2, Plus } from 'lucide-react';
import Textarea from 'react-textarea-autosize';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useCampaignsStore } from '@/store/campaignsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { sendSecureMessage } from '@/lib/api/chat';
import { detectCampaignIntent, cleanCampaignBlockFromResponse, campaignSystemPrompt } from '@/lib/ai/campaignParser';
import { 
  AdminTools, 
  adminSystemPrompt, 
  detectAdminSQL, 
  detectAdminAnalyze, 
  detectAdminIntegration, 
  detectAdminMetrics,
  cleanAdminBlocksFromResponse 
} from '@/lib/ai/adminTools';
import {
  detectIntegrationCommand,
  cleanIntegrationBlocks,
  integrationSystemPrompt
} from '@/lib/integrations/integrationParsers';
import {
  IntegrationTools,
  integrationControlPrompt,
  detectIntegrationAction,
  cleanIntegrationBlocksFromResponse,
  detectAuditIntentFromText
} from '@/lib/ai/integrationTools';
import { integrationsService } from '@/lib/integrations/integrationsService';
import { INTEGRATIONS_CONFIG } from '@/lib/integrations/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const quickSuggestions = [
  "Criar campanha de Facebook Ads",
  "Analisar performance da última semana",
  "Sugerir otimizações"
];

const MAX_CHARS = 500;

const ChatPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Auth store
  const user = useAuthStore((state) => state.user);
  
  // Chat store
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const isAssistantTyping = useChatStore((state) => state.isAssistantTyping);
  const setAssistantTyping = useChatStore((state) => state.setAssistantTyping);
  const addMessage = useChatStore((state) => state.addMessage);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const createNewConversation = useChatStore((state) => state.createNewConversation);
  
  // Campaigns store
  const addCampaign = useCampaignsStore((state) => state.addCampaign);
  
  // Settings store
  const aiSystemPrompt = useSettingsStore((state) => state.aiSystemPrompt);
  const aiInitialGreetings = useSettingsStore((state) => state.aiInitialGreetings);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [activeConversation?.messages, isAssistantTyping]);

  // Enviar fala inicial quando conversa nova for criada
  useEffect(() => {
    if (activeConversation && activeConversation.messages.length === 0 && aiInitialGreetings.length > 0) {
      // Escolher uma fala aleatória
      const randomIndex = Math.floor(Math.random() * aiInitialGreetings.length);
      const greeting = aiInitialGreetings[randomIndex];
      
      // Adicionar a fala inicial como mensagem do assistente
      setTimeout(() => {
        if (user) {
          addMessage(user.id, activeConversationId!, { 
            id: `greeting-${Date.now()}`, 
            role: 'assistant', 
            content: greeting 
          });
        }
      }, 500); // Pequeno delay para parecer mais natural
    }
  }, [activeConversationId, activeConversation?.messages.length]);

  const handleSend = async () => {
    if (input.trim() === '' || !activeConversationId || input.length > MAX_CHARS) return;

    const userMessage = input;
    if (user) {
      addMessage(user.id, activeConversationId, { id: `msg-${Date.now()}`, role: 'user', content: userMessage });
    }
    setInput('');
    
    setAssistantTyping(true);
    
    try {
      // Preparar histórico de mensagens para contexto
      const conversation = conversations.find((c: any) => c.id === activeConversationId);
      const systemMessage = adminSystemPrompt + '\n\n' + campaignSystemPrompt + '\n\n' + integrationSystemPrompt + '\n\n' + integrationControlPrompt + '\n\n' + aiSystemPrompt;
      
      const conversationHistory = (conversation?.messages || []).slice(-20).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Chamar Edge Function segura (protege API keys)
      const result = await sendSecureMessage(userMessage, conversationHistory, systemMessage);
      const response = result.response;

      // Detectar se a IA quer criar uma campanha
      const campaignIntent = detectCampaignIntent(response);
      
      if (campaignIntent) {
        try {
          if (user) {
            await addCampaign(user.id, {
              name: campaignIntent.data.name,
              platform: campaignIntent.data.platform,
              status: 'Pausada',
            budgetTotal: campaignIntent.data.budgetTotal,
            budgetSpent: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            startDate: campaignIntent.data.startDate,
            endDate: campaignIntent.data.endDate || '',
            ctr: 0,
            cpc: 0,
          });
          
            toast({
              title: '🎉 Campanha Criada!',
              description: `A campanha "${campaignIntent.data.name}" foi criada com sucesso.`,
            });
          }
        } catch (error) {
          console.error('Error creating campaign from AI:', error);
          toast({
            title: 'Erro ao criar campanha',
            description: 'Não foi possível criar a campanha automaticamente.',
            variant: 'destructive',
          });
        }
      }

      // Variável para armazenar resultado de auditoria
      let auditResult = '';

      // Processar comandos administrativos (se usuário tem permissão)
      if (user) {
        const adminTools = new AdminTools(user.id);

        // Detectar e executar SQL
        const sqlCommand = detectAdminSQL(response);
        if (sqlCommand) {
          const result = await adminTools.executeSQL(sqlCommand);
          toast({
            title: result.success ? '✅ SQL Executado' : '❌ Erro SQL',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
          });
        }

        // Detectar e executar análise de sistema
        const analyzeCommand = detectAdminAnalyze(response);
        if (analyzeCommand) {
          const result = await adminTools.analyzeSystem(analyzeCommand.type, analyzeCommand.period);
          toast({
            title: result.success ? '📊 Análise Concluída' : '❌ Erro',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
          });
        }

        // Detectar e executar gerenciamento de integração
        const integrationCommand = detectAdminIntegration(response);
        if (integrationCommand) {
          const result = await adminTools.manageIntegration(
            integrationCommand.action,
            integrationCommand.platform,
            integrationCommand.credentials
          );
          toast({
            title: result.success ? '🔗 Integração Atualizada' : '❌ Erro',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
          });
        }

        // Detectar e executar obtenção de métricas
        const metricsCommand = detectAdminMetrics(response);
        if (metricsCommand) {
          const result = await adminTools.getMetrics(
            metricsCommand.metric,
            metricsCommand.aggregation,
            metricsCommand.groupBy
          );
          toast({
            title: result.success ? '📈 Métricas Obtidas' : '❌ Erro',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
          });
        }

        // Detectar e executar ações de integração (auditoria, teste, etc)
        let integrationAction = detectIntegrationAction(response);
        
        // Fallback: se não detectou bloco mas mensagem indica auditoria
        if (!integrationAction) {
          integrationAction = detectAuditIntentFromText(userMessage, response);
        }
        
        if (integrationAction) {
          const integrationTools = new IntegrationTools(user.id);
          let result;

          switch (integrationAction.action) {
            case 'audit':
              if (integrationAction.platform) {
                result = await integrationTools.auditIntegration(integrationAction.platform);
              }
              break;
            case 'audit_all':
              result = await integrationTools.auditAll();
              break;
            case 'list_status':
              result = await integrationTools.listStatus();
              break;
            case 'test':
            case 'capabilities':
            case 'diagnose':
              result = {
                success: true,
                message: `Ação "${integrationAction.action}" detectada. Implementação em andamento.`,
              };
              break;
          }

          if (result) {
            // Armazenar resultado para adicionar depois
            auditResult = '\n\n' + result.message;

            toast({
              title: result.success ? '✅ Ação Executada' : '❌ Erro',
              description: result.success ? 'Auditoria concluída com sucesso' : result.error || 'Erro ao executar ação',
              variant: result.success ? 'default' : 'destructive',
            });
          }
        }
      }

      // Processar comandos de integração
      const integrationCommand = detectIntegrationCommand(response);
      if (integrationCommand && user) {
        try {
          if (integrationCommand.action === 'connect') {
            const { authUrl } = await integrationsService.generateOAuthUrl(integrationCommand.slug, user.id);
            const config = INTEGRATIONS_CONFIG[integrationCommand.slug];
            
            // Adicionar mensagem com link
            if (user) {
              addMessage(user.id, activeConversationId, {
                id: `msg-${Date.now() + 1}`,
                role: 'assistant',
                content: `Para conectar ${config.name}, clique no link abaixo:\n\n🔗 [Autorizar ${config.name}](${authUrl})\n\nO link abrirá em uma nova aba para você autorizar o acesso.`
              });
            }
            
            // Abrir link automaticamente
            window.open(authUrl, '_blank');
            
            toast({
              title: '🔗 Link de Autorização',
              description: `Clique no link para conectar ${config.name}`,
            });
            return; // Não adicionar resposta duplicada
          } else if (integrationCommand.action === 'disconnect') {
            await integrationsService.disconnect(user.id, integrationCommand.slug);
            const config = INTEGRATIONS_CONFIG[integrationCommand.slug];
            toast({
              title: '✅ Desconectado',
              description: `${config.name} foi desconectado com sucesso.`,
            });
          } else if (integrationCommand.action === 'status') {
            if (integrationCommand.slug) {
              const status = await integrationsService.getIntegrationStatus(user.id, integrationCommand.slug);
              const config = INTEGRATIONS_CONFIG[integrationCommand.slug];
              toast({
                title: `${config.name}`,
                description: status?.isConnected ? '✅ Conectado' : '❌ Não conectado',
              });
            } else {
              const integrations = await integrationsService.listIntegrations(user.id);
              const connected = integrations.filter(i => i.isConnected).length;
              toast({
                title: '📊 Status das Integrações',
                description: `${connected} de ${integrations.length} integrações conectadas`,
              });
            }
          }
        } catch (error: any) {
          console.error('Erro ao processar integração:', error);
          
          // Adicionar mensagem de erro formatada no chat
          if (user) {
            addMessage(user.id, activeConversationId, {
              id: `msg-${Date.now() + 2}`,
              role: 'assistant',
              content: `❌ **Erro ao conectar integração**\n\n${error.message || 'Erro ao processar comando de integração'}`
            });
          }
          
          toast({
            title: '❌ Erro na Integração',
            description: 'Verifique as instruções no chat',
            variant: 'destructive',
          });
        }
      }

      // Limpar blocos de código da resposta antes de exibir
      let cleanedResponse = cleanCampaignBlockFromResponse(response);
      cleanedResponse = cleanAdminBlocksFromResponse(cleanedResponse);
      cleanedResponse = cleanIntegrationBlocks(cleanedResponse);
      cleanedResponse = cleanIntegrationBlocksFromResponse(cleanedResponse);
      
      // Adicionar resposta da IA (com resultado de auditoria se houver)
      if (user) {
        addMessage(user.id, activeConversationId, { 
          id: `msg-${Date.now() + 1}`, 
          role: 'assistant', 
          content: cleanedResponse + auditResult 
        });
      }
    } catch (error: any) {
      console.error('Erro ao chamar IA:', error);
      toast({
        title: 'Erro ao gerar resposta',
        description: error.message || 'Não foi possível obter resposta da IA. Verifique sua chave de API.',
        variant: 'destructive',
      });
      
      // Adicionar mensagem de erro no chat
      if (user) {
        addMessage(user.id, activeConversationId, { 
          id: `msg-${Date.now() + 1}`, 
          role: 'assistant', 
          content: '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se sua chave de API está configurada corretamente nas configurações.' 
        });
      }
    } finally {
      setAssistantTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "Arquivo Selecionado",
        description: `O arquivo "${file.name}" está pronto para ser enviado (simulação).`,
        variant: "info",
      });
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDeleteConversation = (id: string) => {
    deleteConversation(id);
    toast({
        title: "Conversa Apagada",
        description: "A conversa foi removida do seu histórico.",
        variant: "destructive",
    });
  };

  return (
    <div className="flex h-full">
      {/* Conversations Sidebar */}
      <Card className={cn("transition-all duration-300 ease-in-out hidden sm:block border-0", sidebarOpen ? "w-80" : "w-0 min-w-0 opacity-0 overflow-hidden")}>

        <CardContent className="p-2 h-full overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between p-2 mb-2">
            <h2 className="text-lg font-semibold">Conversas</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                createNewConversation();
                toast({
                  title: "Nova conversa criada!",
                  description: "Comece a conversar com a IA.",
                });
              }}
              title="Nova Conversa"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <div key={conv.id} className="group relative">
                <Button
                  variant={activeConversationId === conv.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start truncate pr-8"
                  onClick={() => setActiveConversationId(conv.id)}
                >
                  {conv.title}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar conversa?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem a certeza que quer apagar a conversa "{conv.title}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleDeleteConversation(conv.id)}
                      >
                        Apagar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col sm:pl-4 h-full">
        <Card className="flex-1 flex flex-col overflow-hidden rounded-none sm:rounded-2xl border-0">
          <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute top-20 left-2 hidden sm:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{sidebarOpen ? 'Fechar painel' : 'Abrir painel'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {activeConversation ? (
              <>
                {activeConversation.messages.map((message) => (
                  <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot size={18} /></AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`rounded-2xl p-3 max-w-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback><User size={18} /></AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isAssistantTyping && (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot size={18} /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl p-3 bg-muted flex items-center space-x-1">
                      <span className="h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 bg-foreground rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Selecione ou crie uma conversa para começar.</p>
              </div>
            )}
          </div>
          
          <div className="p-2 sm:p-4 border-t bg-card/50 backdrop-blur-sm">
            <div className="hidden sm:flex gap-2 mb-2">
              {quickSuggestions.map(s => (
                <Button key={s} variant="outline" size="sm" onClick={() => handleSuggestionClick(s)}>
                  {s}
                </Button>
              ))}
            </div>
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="w-full resize-none rounded-lg border bg-background p-3 pr-24 min-h-[48px]"
                minRows={1}
                maxRows={5}
                maxLength={MAX_CHARS}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <Button type="button" size="icon" variant="ghost" onClick={handleAttachClick}>
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button type="submit" size="icon" onClick={handleSend} disabled={input.trim() === ''}>
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
             <p className={cn("text-xs text-right mt-1", input.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground")}>
                {input.length} / {MAX_CHARS}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;
