import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Building2,
  CheckCircle2,
  TrendingUp,
  Activity,
  Globe2,
  MapPin,
  Filter,
  Zap,
} from "lucide-react";
import { gatewaysList } from "@/lib/gateways/gatewaysList";
import GatewayCard from "@/components/gateway/GatewayCard";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay?: number;
  subtitle?: string;
  trend?: number;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
  subtitle,
  trend,
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
            <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`h-3 w-3 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}
              />
              <span
                className={`text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {trend >= 0 ? "+" : ""}
                {trend}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                vs mês anterior
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const GatewaysListPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeGatewayIds, setActiveGatewayIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  // Buscar gateways ativos (configurados e ativos)
  useEffect(() => {
    const loadActiveGateways = async () => {
      if (!user?.id) {
        console.log("⚠️ [GATEWAYS] Usuário não logado");
        setLoading(false);
        return;
      }

      console.log(
        "🔍 [GATEWAYS] Buscando gateways ativos para usuário:",
        user.id,
      );

      const { data: configs, error } = await supabase
        .from("GatewayConfig")
        .select("gatewayId, Gateway(name, slug)")
        .eq("userId", user.id)
        .eq("isActive", true);

      console.log("📊 [GATEWAYS] Dados retornados do banco:", configs);

      if (error) {
        console.error("❌ [GATEWAYS] Erro ao buscar configs:", error);
        setLoading(false);
        return;
      }

      if (configs && configs.length > 0) {
        const ids = configs.map((c) => c.gatewayId);
        console.log("🟢 [GATEWAYS] GATEWAYS ATIVOS:", configs.length);
        console.table(configs);
        console.log("🆔 [GATEWAYS] IDs dos gateways ativos:", ids);
        setActiveGatewayIds(ids);
      } else {
        console.log("⚪ [GATEWAYS] Nenhum gateway ativo encontrado");
      }

      setLoading(false);
    };

    loadActiveGateways();
  }, [user?.id]);

  // Gateways populares (hardcoded por enquanto)
  const popularGateways = [
    "mercadopago",
    "stripe",
    "pagseguro",
    "asaas",
    "pagarme",
  ];

  // Calcular métricas
  const metrics = useMemo(() => {
    const total = gatewaysList.length;
    const active = activeGatewayIds.length;
    const nacional = gatewaysList.filter(
      (g) => g.type === "nacional" || g.type === "both",
    ).length;
    const global = gatewaysList.filter(
      (g) => g.type === "global" || g.type === "both",
    ).length;

    return {
      total,
      active,
      nacional,
      global,
      conversionRate: active > 0 ? ((active / total) * 100).toFixed(1) : "0",
    };
  }, [activeGatewayIds]);

  // Filter gateways
  const filteredGateways = useMemo(() => {
    let filtered = gatewaysList;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((gateway) =>
        gateway.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((gateway) => {
        if (typeFilter === "nacional") {
          return gateway.type === "nacional" || gateway.type === "both";
        }
        if (typeFilter === "global") {
          return gateway.type === "global" || gateway.type === "both";
        }
        return true;
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((gateway) =>
          activeGatewayIds.includes(gateway.id),
        );
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(
          (gateway) => !activeGatewayIds.includes(gateway.id),
        );
      }
    }

    return filtered;
  }, [searchTerm, typeFilter, statusFilter, activeGatewayIds]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Gateways de Pagamento
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
          Conecte e gerencie seus métodos de pagamento
        </p>
      </motion.div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Disponível"
          value={metrics.total}
          icon={Building2}
          color="bg-blue-500"
          delay={0.1}
          subtitle="Gateways cadastrados"
        />
        <MetricCard
          title="Gateways Ativos"
          value={metrics.active}
          icon={CheckCircle2}
          color="bg-green-500"
          delay={0.2}
          subtitle="Configurados e funcionando"
          trend={12}
        />
        <MetricCard
          title="Nacionais"
          value={metrics.nacional}
          icon={MapPin}
          color="bg-purple-500"
          delay={0.3}
          subtitle="Gateways brasileiros"
        />
        <MetricCard
          title="Globais"
          value={metrics.global}
          icon={Globe2}
          color="bg-pink-500"
          delay={0.4}
          subtitle="Gateways internacionais"
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Buscar gateway..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px] dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="nacional">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      Nacional
                    </div>
                  </SelectItem>
                  <SelectItem value="global">
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-blue-600" />
                      Global
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px] dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                  <Activity className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Ativos
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                      Inativos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Summary */}
            {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Filtros ativos:
                </span>
                {searchTerm && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  >
                    Busca: {searchTerm}
                  </Badge>
                )}
                {typeFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-500/10 text-purple-700 dark:text-purple-400"
                  >
                    {typeFilter === "nacional" ? "Nacional" : "Global"}
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="bg-green-500/10 text-green-700 dark:text-green-400"
                  >
                    {statusFilter === "active" ? "Ativos" : "Inativos"}
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("all");
                    setStatusFilter("all");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-2"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="flex items-center justify-between"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              Carregando...
            </span>
          ) : (
            <>
              Exibindo{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {filteredGateways.length}
              </span>{" "}
              de{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {gatewaysList.length}
              </span>{" "}
              gateways
            </>
          )}
        </p>
      </motion.div>

      {/* Gateways Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGateways.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhum gateway encontrado
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm
                      ? `Não encontramos gateways com "${searchTerm}"`
                      : "Ajuste os filtros para ver mais resultados"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGateways.map((gateway, index) => {
            const isActive = activeGatewayIds.includes(gateway.id);
            const isPopular = popularGateways.includes(gateway.id);

            return (
              <GatewayCard
                key={gateway.id}
                id={gateway.id}
                name={gateway.name}
                slug={gateway.slug}
                logo={gateway.logo}
                type={gateway.type}
                status={gateway.status}
                environment={gateway.testMode ? "sandbox" : "production"}
                isVerified={gateway.status === "active" && !gateway.testMode}
                isActive={isActive}
                isPopular={isPopular}
                delay={index * 0.05}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GatewaysListPage;
