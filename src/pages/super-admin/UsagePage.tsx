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
  HiExclamationTriangle,
  HiCheckCircle,
  HiClock,
  HiArrowTrendingDown,
} from "react-icons/hi2";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
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

interface AIRouterMetrics {
  groq: {
    total_requests: number;
    avg_latency_ms: number;
    success_rate: number;
  };
  gemini: {
    total_requests: number;
    avg_latency_ms: number;
    success_rate: number;
  };
  routing_decisions: {
    total: number;
    by_reason: Record<string, number>;
  };
  last_24h: {
    total_requests: number;
    groq_percentage: number;
    gemini_percentage: number;
  };
}

interface TimeSeriesData {
  date: string;
  groq_requests: number;
  gemini_requests: number;
  groq_latency: number;
  gemini_latency: number;
  groq_success_rate: number;
  gemini_success_rate: number;
}

interface Alert {
  id: string;
  type: "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: string;
  provider?: string;
}

export default function UsagePage() {
  const { toast } = useToast();
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiRouterMetrics, setAiRouterMetrics] =
    useState<AIRouterMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    loadUsageData();
    loadAIRouterMetrics();
    loadTimeSeriesData();
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

  const loadAIRouterMetrics = async () => {
    try {
      // Buscar dados dos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: logs, error } = await supabase
        .from("ai_usage_logs")
        .select("*")
        .gte("created_at", sevenDaysAgo.toISOString());

      if (error) throw error;

      if (!logs || logs.length === 0) {
        setAiRouterMetrics(null);
        return;
      }

      // Processar métricas
      const groqLogs = logs.filter((l) => l.provider === "GROQ");
      const geminiLogs = logs.filter(
        (l) => l.provider === "GOOGLE" || l.provider === "GEMINI",
      );

      const calculateStats = (providerLogs: any[]) => ({
        total_requests: providerLogs.length,
        avg_latency_ms:
          providerLogs.length > 0
            ? Math.round(
                providerLogs.reduce((acc, l) => acc + (l.latency_ms || 0), 0) /
                  providerLogs.length,
              )
            : 0,
        success_rate:
          providerLogs.length > 0
            ? Math.round(
                (providerLogs.filter((l) => l.success).length /
                  providerLogs.length) *
                  100,
              )
            : 0,
      });

      // Últimas 24h
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const last24hLogs = logs.filter(
        (l) => new Date(l.created_at) >= oneDayAgo,
      );
      const last24hGroq = last24hLogs.filter(
        (l) => l.provider === "GROQ",
      ).length;
      const last24hGemini = last24hLogs.filter(
        (l) => l.provider === "GOOGLE" || l.provider === "GEMINI",
      ).length;
      const last24hTotal = last24hLogs.length;

      // Contar razões de roteamento
      const reasonCounts: Record<string, number> = {};
      logs.forEach((log) => {
        if (log.selected_reason) {
          reasonCounts[log.selected_reason] =
            (reasonCounts[log.selected_reason] || 0) + 1;
        }
      });

      setAiRouterMetrics({
        groq: calculateStats(groqLogs),
        gemini: calculateStats(geminiLogs),
        routing_decisions: {
          total: logs.length,
          by_reason: reasonCounts,
        },
        last_24h: {
          total_requests: last24hTotal,
          groq_percentage:
            last24hTotal > 0
              ? Math.round((last24hGroq / last24hTotal) * 100)
              : 0,
          gemini_percentage:
            last24hTotal > 0
              ? Math.round((last24hGemini / last24hTotal) * 100)
              : 0,
        },
      });
    } catch (error: any) {
      console.error("Error loading AI Router metrics:", error);
      setAiRouterMetrics(null);
    }
  };

  const loadTimeSeriesData = async () => {
    try {
      // Buscar dados dos últimos 7 dias, agrupados por dia
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: logs, error } = await supabase
        .from("ai_usage_logs")
        .select("*")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!logs || logs.length === 0) {
        setTimeSeriesData([]);
        return;
      }

      // Agrupar por dia
      const groupedByDay = logs.reduce((acc: Record<string, any[]>, log) => {
        const date = new Date(log.created_at).toLocaleDateString("pt-BR");
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
      }, {});

      // Processar cada dia
      const seriesData: TimeSeriesData[] = Object.entries(groupedByDay).map(
        ([date, dayLogs]) => {
          const groqLogs = dayLogs.filter((l) => l.provider === "GROQ");
          const geminiLogs = dayLogs.filter(
            (l) => l.provider === "GOOGLE" || l.provider === "GEMINI",
          );

          return {
            date,
            groq_requests: groqLogs.length,
            gemini_requests: geminiLogs.length,
            groq_latency:
              groqLogs.length > 0
                ? Math.round(
                    groqLogs.reduce((acc, l) => acc + (l.latency_ms || 0), 0) /
                      groqLogs.length,
                  )
                : 0,
            gemini_latency:
              geminiLogs.length > 0
                ? Math.round(
                    geminiLogs.reduce(
                      (acc, l) => acc + (l.latency_ms || 0),
                      0,
                    ) / geminiLogs.length,
                  )
                : 0,
            groq_success_rate:
              groqLogs.length > 0
                ? Math.round(
                    (groqLogs.filter((l) => l.success).length /
                      groqLogs.length) *
                      100,
                  )
                : 0,
            gemini_success_rate:
              geminiLogs.length > 0
                ? Math.round(
                    (geminiLogs.filter((l) => l.success).length /
                      geminiLogs.length) *
                      100,
                  )
                : 0,
          };
        },
      );

      setTimeSeriesData(seriesData);

      // Gerar alertas baseado nas métricas
      generateAlerts(logs, seriesData);
    } catch (error: any) {
      console.error("Error loading time series data:", error);
      setTimeSeriesData([]);
    }
  };

  const generateAlerts = (logs: any[], seriesData: TimeSeriesData[]) => {
    const newAlerts: Alert[] = [];

    // Alertas de latência alta
    const LATENCY_THRESHOLD = 3000; // 3 segundos
    const recentLogs = logs.filter(
      (l) =>
        new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    const groqHighLatency = recentLogs.filter(
      (l) => l.provider === "GROQ" && l.latency_ms > LATENCY_THRESHOLD,
    );
    const geminiHighLatency = recentLogs.filter(
      (l) =>
        (l.provider === "GOOGLE" || l.provider === "GEMINI") &&
        l.latency_ms > LATENCY_THRESHOLD,
    );

    if (groqHighLatency.length > 0) {
      newAlerts.push({
        id: "groq-latency",
        type: "warning",
        title: "Latência Alta - Groq",
        message: `${groqHighLatency.length} requisições com latência > 3s nas últimas 24h`,
        timestamp: new Date().toISOString(),
        provider: "GROQ",
      });
    }

    if (geminiHighLatency.length > 0) {
      newAlerts.push({
        id: "gemini-latency",
        type: "warning",
        title: "Latência Alta - Gemini",
        message: `${geminiHighLatency.length} requisições com latência > 3s nas últimas 24h`,
        timestamp: new Date().toISOString(),
        provider: "GEMINI",
      });
    }

    // Alertas de taxa de erro
    const ERROR_RATE_THRESHOLD = 5; // 5%
    const groqErrors = recentLogs.filter(
      (l) => l.provider === "GROQ" && !l.success,
    );
    const geminiErrors = recentLogs.filter(
      (l) => (l.provider === "GOOGLE" || l.provider === "GEMINI") && !l.success,
    );

    const groqErrorRate =
      recentLogs.filter((l) => l.provider === "GROQ").length > 0
        ? (groqErrors.length /
            recentLogs.filter((l) => l.provider === "GROQ").length) *
          100
        : 0;

    const geminiErrorRate =
      recentLogs.filter(
        (l) => l.provider === "GOOGLE" || l.provider === "GEMINI",
      ).length > 0
        ? (geminiErrors.length /
            recentLogs.filter(
              (l) => l.provider === "GOOGLE" || l.provider === "GEMINI",
            ).length) *
          100
        : 0;

    if (groqErrorRate > ERROR_RATE_THRESHOLD) {
      newAlerts.push({
        id: "groq-errors",
        type: "error",
        title: "Taxa de Erro Alta - Groq",
        message: `${groqErrorRate.toFixed(1)}% de erros (${groqErrors.length} falhas)`,
        timestamp: new Date().toISOString(),
        provider: "GROQ",
      });
    }

    if (geminiErrorRate > ERROR_RATE_THRESHOLD) {
      newAlerts.push({
        id: "gemini-errors",
        type: "error",
        title: "Taxa de Erro Alta - Gemini",
        message: `${geminiErrorRate.toFixed(1)}% de erros (${geminiErrors.length} falhas)`,
        timestamp: new Date().toISOString(),
        provider: "GEMINI",
      });
    }

    // Alerta de performance excelente
    if (seriesData.length > 0) {
      const latestData = seriesData[seriesData.length - 1];
      if (
        latestData.groq_success_rate === 100 &&
        latestData.groq_latency < 1500
      ) {
        newAlerts.push({
          id: "groq-excellent",
          type: "success",
          title: "Performance Excelente - Groq",
          message: `100% de sucesso com latência média de ${latestData.groq_latency}ms`,
          timestamp: new Date().toISOString(),
          provider: "GROQ",
        });
      }

      if (
        latestData.gemini_success_rate === 100 &&
        latestData.gemini_latency < 2000
      ) {
        newAlerts.push({
          id: "gemini-excellent",
          type: "success",
          title: "Performance Excelente - Gemini",
          message: `100% de sucesso com latência média de ${latestData.gemini_latency}ms`,
          timestamp: new Date().toISOString(),
          provider: "GEMINI",
        });
      }
    }

    setAlerts(newAlerts);
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

        {/* AI Router Metrics */}
        {aiRouterMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <HiBolt className="h-5 w-5 text-purple-400" />
                      AI Router - Últimos 7 dias
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Métricas de roteamento inteligente entre Groq e Gemini
                    </CardDescription>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {aiRouterMetrics.routing_decisions.total} requisições
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Groq Stats */}
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">⚡ Groq</h4>
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-300 border-blue-500/30"
                      >
                        Rápido
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Requisições:</span>
                        <span className="text-white font-medium">
                          {aiRouterMetrics.groq.total_requests}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Latência média:</span>
                        <span className="text-white font-medium">
                          {aiRouterMetrics.groq.avg_latency_ms}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Taxa de sucesso:</span>
                        <span className="text-green-400 font-medium">
                          {aiRouterMetrics.groq.success_rate}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gemini Stats */}
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">🔵 Gemini</h4>
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-300 border-purple-500/30"
                      >
                        Multimodal
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Requisições:</span>
                        <span className="text-white font-medium">
                          {aiRouterMetrics.gemini.total_requests}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Latência média:</span>
                        <span className="text-white font-medium">
                          {aiRouterMetrics.gemini.avg_latency_ms}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Taxa de sucesso:</span>
                        <span className="text-green-400 font-medium">
                          {aiRouterMetrics.gemini.success_rate}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Last 24h Distribution */}
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">
                        📊 Últimas 24h
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-gray-500/10 text-gray-300 border-gray-500/30"
                      >
                        {aiRouterMetrics.last_24h.total_requests} reqs
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Groq:</span>
                          <span className="text-blue-400 font-medium">
                            {aiRouterMetrics.last_24h.groq_percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"
                            style={{
                              width: `${aiRouterMetrics.last_24h.groq_percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Gemini:</span>
                          <span className="text-purple-400 font-medium">
                            {aiRouterMetrics.last_24h.gemini_percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-400 h-2 rounded-full"
                            style={{
                              width: `${aiRouterMetrics.last_24h.gemini_percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Routing Reasons */}
                <div className="mt-4 bg-gray-900/30 rounded-lg p-4 border border-gray-700/30">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <HiArrowTrendingUp className="h-4 w-4 text-purple-400" />
                    Principais Razões de Roteamento
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(aiRouterMetrics.routing_decisions.by_reason)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 4)
                      .map(([reason, count]) => (
                        <div
                          key={reason}
                          className="bg-gray-800/50 rounded p-2 border border-gray-700/30"
                        >
                          <div
                            className="text-xs text-gray-400 truncate"
                            title={reason}
                          >
                            {reason.slice(0, 30)}...
                          </div>
                          <div className="text-sm font-semibold text-white mt-1">
                            {count} vezes
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Alertas */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`border ${
                    alert.type === "error"
                      ? "border-red-500/50 bg-red-900/10"
                      : alert.type === "warning"
                        ? "border-yellow-500/50 bg-yellow-900/10"
                        : "border-green-500/50 bg-green-900/10"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {alert.type === "error" && (
                          <HiExclamationTriangle className="h-5 w-5 text-red-400" />
                        )}
                        {alert.type === "warning" && (
                          <HiClock className="h-5 w-5 text-yellow-400" />
                        )}
                        {alert.type === "success" && (
                          <HiCheckCircle className="h-5 w-5 text-green-400" />
                        )}
                        <CardTitle className="text-sm font-semibold text-white">
                          {alert.title}
                        </CardTitle>
                      </div>
                      {alert.provider && (
                        <Badge
                          variant="outline"
                          className={
                            alert.provider === "GROQ"
                              ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                              : "bg-purple-500/10 text-purple-300 border-purple-500/30"
                          }
                        >
                          {alert.provider}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">{alert.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Gráficos Temporais */}
        {timeSeriesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 grid gap-6 md:grid-cols-2"
          >
            {/* Gráfico de Requisições */}
            <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HiArrowTrendingUp className="h-5 w-5 text-blue-400" />
                  Requisições por Dia
                </CardTitle>
                <CardDescription>
                  Comparação de volume Groq vs Gemini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient
                        id="colorGroq"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorGemini"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#a855f7"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#a855f7"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="groq_requests"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorGroq)"
                      name="Groq"
                    />
                    <Area
                      type="monotone"
                      dataKey="gemini_requests"
                      stroke="#a855f7"
                      fillOpacity={1}
                      fill="url(#colorGemini)"
                      name="Gemini"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Latência */}
            <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HiClock className="h-5 w-5 text-yellow-400" />
                  Latência Média (ms)
                </CardTitle>
                <CardDescription>
                  Tempo de resposta por provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="groq_latency"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Groq"
                      dot={{ fill: "#3b82f6", r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="gemini_latency"
                      stroke="#a855f7"
                      strokeWidth={2}
                      name="Gemini"
                      dot={{ fill: "#a855f7", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Taxa de Sucesso */}
            <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl md:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HiCheckCircle className="h-5 w-5 text-green-400" />
                  Taxa de Sucesso (%)
                </CardTitle>
                <CardDescription>
                  Confiabilidade dos providers ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="groq_success_rate"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Groq"
                      dot={{ fill: "#10b981", r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="gemini_success_rate"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      name="Gemini"
                      dot={{ fill: "#8b5cf6", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Comparação A/B - Groq vs Gemini */}
        {aiRouterMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <HiArrowTrendingUp className="h-5 w-5 text-purple-400" />
                  Comparação A/B: Groq vs Gemini
                </CardTitle>
                <CardDescription>
                  Análise comparativa de performance e eficiência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Groq Column */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        ⚡ Groq (Llama 3.3)
                      </h3>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        Velocidade
                      </Badge>
                    </div>

                    {/* Métricas Groq */}
                    <div className="space-y-3">
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-sm">
                            Total de Requisições
                          </span>
                          <span className="text-2xl font-bold text-blue-400">
                            {aiRouterMetrics.groq.total_requests}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"
                            style={{
                              width: `${
                                (aiRouterMetrics.groq.total_requests /
                                  (aiRouterMetrics.groq.total_requests +
                                    aiRouterMetrics.gemini.total_requests)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-sm">
                            Latência Média
                          </span>
                          <span className="text-2xl font-bold text-blue-400">
                            {aiRouterMetrics.groq.avg_latency_ms}ms
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {aiRouterMetrics.groq.avg_latency_ms <
                          aiRouterMetrics.gemini.avg_latency_ms ? (
                            <>
                              <HiArrowTrendingDown className="h-4 w-4 text-green-400" />
                              <span className="text-green-400 text-xs font-semibold">
                                {Math.round(
                                  ((aiRouterMetrics.gemini.avg_latency_ms -
                                    aiRouterMetrics.groq.avg_latency_ms) /
                                    aiRouterMetrics.gemini.avg_latency_ms) *
                                    100,
                                )}
                                % mais rápido
                              </span>
                            </>
                          ) : (
                            <>
                              <HiArrowTrendingUp className="h-4 w-4 text-red-400" />
                              <span className="text-red-400 text-xs font-semibold">
                                {Math.round(
                                  ((aiRouterMetrics.groq.avg_latency_ms -
                                    aiRouterMetrics.gemini.avg_latency_ms) /
                                    aiRouterMetrics.gemini.avg_latency_ms) *
                                    100,
                                )}
                                % mais lento
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-sm">
                            Taxa de Sucesso
                          </span>
                          <span className="text-2xl font-bold text-green-400">
                            {aiRouterMetrics.groq.success_rate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
                            style={{
                              width: `${aiRouterMetrics.groq.success_rate}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                        <h4 className="text-sm font-semibold text-blue-300 mb-2">
                          🎯 Melhor para:
                        </h4>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• Chat conversacional rápido</li>
                          <li>• Respostas em tempo real</li>
                          <li>• Alto volume de requisições</li>
                          <li>• Custo zero (gratuito)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Gemini Column */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        🔵 Gemini (2.0 Flash)
                      </h3>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        Multimodal
                      </Badge>
                    </div>

                    {/* Métricas Gemini */}
                    <div className="space-y-3">
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-sm">
                            Total de Requisições
                          </span>
                          <span className="text-2xl font-bold text-purple-400">
                            {aiRouterMetrics.gemini.total_requests}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-400 h-2 rounded-full"
                            style={{
                              width: `${
                                (aiRouterMetrics.gemini.total_requests /
                                  (aiRouterMetrics.groq.total_requests +
                                    aiRouterMetrics.gemini.total_requests)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-sm">
                            Latência Média
                          </span>
                          <span className="text-2xl font-bold text-purple-400">
                            {aiRouterMetrics.gemini.avg_latency_ms}ms
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {aiRouterMetrics.gemini.avg_latency_ms <
                          aiRouterMetrics.groq.avg_latency_ms ? (
                            <>
                              <HiArrowTrendingDown className="h-4 w-4 text-green-400" />
                              <span className="text-green-400 text-xs font-semibold">
                                {Math.round(
                                  ((aiRouterMetrics.groq.avg_latency_ms -
                                    aiRouterMetrics.gemini.avg_latency_ms) /
                                    aiRouterMetrics.groq.avg_latency_ms) *
                                    100,
                                )}
                                % mais rápido
                              </span>
                            </>
                          ) : (
                            <>
                              <HiArrowTrendingUp className="h-4 w-4 text-yellow-400" />
                              <span className="text-yellow-400 text-xs font-semibold">
                                {Math.round(
                                  ((aiRouterMetrics.gemini.avg_latency_ms -
                                    aiRouterMetrics.groq.avg_latency_ms) /
                                    aiRouterMetrics.groq.avg_latency_ms) *
                                    100,
                                )}
                                % mais lento
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-sm">
                            Taxa de Sucesso
                          </span>
                          <span className="text-2xl font-bold text-green-400">
                            {aiRouterMetrics.gemini.success_rate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
                            style={{
                              width: `${aiRouterMetrics.gemini.success_rate}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
                        <h4 className="text-sm font-semibold text-purple-300 mb-2">
                          🎯 Melhor para:
                        </h4>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• Geração de imagens</li>
                          <li>• Análise multimodal</li>
                          <li>• Contexto longo (1M tokens)</li>
                          <li>• Tarefas complexas</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recomendação Inteligente */}
                <div className="mt-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-4 border border-blue-500/20">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <HiBolt className="h-4 w-4 text-yellow-400" />
                    Recomendação do Sistema
                  </h4>
                  <p className="text-sm text-gray-300">
                    {aiRouterMetrics.groq.total_requests >
                    aiRouterMetrics.gemini.total_requests
                      ? "Groq está sendo mais utilizado (chat conversacional). Sistema otimizado para velocidade."
                      : aiRouterMetrics.gemini.total_requests >
                          aiRouterMetrics.groq.total_requests
                        ? "Gemini está sendo mais utilizado (tarefas complexas). Sistema priorizando capacidades avançadas."
                        : "Uso equilibrado entre Groq e Gemini. Sistema funcionando perfeitamente."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
