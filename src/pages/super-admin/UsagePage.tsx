import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Search, MessageSquare, Zap, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

interface UsageData {
  clientId: string;
  clientName: string;
  clientSlug: string; // Agora é o email do usuário
  plan: string;
  totalMessages: number;
  totalTokens: number;
  estimatedCost: number;
  aiProvider: string;
  lastUsed: string | null;
}

export default function UsagePage() {
  const { toast } = useToast();
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      // ✅ SIMPLIFICADO: Buscar usuários ao invés de organizações
      const { data: users, error: usersError } = await supabase
        .from('User')
        .select('id, name, email, plan, createdAt')
        .order('createdAt', { ascending: false });

      if (usersError) throw usersError;

      const userIds = (users || []).map(user => user.id);
      
      // Buscar contagem de mensagens por usuário
      const { data: conversations } = await supabase
        .from('ChatConversation')
        .select('userId, id')
        .in('userId', userIds);

      // Contar mensagens por conversação
      const conversationIds = (conversations || []).map(c => c.id);
      const { data: messages } = await supabase
        .from('ChatMessage')
        .select('conversationId')
        .in('conversationId', conversationIds);

      // Criar mapa de mensagens por usuário
      const messagesMap = new Map<string, number>();
      (conversations || []).forEach(conv => {
        const count = (messages || []).filter(m => m.conversationId === conv.id).length;
        const current = messagesMap.get(conv.userId) || 0;
        messagesMap.set(conv.userId, current + count);
      });

      // Buscar dados de AI Usage por usuário
      const { data: aiUsageData } = await supabase
        .from('AiUsage')
        .select('userId, totalTokens, estimatedCost, createdAt')
        .in('userId', userIds)
        .order('createdAt', { ascending: false });

      const aiUsageMap = new Map<string, any>();
      (aiUsageData || []).forEach(usage => {
        if (!aiUsageMap.has(usage.userId)) {
          aiUsageMap.set(usage.userId, usage);
        }
      });

      // Buscar provider da IA global ativa
      const { data: globalAi } = await supabase
        .from('GlobalAiConnection')
        .select('provider')
        .eq('isActive', true)
        .limit(1)
        .maybeSingle();

      // Transformar dados por usuário
      const usage: UsageData[] = (users || []).map(user => {
        const aiUsage = aiUsageMap.get(user.id);
        
        return {
          clientId: user.id,
          clientName: user.name || 'Sem nome',
          clientSlug: user.email || '',
          plan: user.plan || 'FREE',
          totalMessages: messagesMap.get(user.id) || 0,
          totalTokens: aiUsage?.totalTokens || 0,
          estimatedCost: aiUsage?.estimatedCost || 0,
          aiProvider: globalAi?.provider || 'N/A',
          lastUsed: aiUsage?.createdAt || null,
        };
      });

      setUsageData(usage);
    } catch (error: any) {
      console.error('Error loading usage data:', error);
      toast({
        title: 'Erro ao carregar uso de IA',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = usageData.filter((item) =>
    item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.clientSlug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotals = () => {
    return {
      totalMessages: usageData.reduce((acc, item) => acc + item.totalMessages, 0),
      totalTokens: usageData.reduce((acc, item) => acc + item.totalTokens, 0),
      totalCost: usageData.reduce((acc, item) => acc + item.estimatedCost, 0),
      avgMessagesPerClient: usageData.length > 0 
        ? usageData.reduce((acc, item) => acc + item.totalMessages, 0) / usageData.length
        : 0,
    };
  };

  const totals = calculateTotals();

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
      STARTER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      PRO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ENTERPRISE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[plan] || colors.FREE}`}>
        {plan}
      </span>
    );
  };

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      'openai': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'anthropic': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'google': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'N/A': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    };
    return (
      <Badge variant="outline" className={colors[provider] || colors['N/A']}>
        {provider.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Uso de IA</h1>
          <p className="text-gray-500 dark:text-gray-400">Acompanhe o uso de inteligência artificial por cliente</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totals.totalMessages.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">Todas conversas com IA</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tokens</CardTitle>
              <Zap className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(totals.totalTokens / 1000).toFixed(1)}K
              </div>
              <p className="text-xs text-muted-foreground">Tokens processados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Estimado</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totals.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Custo com APIs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Usuário</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(totals.avgMessagesPerClient)}
              </div>
              <p className="text-xs text-muted-foreground">Mensagens / usuário</p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Uso de IA por Usuário</CardTitle>
                <CardDescription>Detalhes de mensagens, tokens e custos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Mensagens</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Último Uso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhum dado de uso encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.clientId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.clientName}</div>
                            <div className="text-sm text-gray-500">{item.clientSlug}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(item.plan)}</TableCell>
                        <TableCell>{getProviderBadge(item.aiProvider)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{item.totalMessages}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{item.totalTokens.toLocaleString('pt-BR')}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            R$ {item.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.lastUsed ? (
                            <span className="text-sm text-gray-600">
                              {new Date(item.lastUsed).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Nunca</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
