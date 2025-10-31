import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Send, User, Bot, Menu, X, MessageSquare, Trash2, Plus, Sparkles, Loader2, Mic } from 'lucide-react';
import Textarea from 'react-textarea-autosize';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useCampaignsStore } from '@/store/campaignsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useChatSync } from '@/hooks/chat/useChatSync';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { sendSecureMessage } from '@/lib/api/chat';
import { supabase } from '@/lib/supabase';
import { detectCampaignIntent, cleanCampaignBlockFromResponse, campaignSystemPrompt } from '@/lib/ai/campaignParser';
import { sarcasticSystemPrompt, getRandomGreeting } from '@/lib/ai/sarcasticPersonality';
import { WebSearchIndicator, SearchSourcesIndicator } from '@/components/chat/WebSearchIndicator';
import { IntegrationConnectionCard } from '@/components/chat/IntegrationConnectionCard';
import { ZipDownloadCard, ZipDownloadList } from '@/components/chat/ZipDownloadCard';
import { SuperAIProgress, SuperAIExecution } from '@/components/chat/SuperAIProgress';
import AiThinkingIndicator from '@/components/ai/AiThinkingIndicator';
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
  const [globalAiConfig, setGlobalAiConfig] = useState<{
    systemPrompt: string;
    initialGreetings: string[];
  } | null>(null);

  // Estados para pesquisa web
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [webSearchResults, setWebSearchResults] = useState<any[]>([]);
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [searchSources, setSearchSources] = useState<string[]>([]);
  const [zipDownloads, setZipDownloads] = useState<any[]>([]);
  const [superAIExecutions, setSuperAIExecutions] = useState<any[]>([]);

  // Estados para indicador de pensamento da IA (consistência com AdminChatPage)
  const [currentTool, setCurrentTool] = useState<'web_search' | 'web_scraping' | 'python_exec' | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string>('');
  const [aiSources, setAiSources] = useState<string[]>([]);

  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  // Settings store (fallback se não houver IA global)
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

  // Carregar configuração da IA Global (sem organizações)
  useEffect(() => {
    const loadGlobalAiConfig = async () => {
      if (!user) return;

      try {
        // Buscar QUALQUER IA global ativa (sistema simplificado)
        const { data: globalAi, error: aiError } = await supabase
          .from('GlobalAiConnection')
          .select('id, systemPrompt, initialGreetings')
          .eq('isActive', true)
          .limit(1)
          .single();

        if (aiError) {
          console.error('Erro ao buscar IA:', aiError);
          return;
        }

        const globalAiId = globalAi?.id;

        if (globalAiId) {
          // Buscar configuração da IA
          const { data: aiConfig, error: aiError } = await supabase
            .from('GlobalAiConnection')
            .select('systemPrompt, initialGreetings')
            .eq('id', globalAiId)
            .single();

          if (aiError) {
            console.error('Erro ao buscar config da IA:', aiError);
            return;
          }

          if (aiConfig) {
            setGlobalAiConfig({
              systemPrompt: aiConfig.systemPrompt || aiSystemPrompt,
              initialGreetings: aiConfig.initialGreetings || aiInitialGreetings,
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar IA Global:', error);
      }
    };

    loadGlobalAiConfig();
  }, [user?.id]); // ✅ Removido organizationId

  // Mensagem inicial sarcástica
  useEffect(() => {
    if (activeConversation && activeConversation.messages.length === 0) {
      const greeting = getRandomGreeting();
      setTimeout(() => {
        if (user) {
          addMessage(user.id, activeConversationId!, {
            id: `greeting-${Date.now()}`,
            role: 'assistant',
            content: greeting
          });
        }
      }, 500);
    }
  }, [activeConversationId, activeConversation?.messages.length]);

  // Função para detectar e processar downloads de ZIP
  const processZipDownloads = (content: string) => {
    // Detectar URLs de download de ZIP nas respostas da IA
    const zipDownloadRegex = /ZIP_DOWNLOAD:\s*({[^}]+})/g;
    const matches = content.match(zipDownloadRegex);

    if (matches) {
      matches.forEach(match => {
        try {
          const jsonStr = match.replace('ZIP_DOWNLOAD:', '').trim();
          const downloadData = JSON.parse(jsonStr);

          // Adicionar à lista de downloads
          setZipDownloads(prev => [...prev, downloadData]);
        } catch (error) {
          console.error('Erro ao processar download ZIP:', error);
        }
      });
    }

    // Remover blocos ZIP_DOWNLOAD do conteúdo exibido
    return content.replace(zipDownloadRegex, '').trim();
  };

  // Função para detectar e processar execuções super inteligentes
  const processSuperAIExecutions = (content: string) => {
    // Detectar execuções de ferramentas super inteligentes
    const superAIRegex = /SUPER_AI_EXECUTION:\s*({[^}]+})/g;
    const matches = content.match(superAIRegex);

    if (matches) {
      matches.forEach(match => {
        try {
          const jsonStr = match.replace('SUPER_AI_EXECUTION:', '').trim();
          const executionData = JSON.parse(jsonStr);

          // Adicionar à lista de execuções
          setSuperAIExecutions(prev => [...prev, executionData]);
        } catch (error) {
          console.error('Erro ao processar execução Super AI:', error);
        }
      });
    }

    // Remover blocos SUPER_AI_EXECUTION do conteúdo exibido
    return content.replace(superAIRegex, '').trim();
  };

  const handleSend = async () => {
    if (input.trim() === '' || !activeConversationId || input.length > MAX_CHARS) return;

    const userMessage = input;

    // Detectar qual ferramenta está sendo usada (consistência com AdminChatPage)
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('pesquis') || lowerMessage.includes('busca') ||
        lowerMessage.includes('google') || lowerMessage.includes('internet')) {
      setCurrentTool('web_search');
      let query = userMessage;
      if (lowerMessage.includes('pesquis')) {
        const match = userMessage.match(/pesquis[ae]\s+(.+)/i);
        query = match ? match[1] : userMessage;
      }
      setAiReasoning(`Pesquisando na web sobre: "${query}"`);
      setAiSources(['Google Search', 'Exa AI', 'Tavily']);
    } else if (lowerMessage.includes('baix') || lowerMessage.includes('rasp') ||
               lowerMessage.includes('scrape')) {
      setCurrentTool('web_scraping');
      const urlMatch = userMessage.match(/https?:\/\/[^\s]+/i);
      setAiReasoning(urlMatch ? `Raspando dados de: ${urlMatch[0]}` : 'Raspando dados...');
    } else if (lowerMessage.includes('python') || lowerMessage.includes('calcule') ||
               lowerMessage.includes('execute código')) {
      setCurrentTool('python_exec');
      setAiReasoning('Executando código Python para processar dados...');
    } else {
      setCurrentTool(null);
      setAiReasoning('Processando sua solicitação...');
      setAiSources([]);
    }

    if (user) {
      addMessage(user.id, activeConversationId, { id: `msg-${Date.now()}`, role: 'user', content: userMessage });
    }
    setInput('');

    // Colapsar sidebar ao enviar mensagem (comportamento ChatGPT)
    setSidebarOpen(false);

    setAssistantTyping(true);

    try {
      // Preparar histórico de mensagens para contexto
      const conversation = conversations.find((c: any) => c.id === activeConversationId);

      // Usar systemPrompt da IA Global se disponível, senão usar fallback sarcástico
      const customPrompt = globalAiConfig?.systemPrompt || sarcasticSystemPrompt;
      const systemMessage = adminSystemPrompt + '\n\n' + campaignSystemPrompt + '\n\n' + integrationSystemPrompt + '\n\n' + integrationControlPrompt + '\n\n' + customPrompt;

      const conversationHistory = (conversation?.messages || []).slice(-20).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Chamar Edge Function segura (protege API keys) - CRITICAL: passar conversationId!
      const result = await sendSecureMessage(userMessage, activeConversationId, conversationHistory, systemMessage);
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
                content: `Para conectar ${config.name}, clique no link abaixo:

🔗 [Autorizar ${config.name}](${authUrl})

O link abrirá em uma nova aba para você autorizar o acesso.`
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

      // Processar downloads de ZIP e execuções super inteligentes antes de limpar a resposta
      let processedResponse = processZipDownloads(response);
      processedResponse = processSuperAIExecutions(processedResponse);

      // Limpar blocos de código da resposta antes de exibir
      let cleanedResponse = cleanCampaignBlockFromResponse(processedResponse);
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

  // Função para iniciar gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);

        // Upload do áudio
        await uploadAudio(audioBlob);

        // Limpar stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "🎤 Gravando...",
        description: "Clique novamente para parar e enviar.",
      });
    } catch (error: any) {
      console.error('Erro ao iniciar gravação:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível acessar o microfone.",
        variant: "destructive",
      });
    }
  };

  // Função para parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Função para enviar áudio para Supabase Storage
  const uploadAudio = async (audioBlob: Blob) => {
    if (!user || !activeConversationId) return;

    try {
      toast({
        title: "📤 Enviando áudio...",
        description: "Aguarde...",
      });

      // Converter Blob para File
      const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
        type: 'audio/webm'
      });

      // Upload para Supabase Storage
      const fileName = `${user.id}/audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;

      const { data, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, audioFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      // Adicionar à mensagem
      const audioInfo = `[🎤 Mensagem de áudio](${publicUrl})`;
      setInput(prev => prev ? `${prev}\n\n${audioInfo}` : audioInfo);

      toast({
        title: "✅ Áudio enviado!",
        description: "O áudio foi adicionado à mensagem.",
      });

    } catch (error: any) {
      console.error('Erro ao enviar áudio:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível enviar o áudio.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !activeConversationId) return;

    try {
      toast({
        title: "📤 Upload iniciado",
        description: `Enviando "${file.name}"...`,
      });

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      // Salvar anexo na tabela ChatAttachment
      const { error: attachError } = await supabase
        .from('ChatAttachment')
        .insert({
          messageId: '', // Será atualizado quando a mensagem for criada
          fileName: file.name,
          fileType: file.type,
          fileUrl: publicUrl,
          fileSize: file.size
        });

      if (attachError) {
        console.error('Erro ao salvar anexo:', attachError);
      }

      // Adicionar URL da imagem/arquivo à mensagem
      const fileInfo = file.type.startsWith('image/')
        ? `![${file.name}](${publicUrl})`
        : `[${file.name}](${publicUrl})`;

      // Enviar mensagem com o arquivo
      const updatedInput = input ? `${input}\n\n${fileInfo}` : fileInfo;

      // Limpar input
      setInput('');

      // Simular envio da mensagem
      if (updatedInput.trim() && activeConversationId) {
        handleSend(); // Usar a função existente que já lida com o envio
      }

      toast({
        title: "✅ Arquivo enviado!",
        description: `${file.name} foi enviado com sucesso.`,
      });

    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "❌ Erro ao enviar arquivo",
        description: error.message || "Não foi possível enviar o arquivo.",
        variant: "destructive",
      });
    } finally {
      // Limpar input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Carregar lista de conversas
  const loadConversations = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('ChatConversation')
        .select('id, title, createdAt, updatedAt')
        .eq('userId', user.id)
        .order('updatedAt', { ascending: false })
        .limit(20);

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} conversas carregadas`);
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

      // Converter para formato do store
      const loadedMessages = (data || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));

      // Atualizar store
      useChatStore.getState().setConversationMessages(convId, loadedMessages);
      setActiveConversationId(convId);

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


  // Carregar conversas existentes ao montar componente
  useEffect(() => {
    const initChat = async () => {
      if (!user) return;

      // Carregar conversas usando o store (que já carrega mensagens)
      await useChatStore.getState().loadConversations(user.id);

      // Se não houver conversas, criar a primeira automaticamente
      const { data: existingConversations } = await supabase
        .from('ChatConversation')
        .select('id')
        .eq('userId', user.id)
        .limit(1);

      if (!existingConversations || existingConversations.length === 0) {
        await handleNewConversation();
      }
    };

    initChat();
  }, [user]);

  // Criar nova conversa
  const handleNewConversation = async () => {
    try {
      if (!user) return;

      // ✅ SISTEMA SIMPLIFICADO: SEM ORGANIZAÇÕES
      // Criar nova conversa direto com userId
      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('ChatConversation')
        .insert({
          id: newId,
          userId: user.id,
          title: '🆕 Nova Conversa',
          createdAt: now,
          updatedAt: now
        });

      if (error) throw error;

      // Setar como ativa imediatamente
      setActiveConversationId(newId);

      // Recarregar conversas para atualizar lista usando o store
      await useChatStore.getState().loadConversations(user.id);

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

  // Deletar conversa
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      // Deletar mensagens primeiro
      await supabase
        .from('ChatMessage')
        .delete()
        .eq('conversationId', conversationId);

      // Deletar conversa
      const { error } = await supabase
        .from('ChatConversation')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      // Se deletou a conversa ativa, limpar
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }

      // Recarregar lista
      await useChatStore.getState().loadConversations(user.id);

      toast({
        title: '🗑️ Conversa deletada',
        description: 'A conversa foi removida com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao deletar conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a conversa.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row">
      {/* SIDEBAR - Conversas Antigas (Mobile: Overlay, Desktop: Sidebar) */}
      <div className={`${
        sidebarOpen
          ? 'fixed md:relative inset-0 md:inset-auto w-full md:w-72 z-50 md:z-auto'
          : 'hidden md:w-0'
      } transition-all duration-300 bg-gray-50 md:border-r border-gray-200 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Conversas</h2>
            <Button
              onClick={() => setSidebarOpen(false)}
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
            <Plus className="h-4 w-4" />
            Nova Conversa
          </Button>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv: any) => (
            <div
              key={conv.id}
              className={`group relative flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${
                activeConversationId === conv.id ? 'bg-blue-50 border border-blue-200' : 'bg-white'
              }`}
              onClick={() => {
                if (activeConversationId !== conv.id) {
                  loadConversationMessages(conv.id);
                }
              }}
            >
              <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {conv.title}
                </p>
                {/* Preview da última mensagem (estilo ChatGPT) */}
                <p className="text-xs text-gray-500 truncate">
                  {conv.messages && conv.messages.length > 0
                    ? conv.messages[conv.messages.length - 1].content.substring(0, 50) + '...'
                    : 'Sem mensagens ainda'}
                </p>
              </div>
              <Button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleDeleteConversation(conv.id);
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
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 md:h-9 md:w-9 p-0 flex-shrink-0"
              >
                {sidebarOpen ? <X className="h-4 w-4 md:h-5 md:w-5" /> : <Menu className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                <Bot className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900">Chat com IA</h1>
                <p className="text-xs sm:text-sm text-gray-500">Assistente inteligente</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-xs sm:text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              Online
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 overscroll-contain">
          {activeConversation ? (
            <>
              {/* Indicador de pesquisa web */}
              {(isWebSearching || webSearchResults.length > 0) && (
                <WebSearchIndicator
                  isSearching={isWebSearching}
                  searchResults={webSearchResults}
                  searchQuery={webSearchQuery}
                />
              )}

              {/* Indicador de fontes pesquisadas */}
              {searchSources.length > 0 && (
                <SearchSourcesIndicator
                  sources={searchSources}
                  isSearching={isWebSearching}
                />
              )}

              {/* Downloads de ZIP disponíveis */}
              {zipDownloads.length > 0 && (
                <div className="mb-4">
                  <ZipDownloadList downloads={zipDownloads} />
                </div>
              )}

              {/* Execuções Super AI */}
              {superAIExecutions.length > 0 && (
                <div className="mb-4 space-y-4">
                  {superAIExecutions.map((execution, index) => (
                    <SuperAIExecution
                      key={index}
                      toolName={execution.toolName}
                      parameters={execution.parameters}
                      userId={user?.id || ''}
                      conversationId={activeConversationId || ''}
                      onComplete={(result) => {
                        console.log('Execução Super AI concluída:', result);
                      }}
                    />
                  ))}
                </div>
              )}

              {activeConversation.messages.map((message: any) => {
                // Detectar se é pedido de conexão de integração
                const integrationMatch = message.content?.match(/INTEGRATION_CONNECT:(\w+):([^🔗]+)/);

                if (integrationMatch && message.role === 'assistant') {
                  const [, platform, platformName] = integrationMatch;
                  const cleanContent = message.content.replace(/🔗 \*\*INTEGRATION_CONNECT:[^🔗]+🔗\*\* 🔗\n\n/, '');

                  return (
                    <div key={message.id} className="flex justify-start">
                      <div className="max-w-[80%]">
                        {/* Mensagem da IA */}
                        <Card className="bg-white mb-2">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-2">
                              <Bot className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                              <div className="flex-1 whitespace-pre-wrap break-words text-sm text-gray-900">
                                {cleanContent}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Card de Conexão */}
                        <IntegrationConnectionCard
                          platform={platform}
                          platformName={platformName.trim()}
                          onSkip={() => {
                            // Usuário pulou a conexão
                            console.log('Conexão pulada:', platform);
                          }}
                          onSuccess={() => {
                            // Conexão bem-sucedida
                            console.log('Conectado com sucesso:', platform);
                          }}
                        />
                      </div>
                    </div>
                  );
                }

                // Renderização normal de mensagem
                return (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                    <Card className={`w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-white'
                    }`}>
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <Bot className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className={`flex-1 whitespace-pre-wrap break-words text-sm md:text-base ${
                            message.role === 'user' ? 'text-white' : 'text-gray-900'
                          }`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '100%' }}>
                            {message.content}
                          </div>
                        </div>
                        <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('pt-BR') : ''}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
              {/* Indicador de pensamento da IA com Sonic */}
              {isAssistantTyping && (
                <AiThinkingIndicator
                  isThinking={isAssistantTyping}
                  currentTool={currentTool}
                  reasoning={aiReasoning}
                  sources={aiSources}
                  status="thinking"
                />
              )}
              {isAssistantTyping && (
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
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Selecione ou crie uma conversa para começar.</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-3 md:p-4 bg-white/80 backdrop-blur-xl flex-shrink-0">
          <div className="hidden sm:flex gap-2 mb-2">
            {quickSuggestions.map(s => (
              <Button key={s} variant="outline" size="sm" onClick={() => handleSuggestionClick(s)} className="text-xs">
                {s}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="w-full resize-none rounded-lg border bg-background p-3 pr-20 md:pr-24 min-h-[44px] md:min-h-[48px] text-sm md:text-base"
              minRows={1}
              maxRows={window.innerWidth < 768 ? 3 : 5}
              maxLength={MAX_CHARS}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={handleAttachClick}
                      className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Anexar arquivo</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!activeConversationId}
                      className={`h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Gravar áudio</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                type="submit"
                size="icon"
                onClick={handleSend}
                disabled={input.trim() === '' || !activeConversationId}
                className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 touch-manipulation"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className={cn("text-xs text-right mt-1", input.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground")}>
            {input.length} / {MAX_CHARS}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
