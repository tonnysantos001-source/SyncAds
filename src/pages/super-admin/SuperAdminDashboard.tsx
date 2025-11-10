import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { supabase } from "@/lib/supabase";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  HiUsers,
  HiCurrencyDollar,
  HiSparkles,
  HiChatBubbleBottomCenterText,
  HiCreditCard,
  HiChartBar,
  HiArrowTrendingUp,
  HiCheckCircle,
} from "react-icons/hi2";
import {
  IoRocketSharp,
  IoTrendingUp,
  IoFlash,
  IoCheckmarkCircle,
  IoArrowForward,
} from "react-icons/io5";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalAiConnections: number;
  totalMessages: number;
  totalTokens: number;
  gatewaysConfigured: number;
  plansDistribution: {
    free: number;
    starter: number;
    pro: number;
    enterprise: number;
  };
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
  delay = 0,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  trend?: { value: string; positive: boolean };
  delay?: number;
  onClick?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.02 }}
    className="cursor-pointer"
    onClick={onClick}
  >
    <Card className="relative overflow-hidden border-gray-700/50 bg-gray-900/50 backdrop-blur-xl hover:border-gray-600 transition-all duration-300 group">
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity ${gradient}`}
      />

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center justify-between">
          <div
            className={`p-3 rounded-xl ${gradient} bg-opacity-20 backdrop-blur-sm`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <Badge
              variant={trend.positive ? "default" : "destructive"}
              className="gap-1"
            >
              <IoTrendingUp
                className={`w-3 h-3 ${trend.positive ? "" : "rotate-180"}`}
              />
              {trend.value}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalAiConnections: 0,
    totalMessages: 0,
    totalTokens: 0,
    gatewaysConfigured: 0,
    plansDistribution: {
      free: 0,
      starter: 0,
      pro: 0,
      enterprise: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Total users
      const { count: userCount } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true });

      // Active users
      const { count: activeUserCount } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true })
        .eq("isActive", true);

      // Total AI connections
      const { count: aiCount } = await supabase
        .from("GlobalAiConnection")
        .select("*", { count: "exact", head: true });

      // Total messages
      const { count: messagesCount } = await supabase
        .from("ChatMessage")
        .select("*", { count: "exact", head: true });

      // Total tokens
      const { data: usageData } = await supabase
        .from("PlanDailyUsage")
        .select("aiMessagesUsed, aiImagesUsed");

      const totalMessages =
        usageData?.reduce(
          (acc, usage) => acc + (usage.aiMessagesUsed || 0),
          0,
        ) || 0;

      // Gateways configurados
      const { count: gatewaysCount } = await supabase
        .from("GatewayConfig")
        .select("*", { count: "exact", head: true });

      // Distribuição de planos
      const { data: usersData } = await supabase
        .from("User")
        .select("plan")
        .eq("isActive", true);

      const plansDistribution = {
        free:
          usersData?.filter((u) => u.plan === "FREE" || !u.plan).length || 0,
        starter: usersData?.filter((u) => u.plan === "STARTER").length || 0,
        pro: usersData?.filter((u) => u.plan === "PRO").length || 0,
        enterprise:
          usersData?.filter((u) => u.plan === "ENTERPRISE").length || 0,
      };

      // Calcular MRR
      const planPrices = {
        free: 0,
        starter: 49.9,
        pro: 199.9,
        enterprise: 999.9,
      };

      const mrr =
        plansDistribution.starter * planPrices.starter +
        plansDistribution.pro * planPrices.pro +
        plansDistribution.enterprise * planPrices.enterprise;

      setStats({
        totalUsers: userCount || 0,
        activeUsers: activeUserCount || 0,
        totalRevenue: mrr * 3,
        monthlyRevenue: mrr,
        totalAiConnections: aiCount || 0,
        totalMessages: messagesCount || 0,
        totalTokens: totalMessages,
        gatewaysConfigured: gatewaysCount || 0,
        plansDistribution,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 animate-pulse">
              Carregando estatísticas...
            </p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-black text-white">
            Dashboard Administrativo
          </h1>
          <p className="text-gray-400">
            Visão geral completa do sistema e métricas principais
          </p>
        </motion.div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Usuários"
            value={formatNumber(stats.totalUsers)}
            subtitle={`${stats.activeUsers} ativos`}
            icon={HiUsers}
            gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
            trend={{ value: "+12%", positive: true }}
            delay={0}
            onClick={() => navigate("/super-admin/clients")}
          />

          <StatCard
            title="Receita Mensal (MRR)"
            value={formatCurrency(stats.monthlyRevenue)}
            subtitle="Receita recorrente"
            icon={HiCurrencyDollar}
            gradient="bg-gradient-to-br from-green-500 to-emerald-500"
            trend={{ value: "+8%", positive: true }}
            delay={0.1}
            onClick={() => navigate("/super-admin/billing")}
          />

          <StatCard
            title="Mensagens IA"
            value={formatNumber(stats.totalMessages)}
            subtitle="Total de interações"
            icon={HiChatBubbleBottomCenterText}
            gradient="bg-gradient-to-br from-purple-500 to-pink-500"
            trend={{ value: "+24%", positive: true }}
            delay={0.2}
            onClick={() => navigate("/super-admin/usage")}
          />

          <StatCard
            title="Gateways Ativos"
            value={stats.gatewaysConfigured}
            subtitle="Configurados e prontos"
            icon={HiCreditCard}
            gradient="bg-gradient-to-br from-orange-500 to-red-500"
            delay={0.3}
            onClick={() => navigate("/super-admin/gateways")}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HiSparkles className="w-5 h-5 text-purple-400" />
                  Conexões de IA
                </CardTitle>
                <CardDescription className="text-gray-400">
                  IAs globais configuradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-white">
                    {stats.totalAiConnections}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/super-admin/ai-connections")}
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                  >
                    Ver todas
                    <IoArrowForward className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HiChartBar className="w-5 h-5 text-blue-400" />
                  Taxa de Ativação
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Usuários ativos vs total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold text-white">
                      {Math.round((stats.activeUsers / stats.totalUsers) * 100)}
                      %
                    </span>
                    <Badge
                      variant="default"
                      className="bg-green-500/20 text-green-400 border-green-500/30"
                    >
                      <IoCheckmarkCircle className="mr-1 w-3 h-3" />
                      Ótimo
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(stats.activeUsers / stats.totalUsers) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <IoRocketSharp className="w-5 h-5 text-orange-400" />
                  Crescimento Trimestral
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Receita estimada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(stats.totalRevenue)}
                  </span>
                  <IoTrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Plans Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">
                    Distribuição de Planos
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Usuários por plano de assinatura
                  </CardDescription>
                </div>
                <Button
                  onClick={() => navigate("/super-admin/plans")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Gerenciar Planos
                  <IoArrowForward className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    name: "Gratuito",
                    count: stats.plansDistribution.free,
                    color: "from-gray-500 to-gray-600",
                    icon: HiUsers,
                  },
                  {
                    name: "Starter",
                    count: stats.plansDistribution.starter,
                    color: "from-blue-500 to-cyan-500",
                    icon: IoFlash,
                  },
                  {
                    name: "Pro",
                    count: stats.plansDistribution.pro,
                    color: "from-purple-500 to-pink-500",
                    icon: HiArrowTrendingUp,
                  },
                  {
                    name: "Enterprise",
                    count: stats.plansDistribution.enterprise,
                    color: "from-orange-500 to-red-500",
                    icon: IoRocketSharp,
                  },
                ].map((plan, index) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="relative p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-gray-600 transition-all group"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-5 group-hover:opacity-10 rounded-xl transition-opacity`}
                    />
                    <div className="relative space-y-2">
                      <plan.icon className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" />
                      <p className="text-sm text-gray-400">{plan.name}</p>
                      <p className="text-2xl font-bold text-white">
                        {plan.count}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Ações Rápidas</CardTitle>
              <CardDescription className="text-gray-400">
                Acesso rápido às principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => navigate("/super-admin/chat")}
                  variant="outline"
                  className="justify-start h-auto py-4 border-gray-700 hover:border-purple-500 hover:bg-purple-500/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <HiChatBubbleBottomCenterText className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">Chat Admin</p>
                      <p className="text-xs text-gray-400">
                        Conversar com IA como admin
                      </p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => navigate("/super-admin/clients")}
                  variant="outline"
                  className="justify-start h-auto py-4 border-gray-700 hover:border-blue-500 hover:bg-blue-500/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <HiUsers className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">
                        Gerenciar Clientes
                      </p>
                      <p className="text-xs text-gray-400">
                        Ver e gerenciar usuários
                      </p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => navigate("/super-admin/payment-split")}
                  variant="outline"
                  className="justify-start h-auto py-4 border-gray-700 hover:border-green-500 hover:bg-green-500/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <HiCurrencyDollar className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">
                        Split de Pagamento
                      </p>
                      <p className="text-xs text-gray-400">
                        Configurar divisão de receita
                      </p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
}
