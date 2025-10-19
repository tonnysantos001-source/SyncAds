import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Database, BarChart3, Users, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const ADMIN_SYSTEM_PROMPT = `Você é a IA Administrativa da plataforma SyncAds. Você tem acesso total ao sistema e pode:

**CAPACIDADES:**
1. 📊 AUDITORIA: Analisar todo o sistema, identificar problemas, gerar relatórios
2. 💾 BANCO DE DADOS: Consultar qualquer tabela (SELECT apenas, nunca DELETE/UPDATE sem confirmação)
3. 👥 CLIENTES: Ver detalhes de organizações, usuários, campanhas
4. 💰 FATURAMENTO: Calcular MRR, ARR, análise de receita
5. 🤖 USO DE IA: Rastrear tokens, custos, uso por cliente
6. 📈 MÉTRICAS: Stats em tempo real de toda plataforma
7. 🔍 INVESTIGAÇÃO: Debugar problemas, analisar logs
8. 📋 RELATÓRIOS: Gerar insights e recomendações

**COMANDOS ESPECIAIS:**
- "audite o sistema" → Verifica saúde geral
- "stats gerais" → Dashboard completo
- "clientes ativos" → Lista organizações ativas
- "uso de ia hoje" → Mensagens processadas hoje
- "top clientes" → Maiores em receita/uso
- "problemas detectados" → Issues encontrados

**IMPORTANTE:**
- Seja direto e técnico
- Mostre números e dados reais
- Sugira ações quando necessário
- Nunca execute comandos destrutivos sem confirmação
- Sempre explique o que vai fazer antes

Responda de forma profissional e focada em ação.`;

const QUICK_ACTIONS = [
  { icon: BarChart3, label: 'Stats Gerais', prompt: 'Me mostre um resumo completo das stats da plataforma' },
  { icon: Users, label: 'Clientes Ativos', prompt: 'Liste todos os clientes ativos com suas métricas principais' },
  { icon: Database, label: 'Auditoria', prompt: 'Faça uma auditoria completa do sistema e identifique possíveis problemas' },
  { icon: Sparkles, label: 'Uso de IA', prompt: 'Analise o uso de IA hoje: mensagens, tokens e custos' },
];

