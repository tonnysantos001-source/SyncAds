import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { gatewaysList } from "@/lib/gateways/gatewaysList";
import GatewayCard from "@/components/gateway/GatewayCard";
import GatewayLogo from "@/components/gateway/GatewayLogo";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden border border-gray-100 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
        <div
          className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 rounded-full blur-2xl`}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </CardTitle>
          <div className={`p-1.5 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}>
            <Icon className={`h-4.5 w-4.5 ${color.replace("bg-", "text-")}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          {subtitle && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp
                className={`h-3 w-3 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}
              />
              <span
                className={`text-[11px] font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {trend >= 0 ? "+" : ""}
                {trend}%
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
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
  const [activeTab, setActiveTab] = useState<"gateways" | "retentativa">("gateways");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeGatewayIds, setActiveGatewayIds] = useState<string[]>([]);
  const [gatewayConfigsMap, setGatewayConfigsMap] = useState<Record<string, any>>({});
  const [dbConfigs, setDbConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSequence, setSavingSequence] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const [sortedConfigs, setSortedConfigs] = useState<any[]>([]);

  // Filtrar apenas gateways realmente implementados no frontend
  const implementedGateways = useMemo(() => {
    return gatewaysList.filter((g) => g.implemented === true);
  }, []);

  // Buscar gateways ativos (configurados e ativos) e seus status ricos de conexão
  const loadActiveGateways = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: configs, error } = await supabase
        .from("GatewayConfig")
        .select(`
          id,
          isActive,
          priority,
          status,
          Gateway:payment_gateways(id, slug, name)
        `)
        .eq("userId", user.id);

      if (error) {
        console.error("❌ [GATEWAYS] Erro ao buscar configs:", error);
        return;
      }

      if (configs && configs.length > 0) {
        const configMap: Record<string, any> = {};
        const activeIds: string[] = [];

        configs.forEach((c) => {
          const slug = c.Gateway?.slug;
          if (slug) {
            configMap[slug] = c;
            if (c.isActive) {
              activeIds.push(slug);
            }
          }
        });

        setDbConfigs(configs);
        setActiveGatewayIds(activeIds);
        setGatewayConfigsMap(configMap);
      } else {
        setDbConfigs([]);
        setActiveGatewayIds([]);
        setGatewayConfigsMap({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveGateways();
  }, [user?.id]);

  // Filtrar e ordenar apenas as configs que estão ativas e válidas para retentativa
  const activeConfigs = useMemo(() => {
    return dbConfigs.filter((c) => c.isActive && c.Gateway?.slug);
  }, [dbConfigs]);

  // Manter sortedConfigs sincronizado quando as configs do banco mudarem
  useEffect(() => {
    const sorted = [...activeConfigs].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    setSortedConfigs(sorted);
  }, [activeConfigs]);

  // Função para mover itens na lista de retentativa
  const moveConfig = (index: number, direction: "up" | "down") => {
    const newConfigs = [...sortedConfigs];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newConfigs.length) return;

    // Swap
    const temp = newConfigs[index];
    newConfigs[index] = newConfigs[targetIndex];
    newConfigs[targetIndex] = temp;

    setSortedConfigs(newConfigs);
  };

  // Salvar a nova sequência de prioridades no banco
  const handleSaveSequence = async () => {
    setSavingSequence(true);
    try {
      const updates = sortedConfigs.map((config, index) =>
        supabase
          .from("GatewayConfig")
          .update({ priority: index })
          .eq("id", config.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        throw new Error("Erro ao salvar prioridades no banco de dados.");
      }

      toast({
        title: "Sequência de retentativa salva!",
        description: "A ordem de retentativa dos gateways foi atualizada com sucesso.",
      });

      await loadActiveGateways();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao salvar sequência",
        description: error.message || "Ocorreu um erro ao atualizar as prioridades.",
        variant: "destructive",
      });
    } finally {
      setSavingSequence(false);
    }
  };

  // Gateways populares
  const popularGateways = [
    "mercadopago",
    "stripe",
    "pagseguro",
    "asaas",
    "pagarme",
  ];

  // Calcular métricas
  const metrics = useMemo(() => {
    const total = implementedGateways.length;
    const active = activeGatewayIds.length;
    const nacional = implementedGateways.filter(
      (g) => g.type === "nacional" || g.type === "both",
    ).length;
    const global = implementedGateways.filter(
      (g) => g.type === "global" || g.type === "both",
    ).length;

    return {
      total,
      active,
      nacional,
      global,
    };
  }, [activeGatewayIds, implementedGateways]);

  // Filtrar gateways para aba principal
  const filteredGateways = useMemo(() => {
    let filtered = implementedGateways;

    if (searchTerm) {
      filtered = filtered.filter((gateway) =>
        gateway.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

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
  }, [searchTerm, typeFilter, statusFilter, activeGatewayIds, implementedGateways]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header com Abas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Formas de Pagamento
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie os gateways de pagamento, formas de pagamento e configurações de retentativa.
          </p>
        </div>

        {/* Tab Selector Capsule */}
        <div className="inline-flex p-1 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/30 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("gateways")}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 font-medium ${
              activeTab === "gateways"
                ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Gateways
          </button>
          <button
            onClick={() => setActiveTab("retentativa")}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 font-medium ${
              activeTab === "retentativa"
                ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            <Zap className="w-4 h-4" />
            Retentativa
          </button>
        </div>
      </div>

      {activeTab === "gateways" ? (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              title="Total Disponível"
              value={metrics.total}
              icon={Building2}
              color="bg-blue-500"
              subtitle="Gateways cadastrados"
            />
            <MetricCard
              title="Gateways Ativos"
              value={metrics.active}
              icon={CheckCircle2}
              color="bg-green-500"
              subtitle="Configurados e ativos"
            />
            <MetricCard
              title="Nacionais"
              value={metrics.nacional}
              icon={MapPin}
              color="bg-purple-500"
              subtitle="Gateways brasileiros"
            />
            <MetricCard
              title="Globais"
              value={metrics.global}
              icon={Globe2}
              color="bg-pink-500"
              subtitle="Gateways internacionais"
            />
          </div>

          {/* Filters Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm">
              <CardContent className="p-4 flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Buscar gateway..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="nacional">Nacional</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                      <Activity className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Carregando gateways...
              </span>
            ) : (
              <span>
                Exibindo <span className="font-semibold text-gray-900 dark:text-white">{filteredGateways.length}</span> de{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{implementedGateways.length}</span> gateways
              </span>
            )}
          </div>

          {/* Gateways Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <Card
                  key={i}
                  className="border border-gray-100 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 p-5 flex items-center gap-4"
                >
                  <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredGateways.length === 0 ? (
            <Card className="border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 p-12 text-center">
              <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-950 dark:text-white mb-1">
                Nenhum gateway encontrado
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ajuste os filtros ou tente outra busca.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGateways.map((gateway, index) => {
                const isActive = activeGatewayIds.includes(gateway.id);
                const isPopular = popularGateways.includes(gateway.id);
                const config = gatewayConfigsMap[gateway.id];
                const connectionStatus = config ? config.status : "not_configured";

                return (
                  <GatewayCard
                    key={gateway.id}
                    id={gateway.id}
                    name={gateway.name}
                    slug={gateway.slug}
                    logo={gateway.logo}
                    type={gateway.type}
                    status={gateway.status}
                    isVerified={gateway.status === "active" && !gateway.testMode}
                    isActive={isActive}
                    isPopular={isPopular}
                    connectionStatus={connectionStatus}
                    description={gateway.description}
                    delay={index * 0.03}
                  />
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Retentativa (Failover) tab panel */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          {loading ? (
            <Card className="border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </Card>
          ) : sortedConfigs.length === 0 ? (
            /* Empty State exactly matching user reference (Corvex layout, image 4) */
            <Card className="border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 p-12 text-center rounded-2xl shadow-sm">
              <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700/50">
                <ShieldAlert className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Nenhum gateway configurado
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                Configure pelo menos um gateway de pagamento antes de definir a sequência de retentativa.
              </p>
            </Card>
          ) : (
            /* List of active gateways to order */
            <Card className="border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800/80 px-6 py-4">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  Sequência de Failover dos Gateways
                </CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ordene a lista na sequência de processamento desejada. Se o primeiro gateway falhar, a cobrança tentará o segundo e assim por diante.
                </p>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  {sortedConfigs.map((config, index) => {
                    const gwName = config.Gateway?.name || "Gateway";
                    const gwSlug = config.Gateway?.slug || "";
                    
                    return (
                      <div
                        key={config.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-950 shadow-sm"
                      >
                        {/* Gateway identification details */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <GatewayLogo
                              name={gwName}
                              slug={gwSlug}
                              size="sm"
                              className="border-0 bg-transparent rounded-none"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {gwName}
                            </p>
                            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                              {index === 0
                                ? "1º Gateway (Principal)"
                                : `${index + 1}º Gateway (Retentativa)`}
                            </span>
                          </div>
                        </div>

                        {/* Order adjustment actions */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => moveConfig(index, "up")}
                            className="w-8 h-8 rounded-lg border-gray-200 dark:border-gray-800 dark:text-white"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={index === sortedConfigs.length - 1}
                            onClick={() => moveConfig(index, "down")}
                            className="w-8 h-8 rounded-lg border-gray-200 dark:border-gray-800 dark:text-white"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Save Sequence Button */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 flex justify-end">
                  <Button
                    onClick={handleSaveSequence}
                    disabled={savingSequence || sortedConfigs.length <= 1}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-5"
                  >
                    {savingSequence ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Sequência"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default GatewaysListPage;
