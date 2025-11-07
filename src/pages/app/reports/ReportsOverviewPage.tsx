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
  AreaChart,
  Area,
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
  ComposedChart,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  Target,
  Zap,
  Eye,
  MousePointer,
  BarChart3,
  Calendar,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Dados de exemplo para demonstração
const generateChartData = () => {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return days.map((day, index) => ({
    name: day,
    pageLoad: Math.floor(Math.random() * 800) + 200,
    bounceRate: Math.floor(Math.random() * 40) + 30,
    startRender: Math.floor(Math.random() * 400) + 100,
    sessions: Math.floor(Math.random() * 5000) + 1000,
    sessionLength: Math.floor(Math.random() * 30) + 5,
    pvs: Math.floor(Math.random() * 3) + 1,
  }));
};

const generateHourlyData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}h`,
    visits: Math.floor(Math.random() * 1000) + 200,
    conversions: Math.floor(Math.random() * 50) + 10,
    revenue: Math.floor(Math.random() * 5000) + 1000,
  }));
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
  delay?: number;
}

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  delay = 0,
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
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              vs último período
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

const ReportsOverviewPage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7days");
  const [chartData, setChartData] = useState(generateChartData());
  const [hourlyData, setHourlyData] = useState(generateHourlyData());
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setLoading(true);
    setTimeout(() => {
      setChartData(generateChartData());
      setHourlyData(generateHourlyData());
      setLoading(false);
    }, 500);
  };

  const metrics = [
    {
      title: "Receita Total",
      value: "R$ 48.523",
      change: 12.5,
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Total de Pedidos",
      value: "2.847",
      change: 8.2,
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      title: "Visitantes Únicos",
      value: "15.234",
      change: -3.1,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Taxa de Conversão",
      value: "3.24%",
      change: 5.7,
      icon: Target,
      color: "bg-cyan-500",
    },
    {
      title: "Ticket Médio",
      value: "R$ 156",
      change: 4.3,
      icon: Package,
      color: "bg-pink-500",
    },
    {
      title: "Produtos Vendidos",
      value: "4.521",
      change: 11.8,
      icon: Package,
      color: "bg-orange-500",
    },
    {
      title: "Tempo Médio",
      value: "8m 32s",
      change: -2.1,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      title: "Taxa de Rejeição",
      value: "32.8%",
      change: -6.4,
      icon: Activity,
      color: "bg-red-500",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Visão geral das suas métricas de vendas e conversão
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 90 dias</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePeriodChange(period)}
          >
            <Activity className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} delay={index * 0.05} />
        ))}
      </div>

      {/* Gráfico Principal - Load Time vs Bounce Rate */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  Tempo de Carregamento vs Taxa de Rejeição
                </CardTitle>
                <CardDescription>
                  Análise de performance e comportamento do usuário
                </CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0">
                <Zap className="h-3 w-3 mr-1" />
                Tempo Real
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient
                    id="colorPageLoad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="colorStartRender"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.2}
                />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                />
                <Bar
                  yAxisId="left"
                  dataKey="pageLoad"
                  fill="url(#colorPageLoad)"
                  radius={[8, 8, 0, 0]}
                  name="Page Load (ms)"
                />
                <Bar
                  yAxisId="left"
                  dataKey="startRender"
                  fill="url(#colorStartRender)"
                  radius={[8, 8, 0, 0]}
                  name="Start Render (ms)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bounceRate"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: "#ef4444", r: 5 }}
                  name="Bounce Rate (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid de Gráficos Secundários */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sessões ao Longo do Dia */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Sessões ao Longo do Dia
              </CardTitle>
              <CardDescription>
                Distribuição de tráfego por hora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient
                      id="colorVisits"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.2}
                  />
                  <XAxis
                    dataKey="hour"
                    stroke="#9ca3af"
                    style={{ fontSize: "10px" }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "10px" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#colorVisits)"
                    name="Visitas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Conversões e Receita */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Conversões e Receita
              </CardTitle>
              <CardDescription>Performance financeira por hora</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={hourlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.2}
                  />
                  <XAxis
                    dataKey="hour"
                    stroke="#9ca3af"
                    style={{ fontSize: "10px" }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "10px" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", r: 4 }}
                    name="Conversões"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: "#06b6d4", r: 4 }}
                    name="Receita (R$)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Métricas de Engajamento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-cyan-500" />
              Métricas de Engajamento
            </CardTitle>
            <CardDescription>
              Análise detalhada do comportamento dos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient
                    id="colorSessions"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.2}
                />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis yAxisId="left" stroke="#9ca3af" />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="sessions"
                  fill="url(#colorSessions)"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Sessões"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sessionLength"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", r: 5 }}
                  name="Tempo de Sessão (min)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pvs"
                  stroke="#ec4899"
                  strokeWidth={3}
                  dot={{ fill: "#ec4899", r: 5 }}
                  name="PVs por Sessão"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReportsOverviewPage;
