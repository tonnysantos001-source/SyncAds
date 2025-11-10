import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HiChartBar,
  HiMagnifyingGlass,
  HiChatBubbleBottomCenterText,
  HiBolt,
  HiCurrencyDollar,
  HiArrowTrendingUp,
} from "react-icons/hi2";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      // ✅ SIMPLIFICADO: Buscar usuários ao invés de organizações
      const { data: users, error: usersError } = await supabase
        .from("User")
        .select("id, name, email, plan, createdAt")
        .order("createdAt", { ascending: false });

      if (usersError) throw usersError;

      const userIds = (users || []).map((user) => user.id);

      // Buscar contagem de mensagens por usuário
      const { data: conversations } = await supabase
        .from("ChatConversation")
        .select("userId, id")
        .in("userId", userIds);

      // Contar mensagens por conversação
      const conversationIds = (conversations || []).map((c) => c.id);
      const { data: messages } = await supabase
        .from("ChatMessage")
        .select("conversationId")
        .in("conversationId", conversationIds);

      // Criar mapa de mensagens por usuário
      const messagesMap = new Map<string, number>();
      (conversations || []).forEach((conv) => {
        const count = (messages || []).filter(
          (m) => m.conversationId === conv.id,
        ).length;
        const current = messagesMap.get(conv.userId) || 0;
        messagesMap.set(conv.userId, current + count);
      });

      // Buscar dados de AI Usage por usuário
      const { data: aiUsageData } = await supabase
        .from("AiUsage")
        .select("userId, totalTokens, estimatedCost, createdAt")
        .in("userId", userIds)
        .order("createdAt", { ascending: false });

      const aiUsageMap = new Map<string, any>();
      (aiUsageData || []).forEach((usage) => {
        if (!aiUsageMap.has(usage.userId)) {
          aiUsageMap.set(usage.userId, usage);
        }
      });

      // Buscar provider da IA global ativa
      const { data: globalAi } = await supabase
        .from("GlobalAiConnection")
        .select("provider")
        .eq("isActive", true)
        .limit(1)
        .maybeSingle();

      // Transformar dados por usuário
      const usage: UsageData[] = (users || []).map((user) => {
        const aiUsage = aiUsageMap.get(user.id);

        return {
          clientId: user.id,
          clientName: user.name || "Sem nome",
          clientSlug: user.email || "",
          plan: user.plan || "FREE",
          totalMessages: messagesMap.get(user.id) || 0,
          totalTokens: aiUsage?.totalTokens || 0,
          estimatedCost: aiUsage?.estimatedCost || 0,
          aiProvider: globalAi?.provider || "N/A",
          lastUsed: aiUsage?.createdAt || null,
        };
      });

      setUsageData(usage);
    } catch (error: any) {
      console.error("Error loading usage data:", error);
      toast({
        title: "Erro ao carregar uso de IA",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = usageData.filter(
    (item) =>
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientSlug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const calculateTotals = () => {
    return {
      totalMessages: usageData.reduce(
        (acc, item) => acc + item.totalMessages,
        0,
      ),
      totalTokens: usageData.reduce((acc, item) => acc + item.totalTokens, 0),
      totalCost: usageData.reduce((acc, item) => acc + item.estimatedCost, 0),
      avgMessagesPerClient:
        usageData.length > 0
          ? usageData.reduce((acc, item) => acc + item.totalMessages, 0) /
            usageData.length
          : 0,
    };
  };

  const totals = calculateTotals();

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
      STARTER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      PRO: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      ENTERPRISE:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${colors[plan] || colors.FREE}`}
      >
        {plan}
      </span>
    );
  };

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      openai:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      anthropic:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      google: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "N/A": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    };
    return (
      <Badge variant="outline" className={colors[provider] || colors["N/A"]}>
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Uso de IA
          </h1>
          <p className="text-gray-400 mt-1">
            Acompanhe o uso de inteligência artificial por cliente
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Total de Mensagens
                </CardTitle>
                <HiChatBubbleBottomCenterText className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {totals.totalMessages.toLocaleString("pt-BR")}
                </div>
                <p className="text-xs text-gray-400">Todas conversas com IA</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Total de Tokens
                </CardTitle>
                <HiBolt className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {(totals.totalTokens / 1000).toFixed(1)}K
                </div>
                <p className="text-xs text-gray-400">Tokens processados</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Custo Estimado
                </CardTitle>
                <HiCurrencyDollar className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  R${" "}
                  {totals.totalCost.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-gray-400">Custo com APIs</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Média por Usuário
                </CardTitle>
                <HiArrowTrendingUp className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {Math.round(totals.avgMessagesPerClient)}
                </div>
                <p className="text-xs text-gray-400">Mensagens / usuário</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Usage Table */}
        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">
                    Uso de IA por Usuário
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Detalhes de mensagens, tokens e custos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Buscar usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="border border-gray-700/50 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700/50 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300 font-semibold">
                        Cliente
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Plano
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Provider
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Mensagens
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Tokens
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Custo
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Último Uso
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          Nenhum dado de uso encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item, index) => (
                        <motion.tr
                          key={item.clientId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-gray-700/50 hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-white">
                                {item.clientName}
                              </div>
                              <div className="text-sm text-gray-400">
                                {item.clientSlug}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getPlanBadge(item.plan)}</TableCell>
                          <TableCell>
                            {getProviderBadge(item.aiProvider)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <HiChatBubbleBottomCenterText className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-white">
                                {item.totalMessages}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-white">
                              {item.totalTokens.toLocaleString("pt-BR")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-400">
                              R${" "}
                              {item.estimatedCost.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.lastUsed ? (
                              <span className="text-sm text-gray-400">
                                {new Date(item.lastUsed).toLocaleDateString(
                                  "pt-BR",
                                )}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">
                                Nunca
                              </span>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
}
