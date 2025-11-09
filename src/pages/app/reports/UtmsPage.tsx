import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  MousePointer,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  RefreshCw,
  BarChart3,
  Activity,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { utmApi, UTMStats } from "@/lib/api/utmApi";
import { subDays } from "date-fns";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
  delay?: number;
  subtitle?: string;
}

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  delay = 0,
  subtitle,
}: MetricCardProps) => {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
        <div
          className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full blur-3xl`}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`h-4 w-4 ${color.replace("bg-", "text-")}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {value}
          </div>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span
              className={`text-sm font-semibold ${
                isPositive ? "text-green-500" : "text-red-500"
              }`}
            >
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {subtitle || "vs período anterior"}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-lg p-4 shadow-xl">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="text-white font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const UtmsPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("30days");
  const [stats, setStats] = useState<UTMStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, period]);

  const loadData = async () => {
    try {
      if (!user?.id) return;
      setLoading(true);

      const days = period === "7days" ? 7 : period === "30days" ? 30 : 90;
      const periodRange = {
        from: subDays(new Date(), days).toISOString(),
        to: new Date().toISOString(),
      };

      const statsData = await utmApi.getStats(user.id, periodRange);
      setStats(statsData);
    } catch (error: any) {
      console.error("Erro ao carregar dados UTM:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message || "Não foi possível carregar os dados UTM",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: "Dados atualizados",
      description: "Os dados UTM foram atualizados com sucesso",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Preparar dados para gráficos
  const sourceChartData = stats?.bySource
    ? Object.values(stats.bySource).map((item) => ({
        name: item.utmSource || "Direto",
        visitas: item.totalVisits,
        conversões: item.totalConversions,
        receita: item.totalRevenue,
        taxa: item.conversionRate,
      }))
    : [];

  const mediumChartData = stats?.byMedium
    ? Object.values(stats.byMedium).map((item) => ({
        name: item.utmMedium || "Não definido",
        visitas: item.totalVisits,
        conversões: item.totalConversions,
        receita: item.totalRevenue,
        taxa: item.conversionRate,
      }))
    : [];

  const campaignChartData = stats?.byCampaign
    ? Object.values(stats.byCampaign)
        .slice(0, 10)
        .map((item) => ({
          name: item.utmCampaign || "Sem campanha",
          visitas: item.totalVisits,
          conversões: item.totalConversions,
          receita: item.totalRevenue,
          taxa: item.conversionRate,
        }))
    : [];

  // Cores vibrantes para gráficos
  const COLORS = [
    "#3B82F6", // blue-500
    "#8B5CF6", // purple-500
    "#EC4899", // pink-500
    "#10B981", // green-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#06B6D4", // cyan-500
    "#6366F1", // indigo-500
  ];

  // Filtrar dados de tabela
  const filteredSources = stats?.bySource
    ? Object.values(stats.bySource).filter((item) =>
        (item.utmSource || "direto")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-850 to-purple-900/40 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-850 to-purple-900/40 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Rastreamento UTM
            </h1>
            <p className="text-gray-400 mt-2">
              Analise o desempenho de suas campanhas de marketing
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] bg-white/10 dark:bg-gray-900/50 backdrop-blur-xl border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total de Sessões"
            value={stats?.totalSessions.toLocaleString("pt-BR") || "0"}
            change={12.5}
            icon={MousePointer}
            color="bg-blue-500"
            delay={0.1}
            subtitle="visitantes únicos"
          />
          <MetricCard
            title="Conversões"
            value={stats?.totalConversions.toLocaleString("pt-BR") || "0"}
            change={stats?.conversionRate || 0}
            icon={Target}
            color="bg-green-500"
            delay={0.2}
            subtitle="pedidos confirmados"
          />
          <MetricCard
            title="Receita Total"
            value={formatCurrency(stats?.totalRevenue || 0)}
            change={18.3}
            icon={DollarSign}
            color="bg-purple-500"
            delay={0.3}
            subtitle="faturamento"
          />
          <MetricCard
            title="Taxa de Conversão"
            value={formatPercent(stats?.conversionRate || 0)}
            change={stats?.conversionRate || 0}
            icon={Percent}
            color="bg-pink-500"
            delay={0.4}
            subtitle="sessões → vendas"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance por Fonte */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Performance por Fonte
                </CardTitle>
                <CardDescription>
                  Visitas e conversões por origem do tráfego
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="name"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="visitas"
                      name="Visitas"
                      fill="#3B82F6"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="conversões"
                      name="Conversões"
                      fill="#10B981"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Receita por Fonte */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Receita por Fonte
                </CardTitle>
                <CardDescription>Faturamento gerado por origem</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="name"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="receita"
                      name="Receita (R$)"
                      fill="url(#colorGradient)"
                      radius={[8, 8, 0, 0]}
                    />
                    <defs>
                      <linearGradient
                        id="colorGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Taxa de Conversão por Meio */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Taxa de Conversão por Meio
                </CardTitle>
                <CardDescription>
                  Performance de conversão por canal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mediumChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="name"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="taxa"
                      name="Taxa (%)"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: "#8B5CF6", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Campanhas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Top 10 Campanhas
                </CardTitle>
                <CardDescription>
                  Campanhas com melhor desempenho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#9CA3AF"
                      fontSize={10}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="conversões"
                      name="Conversões"
                      fill="#10B981"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabela Detalhada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-pink-500" />
                    Detalhamento por Fonte
                  </CardTitle>
                  <CardDescription>
                    Análise completa de performance
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar fonte..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Fonte
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Visitas
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Conversões
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Taxa
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Receita
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Ticket Médio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSources.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-gray-500"
                        >
                          Nenhuma fonte encontrada
                        </td>
                      </tr>
                    ) : (
                      filteredSources.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {item.utmSource || "Direto"}
                              </span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                            {item.totalVisits.toLocaleString("pt-BR")}
                          </td>
                          <td className="text-right py-3 px-4">
                            <Badge
                              variant="secondary"
                              className="bg-green-500/10 text-green-600 dark:text-green-400"
                            >
                              {item.totalConversions}
                            </Badge>
                          </td>
                          <td className="text-right py-3 px-4">
                            <Badge
                              variant="secondary"
                              className="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            >
                              {formatPercent(item.conversionRate)}
                            </Badge>
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(item.totalRevenue)}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                            {formatCurrency(item.averageOrderValue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performers */}
        {stats?.topPerformers && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Top Fontes */}
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Top Fontes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topPerformers.sources.map((source, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                          #{index + 1}
                        </span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {source.utmSource || "Direto"}
                        </span>
                      </div>
                      <Badge className="bg-blue-500 text-white">
                        {source.totalConversions} vendas
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Meios */}
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Top Meios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topPerformers.mediums.map((medium, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg text-purple-600 dark:text-purple-400">
                          #{index + 1}
                        </span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {medium.utmMedium || "Não definido"}
                        </span>
                      </div>
                      <Badge className="bg-purple-500 text-white">
                        {medium.totalConversions} vendas
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Campanhas */}
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-pink-500" />
                  Top Campanhas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topPerformers.campaigns.map((campaign, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-
gradient-to-r from-pink-500/10 to-red-500/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg text-pink-600 dark:text-pink-400">
                          #{index + 1}
                        </span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {campaign.utmCampaign || "Sem campanha"}
                        </span>
                      </div>
                      <Badge className="bg-pink-500 text-white">
                        {campaign.totalConversions} vendas
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UtmsPage;
