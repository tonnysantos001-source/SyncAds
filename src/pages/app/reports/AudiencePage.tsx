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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Globe,
  Target,
  Calendar,
  Filter,
  Download,
  Eye,
  ShoppingBag,
  Award,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

interface StateData {
  state: string;
  stateName: string;
  orders: number;
  revenue: number;
  customers: number;
  avgTicket: number;
  conversionRate: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  change?: number;
  delay?: number;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  color,
  change,
  delay = 0,
}: MetricCardProps) => {
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
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`h-4 w-4 ${change >= 0 ? "text-green-500" : "text-red-500"}`}
              />
              <span
                className={`text-sm font-semibold ${change >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                vs último período
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const BRAZILIAN_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-lg p-4 shadow-xl">
        <p className="text-white font-semibold mb-2">
          {payload[0].payload.stateName}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <ShoppingBag className="h-4 w-4 text-blue-400" />
            <span className="text-gray-300">Pedidos:</span>
            <span className="text-white font-semibold">
              {payload[0].payload.orders}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-gray-300">Receita:</span>
            <span className="text-white font-semibold">
              R${" "}
              {payload[0].value.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="text-gray-300">Clientes:</span>
            <span className="text-white font-semibold">
              {payload[0].payload.customers}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const AudiencePage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7days");
  const [stateData, setStateData] = useState<StateData[]>([]);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.id) {
      loadAudienceData();
    }
  }, [user?.id, period]);

  const loadAudienceData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Buscar pedidos com endereço
      const { data: orders, error } = await supabase
        .from("Order")
        .select("*")
        .eq("userId", user.id)
        .eq("paymentStatus", "PAID")
        .not("shippingAddress", "is", null);

      if (error) throw error;

      // Agrupar por estado
      const stateMap: { [key: string]: StateData } = {};

      orders?.forEach((order) => {
        const address = order.shippingAddress as any;
        const state = address?.state || address?.uf || "BR";
        const total =
          typeof order.total === "string"
            ? parseFloat(order.total)
            : order.total;

        if (!stateMap[state]) {
          const stateName =
            BRAZILIAN_STATES.find((s) => s.code === state)?.name || state;
          stateMap[state] = {
            state,
            stateName,
            orders: 0,
            revenue: 0,
            customers: 0,
            avgTicket: 0,
            conversionRate: 0,
          };
        }

        stateMap[state].orders += 1;
        stateMap[state].revenue += total || 0;
      });

      // Calcular métricas
      const data = Object.values(stateMap).map((item) => ({
        ...item,
        avgTicket: item.orders > 0 ? item.revenue / item.orders : 0,
      }));

      // Ordenar por receita
      data.sort((a, b) => b.revenue - a.revenue);

      setStateData(data);
    } catch (error) {
      console.error("Erro ao carregar dados de audiência:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = stateData.reduce((sum, s) => sum + s.orders, 0);
  const totalRevenue = stateData.reduce((sum, s) => sum + s.revenue, 0);
  const totalCustomers = stateData.reduce((sum, s) => sum + s.customers, 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const topStates = stateData.slice(0, 10);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
            Público Alvo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Conheça quem está comprando seu produto
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Estados"
          value={stateData.length}
          icon={MapPin}
          color="bg-blue-500"
          delay={0}
        />
        <MetricCard
          title="Total de Pedidos"
          value={totalOrders}
          icon={ShoppingBag}
          color="bg-green-500"
          delay={0.1}
        />
        <MetricCard
          title="Receita Total"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="bg-purple-500"
          delay={0.2}
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(avgTicket)}
          icon={Target}
          color="bg-pink-500"
          delay={0.3}
        />
      </div>

      {/* Gráfico de Barras - Top 10 Estados */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Top 10 Estados por Receita
                </CardTitle>
                <CardDescription>
                  Estados com maior faturamento no período
                </CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                <Eye className="h-3 w-3 mr-1" />
                Top Performers
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {topStates.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topStates}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.2}
                  />
                  <XAxis
                    dataKey="state"
                    stroke="#9ca3af"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                    {topStates.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(${(index * 36) % 360}, 70%, 50%)`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <MapPin className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-semibold">Nenhum dado disponível</p>
                <p className="text-sm">Aguardando pedidos com localização</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabela Detalhada */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-500" />
              Detalhamento por Estado
            </CardTitle>
            <CardDescription>
              Análise completa de todos os estados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Pedidos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Receita
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Ticket Médio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      % do Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stateData.map((state, index) => (
                    <motion.tr
                      key={state.state}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                            {state.state}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {state.stateName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Badge variant="outline" className="font-mono">
                          {state.orders}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(state.revenue)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-900 dark:text-gray-300">
                        {formatCurrency(state.avgTicket)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{
                                width: `${((state.revenue / totalRevenue) * 100).toFixed(0)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-12">
                            {((state.revenue / totalRevenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {stateData.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum dado de localização disponível
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Os pedidos precisam ter endereço de entrega cadastrado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AudiencePage;
