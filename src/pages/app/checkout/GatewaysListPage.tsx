import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Zap,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  Loader2,
  SlidersHorizontal,
  Settings,
  Play,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { gatewaysList } from "@/lib/gateways/gatewaysList";
import GatewayLogo from "@/components/gateway/GatewayLogo";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const GatewaysListPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"gateways" | "retentativa">("gateways");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGatewayIds, setActiveGatewayIds] = useState<string[]>([]);
  const [gatewayConfigsMap, setGatewayConfigsMap] = useState<Record<string, any>>({});
  const [dbConfigs, setDbConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSequence, setSavingSequence] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
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

  // Testar conexão com o gateway
  const handleTestConnection = async (configId: string, gatewayName: string) => {
    if (!configId) return;
    setTestingId(configId);
    toast({
      title: "Testando conexão...",
      description: `Testando gateway ${gatewayName}`,
    });
    try {
      const { data, error } = await supabase.functions.invoke(
        "gateway-config-verify",
        {
          body: {
            configId,
            persistCredentials: false,
          },
        },
      );
      if (error) throw error;
      if (data?.success) {
        toast({
          title: "✅ Conexão bem-sucedida",
          description: data.message || "O gateway respondeu corretamente.",
        });
        await loadActiveGateways();
      } else {
        toast({
          title: "❌ Falha na conexão",
          description: data?.message || "Verifique suas credenciais e tente novamente.",
          variant: "destructive",
        });
        await loadActiveGateways();
      }
    } catch (e: any) {
      toast({
        title: "❌ Erro ao testar conexão",
        description: e?.message || "Ocorreu um erro ao testar a conexão com o gateway.",
        variant: "destructive",
      });
    } finally {
      setTestingId(null);
    }
  };

  // Filtrar gateways para aba principal pelo termo de busca
  const filteredGateways = useMemo(() => {
    let filtered = implementedGateways;

    if (searchTerm) {
      filtered = filtered.filter((gateway: any) =>
        gateway.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [searchTerm, implementedGateways]);

  // Função para retornar os detalhes de status mapeados para badges simplificados
  const getStatusDetails = (status: string) => {
    switch (status) {
      case "active":
      case "connected":
        return {
          label: "Ativo",
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          indicator: "bg-emerald-500",
        };
      case "inactive":
      case "configured_without_test":
        return {
          label: "Inativo",
          color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          indicator: "bg-slate-400",
        };
      case "failed":
        return {
          label: "Erro",
          color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          indicator: "bg-rose-500",
        };
      case "disconnected":
      default:
        return {
          label: "Não configurado",
          color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          indicator: "bg-slate-400",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com gradiente idêntico ao de Integrações */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <SlidersHorizontal className="w-6 h-6 text-blue-500" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Gateways de Pagamento
              </h1>
              <p className="text-gray-600 dark:text-gray-300 font-medium mt-1">
                Configure seus provedores de pagamento e a sequência de retentativa inteligente
              </p>
            </div>
          </div>

          {/* Tab Selector Capsule */}
          <div className="inline-flex p-1 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex-shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("gateways")}
              className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 font-medium ${
                activeTab === "gateways"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Gateways
            </button>
            <button
              onClick={() => setActiveTab("retentativa")}
              className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 font-medium ${
                activeTab === "retentativa"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              Retentativa
            </button>
          </div>
        </div>
      </motion.div>

      {activeTab === "gateways" ? (
        <>
          {/* Barra de busca simplificada */}
          <div className="relative max-w-md my-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar gateway..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-slate-900/30 border-slate-800 text-white rounded-xl placeholder:text-slate-500 focus-visible:ring-blue-500/30"
            />
          </div>

          {/* Grid de Gateways */}
          {loading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card
                  key={i}
                  className="border border-slate-800 bg-slate-900/30 p-5 flex flex-col gap-4 animate-pulse h-[180px]"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-20 rounded-full bg-slate-850" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-2xl bg-slate-850" />
                    <Skeleton className="h-5 w-24 bg-slate-850" />
                  </div>
                  <Skeleton className="h-3 w-full bg-slate-850" />
                  <Skeleton className="h-9 w-full rounded-xl bg-slate-850 mt-auto" />
                </Card>
              ))}
            </div>
          ) : filteredGateways.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
              <h3 className="text-xl font-bold mb-2 text-white">
                Nenhum gateway encontrado
              </h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                Ajuste os termos de busca para visualizar os gateways.
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredGateways.map((gateway: any) => {
                  const config = gatewayConfigsMap[gateway.slug];
                  const isConfigured = !!config;
                  const isActive = config ? config.isActive : false;
                  const statusVal = config 
                    ? (config.isActive ? "active" : config.status || "inactive")
                    : "disconnected";
                  const status = getStatusDetails(statusVal);
                  const isConnected = isConfigured;

                  return (
                    <motion.div
                      layout
                      key={gateway.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group"
                    >
                      <Card 
                        onClick={() => navigate(`/checkout/gateways/${gateway.slug}`)}
                        className="relative overflow-hidden border border-slate-800 bg-slate-900/30 group-hover:bg-slate-855/20 group-hover:border-slate-700/60 transition-all duration-300 cursor-pointer flex flex-col h-full hover:shadow-2xl hover:shadow-primary/5 select-none"
                      >
                        <CardHeader className="p-5 flex flex-row items-center justify-between gap-4 space-y-0 pb-3">
                          <div className="flex items-center gap-4">
                            {/* Logo Container - White background, rounded-xl, no borders, no padding to fill space */}
                            <div className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white p-0 shadow-sm overflow-hidden">
                              <GatewayLogo
                                name={gateway.name}
                                logo={gateway.logo}
                                slug={gateway.slug}
                                size="md"
                                className="w-full h-full object-cover bg-transparent border-none rounded-none p-0"
                              />
                            </div>
                            <div>
                              <CardTitle className="text-md font-bold text-white flex items-center gap-2">
                                {gateway.name}
                                {isActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                              </CardTitle>
                              
                              {/* Sub-badges de tipo e atividade do gateway */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded border-0 uppercase tracking-wider",
                                    gateway.type === "both" 
                                      ? "bg-violet-500/10 text-violet-400" 
                                      : gateway.type === "nacional" 
                                      ? "bg-blue-500/10 text-blue-400" 
                                      : "bg-pink-500/10 text-pink-400"
                                  )}
                                >
                                  {gateway.type === "both" ? "Híbrido" : gateway.type === "nacional" ? "Nacional" : "Global"}
                                </Badge>

                                {isActive && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded border-0 uppercase tracking-wider bg-emerald-500/10 text-emerald-400"
                                  >
                                    Ativo
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Arrow/Chevron */}
                          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-350 group-hover:translate-x-0.5 transition-all duration-200" />
                        </CardHeader>

                        {/* Descrição */}
                        <CardContent className="flex-grow px-5 pt-0 pb-5">
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {gateway.description || "Sem descrição disponível."}
                          </p>
                        </CardContent>

                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
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
            <Card className="border border-slate-800 bg-slate-900/30 p-6 space-y-4">
              <Skeleton className="h-6 w-1/3 bg-slate-850" />
              <Skeleton className="h-12 w-full bg-slate-850" />
              <Skeleton className="h-12 w-full bg-slate-850" />
            </Card>
          ) : sortedConfigs.length === 0 ? (
            <Card className="border border-slate-800 bg-slate-900/30 p-12 text-center rounded-2xl shadow-sm">
              <div className="w-14 h-14 rounded-full bg-slate-950 flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <ShieldAlert className="w-7 h-7 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Nenhum gateway configurado
              </h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Configure pelo menos um gateway de pagamento antes de definir a sequência de retentativa.
              </p>
            </Card>
          ) : (
            /* List of active gateways to order */
            <Card className="border border-slate-800 bg-slate-900/30 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/80 px-6 py-4">
                <CardTitle className="text-base font-semibold text-white">
                  Sequência de Failover dos Gateways
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">
                  Ordene a lista na sequência de processamento desejada. Se o primeiro gateway falhar, a cobrança tentará o segundo e assim por diante.
                </p>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  {sortedConfigs.map((config: any, index: number) => {
                    const gwName = config.Gateway?.name || "Gateway";
                    const gwSlug = config.Gateway?.slug || "";
                    
                    return (
                      <div
                        key={config.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-900/50"
                      >
                        {/* Gateway identification details */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0">
                            <GatewayLogo
                              name={gwName}
                              slug={gwSlug}
                              size="md"
                              className="w-full h-full object-cover border-0 rounded-none bg-transparent"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {gwName}
                            </p>
                            <span className="text-[11px] font-medium text-blue-400">
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
                            className="w-8 h-8 rounded-lg border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-white"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={index === sortedConfigs.length - 1}
                            onClick={() => moveConfig(index, "down")}
                            className="w-8 h-8 rounded-lg border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-white"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Save Sequence Button */}
                <div className="pt-4 border-t border-slate-800 flex justify-end">
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
