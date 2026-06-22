import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { useIntegrationsStore } from "@/store/integrationsStore";
import { useToast } from "@/components/ui/use-toast";
import {
  Settings,
  Search,
  Zap,
  CheckCircle2,
  AlertCircle,
  Link2,
  Grid3x3,
  List,
  ArrowUpRight,
  RefreshCw,
  Play,
  Lock,
  Boxes,
  HelpCircle
} from "lucide-react";

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const {
    dbIntegrations,
    userConfigs,
    loadV2Integrations,
    testConnectionV2,
    syncV2Integration,
    loading
  } = useIntegrationsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadV2Integrations(user.id);
    }
  }, [user, loadV2Integrations]);

  // Categories
  const categories = [
    { id: "all", label: "Todos" },
    { id: "E-commerce", label: "E-commerce" },
    { id: "Logística", label: "Logística" },
    { id: "Atendimento", label: "Atendimento" },
    { id: "Marketing", label: "Marketing" },
    { id: "Automação", label: "Automação" }
  ];

  // Stats
  const totalCount = dbIntegrations.length;
  const connectedCount = userConfigs.filter(c => c.status === "connected").length;
  const availableCount = totalCount - connectedCount;

  // Filter
  const filteredIntegrations = dbIntegrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (integration.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || integration.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getStatusDetails = (integration: any) => {
    if (!integration.implemented) {
      return {
        label: "Em implementação",
        color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        indicator: "bg-gray-500"
      };
    }

    const config = userConfigs.find((c) => c.integration_id === integration.id);

    if (!config) {
      return {
        label: "Não configurado",
        color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        indicator: "bg-slate-400"
      };
    }

    switch (config.status) {
      case "connected":
        return {
          label: "Conectado",
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          indicator: "bg-emerald-500"
        };
      case "pending":
        return {
          label: "Configurado",
          color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          indicator: "bg-amber-500"
        };
      case "failed":
        return {
          label: "Erro",
          color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          indicator: "bg-rose-500"
        };
      default:
        return {
          label: "Não configurado",
          color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          indicator: "bg-slate-400"
        };
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    if (!user) return;
    setTestingId(integrationId);
    try {
      const success = await testConnectionV2(user.id, integrationId);
      if (success) {
        toast({
          title: "✅ Conexão bem-sucedida",
          description: "A integração está respondendo corretamente.",
        });
      } else {
        toast({
          title: "❌ Falha na conexão",
          description: "Verifique suas credenciais e tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Ocorreu um erro ao testar a conexão.",
        variant: "destructive"
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleSync = async (integrationId: string) => {
    if (!user) return;
    setSyncingId(integrationId);
    try {
      await syncV2Integration(user.id, integrationId);
      toast({
        title: "🔄 Sincronização concluída",
        description: "Os dados foram sincronizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "❌ Erro na sincronização",
        description: "Não foi possível sincronizar os dados.",
        variant: "destructive"
      });
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-500/30"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <Link2 className="w-6 h-6 text-blue-500" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Integrações
            </h1>
            <p className="text-gray-600 dark:text-gray-300 font-medium mt-1">
              Conecte suas ferramentas e potencialize seu negócio com sincronização real
            </p>
          </div>
        </div>
      </motion.div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border border-slate-800/80 bg-slate-900/50 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
            <CardContent className="relative pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Integrações
                  </p>
                  <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {totalCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-500/30">
                  <Grid3x3 className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border border-slate-800/80 bg-slate-900/50 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <CardContent className="relative pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Conectadas
                  </p>
                  <p className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {connectedCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border border-slate-800/80 bg-slate-900/50 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-yellow-500/5" />
            <CardContent className="relative pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Disponíveis
                  </p>
                  <p className="text-3xl font-black bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                    {availableCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 backdrop-blur-xl border border-orange-500/30">
                  <Boxes className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Busca e Barra de Ferramentas */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar integrações..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 border-slate-800 bg-slate-900/40 focus:border-primary text-white"
        />
      </div>

      {/* Conteúdo com Sidebar de Categorias */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">
            Categorias
          </p>
          <div className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white border border-transparent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Cards */}
        <div className="col-span-12 md:col-span-9">
          {filteredIntegrations.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
              <div className="inline-flex p-6 rounded-full bg-slate-900/50 mb-4">
                <Search className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">
                Nenhuma integração encontrada
              </h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                Tente ajustar os filtros ou buscar por outro termo.
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredIntegrations.map((integration, index) => {
                  const status = getStatusDetails(integration);
                  const isConnected = userConfigs.some(
                    (c) => c.integration_id === integration.id && c.status === "connected"
                  );

                  return (
                    <motion.div
                      layout
                      key={integration.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group"
                    >
                      <Card className="relative overflow-hidden border border-slate-800 bg-slate-900/30 group-hover:border-slate-700/50 transition-all duration-300 flex flex-col h-full hover:shadow-2xl hover:shadow-primary/5">
                        
                        {/* Status Badge */}
                        <div className="p-4 flex items-center justify-between pb-2">
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-1.5 px-2 py-0.5 font-semibold text-[11px] rounded-full ${status.color}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${status.indicator}`} />
                            {status.label}
                          </Badge>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                            {integration.category}
                          </span>
                        </div>

                        {/* Logo & Nome */}
                        <CardHeader className="pt-2 pb-4 flex flex-row items-center gap-4 space-y-0">
                          <div className="relative w-12 h-12 rounded-2xl bg-slate-950/80 border border-slate-800/80 p-2 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {integration.logo_url ? (
                              <img
                                src={integration.logo_url}
                                alt={integration.name}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  // Fallback em caso de erro de carregamento
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <HelpCircle className="w-6 h-6 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-md font-bold text-white group-hover:text-primary-foreground transition-colors">
                              {integration.name}
                            </CardTitle>
                          </div>
                        </CardHeader>

                        {/* Descrição */}
                        <CardContent className="flex-grow pt-0 pb-4">
                          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                            {integration.description || "Sem descrição disponível."}
                          </p>
                        </CardContent>

                        {/* Botões de Ação */}
                        <div className="p-4 pt-0 border-t border-slate-800/50 mt-auto flex flex-col gap-2">
                          {integration.implemented ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs font-semibold h-9 border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:text-white"
                                onClick={() => navigate(`/integrations/${integration.id}`)}
                              >
                                <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                Configurar
                              </Button>

                              {isConnected && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="flex-1 text-[11px] h-8 text-slate-400 hover:bg-slate-800/60 hover:text-white"
                                    onClick={() => handleTestConnection(integration.id)}
                                    disabled={testingId === integration.id}
                                  >
                                    {testingId === integration.id ? (
                                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <Play className="w-3 h-3 mr-1" />
                                    )}
                                    Testar
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="flex-1 text-[11px] h-8 text-slate-400 hover:bg-slate-800/60 hover:text-white"
                                    onClick={() => handleSync(integration.id)}
                                    disabled={syncingId === integration.id}
                                  >
                                    {syncingId === integration.id ? (
                                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                    )}
                                    Sincronizar
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="w-full text-xs font-semibold h-9 border-slate-800/40 bg-slate-900/10 text-slate-500 opacity-60"
                            >
                              <Lock className="w-3.5 h-3.5 mr-1.5" />
                              Em implementação
                            </Button>
                          )}
                        </div>

                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