export default function AdminChatPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: '👋 Olá! Sou sua IA Administrativa. Posso te ajudar a gerenciar toda a plataforma SyncAds.\n\n**O que posso fazer:**\n• Auditar o sistema\n• Consultar banco de dados\n• Gerar relatórios\n• Analisar métricas\n• Investigar problemas\n\nO que você gostaria de fazer?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const executeAdminQuery = async (userMessage: string): Promise<string> => {
    // Detectar intenção e executar queries apropriadas
    const lowerMessage = userMessage.toLowerCase();

    try {
      // Stats Gerais
      if (lowerMessage.includes('stats') || lowerMessage.includes('resumo') || lowerMessage.includes('geral')) {
        const [orgsResult, usersResult, messagesResult, aisResult] = await Promise.all([
          supabase.from('Organization').select('*', { count: 'exact', head: true }),
          supabase.from('User').select('*', { count: 'exact', head: true }),
          supabase.from('ChatMessage').select('*', { count: 'exact', head: true }),
          supabase.from('GlobalAiConnection').select('*', { count: 'exact', head: true }),
        ]);

        const activeOrgs = await supabase
          .from('Organization')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE');

        return `📊 **STATS GERAIS DA PLATAFORMA**\n\n` +
          `**Organizações:**\n` +
          `• Total: ${orgsResult.count || 0}\n` +
          `• Ativas: ${activeOrgs.count || 0}\n` +
          `• Taxa de ativação: ${orgsResult.count ? ((activeOrgs.count || 0) / orgsResult.count * 100).toFixed(1) : 0}%\n\n` +
          `**Usuários:**\n` +
          `• Total: ${usersResult.count || 0}\n` +
          `• Média por org: ${orgsResult.count ? ((usersResult.count || 0) / orgsResult.count).toFixed(1) : 0}\n\n` +
          `**Uso de IA:**\n` +
          `• Mensagens processadas: ${messagesResult.count || 0}\n` +
          `• IAs configuradas: ${aisResult.count || 0}\n\n` +
          `✅ Sistema operacional`;
      }

      // Clientes Ativos
      if (lowerMessage.includes('clientes') || lowerMessage.includes('organizações')) {
        const { data: orgs, error } = await supabase
          .from('Organization')
          .select('name, slug, plan, status, createdAt')
          .eq('status', 'ACTIVE')
          .order('createdAt', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (!orgs || orgs.length === 0) {
          return '❌ Nenhum cliente ativo encontrado.';
        }

        let response = `👥 **CLIENTES ATIVOS** (${orgs.length})\n\n`;
        orgs.forEach((org, index) => {
          response += `${index + 1}. **${org.name}**\n`;
          response += `   • Slug: ${org.slug}\n`;
          response += `   • Plano: ${org.plan}\n`;
          response += `   • Criado: ${new Date(org.createdAt).toLocaleDateString('pt-BR')}\n\n`;
        });

        return response;
      }

      // Auditoria
      if (lowerMessage.includes('audit') || lowerMessage.includes('problema') || lowerMessage.includes('verificar')) {
        const issues: string[] = [];

        // Verificar organizações sem usuários
        const { data: orgsWithoutUsers } = await supabase
          .from('Organization')
          .select('id, name')
          .not('id', 'in', supabase.from('User').select('organizationId'));

        if (orgsWithoutUsers && orgsWithoutUsers.length > 0) {
          issues.push(`⚠️ ${orgsWithoutUsers.length} organizações sem usuários`);
        }

        // Verificar IAs desativadas
        const { data: inactiveAIs } = await supabase
          .from('GlobalAiConnection')
          .select('name')
          .eq('status', 'INACTIVE');

        if (inactiveAIs && inactiveAIs.length > 0) {
          issues.push(`⚠️ ${inactiveAIs.length} IAs inativas`);
        }

        // Verificar organizações em trial expirado
        const { data: expiredTrials } = await supabase
          .from('Organization')
          .select('name')
          .eq('status', 'TRIAL')
          .lt('trialEndsAt', new Date().toISOString());

        if (expiredTrials && expiredTrials.length > 0) {
          issues.push(`⚠️ ${expiredTrials.length} trials expirados`);
        }

        if (issues.length === 0) {
          return '✅ **AUDITORIA COMPLETA**\n\nNenhum problema detectado. Sistema operando normalmente!';
        }

        return `🔍 **AUDITORIA DO SISTEMA**\n\n` +
          `**Problemas Encontrados:**\n${issues.map(i => `• ${i}`).join('\n')}\n\n` +
          `**Recomendação:** Revise esses pontos no painel administrativo.`;
      }

      // Uso de IA
      if (lowerMessage.includes('uso') || lowerMessage.includes('mensagens') || lowerMessage.includes('token')) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: todayMessages } = await supabase
          .from('ChatMessage')
          .select('*', { count: 'exact', head: true })
          .gte('createdAt', today.toISOString());

        const { count: totalMessages } = await supabase
          .from('ChatMessage')
          .select('*', { count: 'exact', head: true });

        return `🤖 **USO DE IA**\n\n` +
          `**Hoje:**\n` +
          `• Mensagens: ${todayMessages || 0}\n\n` +
          `**Total Histórico:**\n` +
          `• Mensagens: ${totalMessages || 0}\n\n` +
          `📊 Média diária: ~${totalMessages ? (totalMessages / 30).toFixed(0) : 0} mensagens`;
      }

      // Resposta padrão
      return `🤖 Entendi sua solicitação: "${userMessage}"\n\n` +
        `Posso ajudar com:\n` +
        `• **stats gerais** - Visão geral da plataforma\n` +
        `• **clientes ativos** - Lista de organizações\n` +
        `• **audite o sistema** - Verificação de problemas\n` +
        `• **uso de ia** - Métricas de processamento\n\n` +
        `O que você gostaria de fazer?`;

    } catch (error: any) {
      console.error('Admin query error:', error);
      return `❌ Erro ao executar consulta: ${error.message}\n\nTente reformular sua pergunta.`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Executar query administrativa
      const response = await executeAdminQuery(userMessage.content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: 'Erro ao processar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <SuperAdminLayout>
      <div className="h-[calc(100vh-80px)] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chat Administrativo</h1>
                <p className="text-sm text-gray-500">IA com acesso total ao sistema</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">
              <Sparkles className="h-3 w-3 mr-1" />
              Online
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </Button>
              );
            })}
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
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200'
                  : 'bg-white dark:bg-gray-800'
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
              <Card className="bg-white dark:bg-gray-800">
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
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
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
