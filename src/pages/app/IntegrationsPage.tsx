import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AVAILABLE_INTEGRATIONS, Integration } from "@/config/integrations";
import { useAuthStore } from "@/store/authStore";
import { useIntegrationsStore } from "@/store/integrationsStore";
import { useToast } from "@/components/ui/use-toast";
import {
  Settings,
  Search,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Link2,
  Filter,
  Grid3x3,
  List,
  ArrowUpRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IntegrationCardProps {
  integration: Integration;
  index: number;
}

const IntegrationCard: React.FC<IntegrationCardProps> = React.memo(
  ({ integration, index }) => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const { isIntegrationConnected, disconnectIntegration } =
      useIntegrationsStore();
    const { toast } = useToast();
    const isConnected = isIntegrationConnected(integration.id);
    const { comingSoon } = integration;

    const handleToggle = async (checked: boolean) => {
      if (comingSoon || !user) return;

      if (checked) {
        navigate(`/integrations/${integration.id}`);
      } else {
        try {
          await disconnectIntegration(user.id, integration.id);
          toast({
            title: "✅ Integração Desconectada",
            description: `${integration.name} foi desconectado com sucesso.`,
          });
        } catch (error) {
          toast({
            title: "❌ Erro",
            description: "Não foi possível desconectar a integração.",
            variant: "destructive",
          });
        }
      }
    };

    const handleConfigure = () => {
      navigate(`/integrations/${integration.id}`);
    };

    const Logo = integration.logo;

    // Gradientes diferentes para cada card
    const gradients = [
      "from-blue-500/10 to-purple-500/10",
      "from-purple-500/10 to-pink-500/10",
      "from-pink-500/10 to-rose-500/10",
      "from-green-500/10 to-emerald-500/10",
      "from-orange-500/10 to-red-500/10",
      "from-cyan-500/10 to-blue-500/10",
      "from-indigo-500/10 to-purple-500/10",
      "from-teal-500/10 to-green-500/10",
    ];

    const gradient = gradients[index % gradients.length];

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -5 }}
        className="group"
      >
        <Card
          className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 ${isConnected
              ? "border-green-500/50 bg-gradient-to-br from-green-500/5 to-emerald-500/5"
              : "hover:border-primary/50"
            }`}
        >
          {/* Background gradient decorativo */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
          />

          {/* Blob decorativo */}
          <div
            className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
          />

          <CardHeader className="relative pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <motion.div
                  className={`relative p-3 rounded-xl backdrop-blur-xl border transition-all duration-300 ${isConnected
                      ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30"
                      : "bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20 group-hover:border-primary/50"
                    }`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {isConnected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  <Logo className="h-6 w-6 text-primary" />
                </motion.div>

                <div className="flex-1">
                  <CardTitle className="text-base font-bold mb-1 flex items-center gap-2">
                    {integration.name}
                    {isConnected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <Sparkles className="w-4 h-4 text-green-500" />
                      </motion.div>
                    )}
                  </CardTitle>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleConfigure}
                    className="h-8 w-8 p-0 hover:bg-primary/10 group/btn"
                  >
                    <Settings className="h-4 w-4 group-hover/btn:rotate-90 transition-transform duration-300" />
                  </Button>
                )}
                {comingSoon ? (
                  <Badge
                    variant="outline"
                    className="text-xs bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Em breve
                  </Badge>
                ) : (
                  <Switch
                    checked={isConnected}
                    onCheckedChange={handleToggle}
                    aria-label={`Conectar ${integration.name}`}
                    className="data-[state=checked]:bg-green-500"
                  />
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {integration.description}
            </p>

            <div className="flex items-center justify-between mt-4">
              {isConnected ? (
                <motion.div
                  initial={{ scale: 0, x: -20 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0 font-semibold">
                    <Zap className="w-3 h-3 mr-1" />
                    Conectado
                  </Badge>
                </motion.div>
              ) : (
                <div className="h-6" /> // Spacer
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleConfigure}
                className="text-xs hover:bg-primary/10 group/link opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Ver detalhes
                <ArrowUpRight className="w-3 h-3 ml-1 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Button>
            </div>
          </CardContent>

          {/* Borda animada quando conectado */}
          {isConnected && (
            <motion.div
              className="absolute inset-0 rounded-lg border-2 border-green-500/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ pointerEvents: "none" }}
            />
          )}
        </Card>
      </motion.div>
    );
  },
);

IntegrationCard.displayName = "IntegrationCard";

const IntegrationsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const loadIntegrations = useIntegrationsStore(
    (state) => state.loadIntegrations,
  );
  const { integrations } = useIntegrationsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "connected" | "available"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (user) {
      loadIntegrations(user.id);
    }
  }, [user, loadIntegrations]);

  // Estatísticas
  const totalIntegrations = AVAILABLE_INTEGRATIONS.reduce(
    (acc, cat) => acc + cat.integrations.length,
    0,
  );
  const connectedCount = Object.keys(integrations).length;
  const availableCount = totalIntegrations - connectedCount;

  // Filtrar integrações
  const filteredCategories = AVAILABLE_INTEGRATIONS.map((category) => ({
    ...category,
    integrations: category.integrations.filter((integration) => {
      const matchesSearch =
        searchQuery === "" ||
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const isConnected = Object.keys(integrations).includes(integration.id);
      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "connected" && isConnected) ||
        (filterStatus === "available" && !isConnected);

      return matchesSearch && matchesFilter;
    }),
  })).filter((cat) => cat.integrations.length > 0);

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
              Conecte suas ferramentas e potencialize seu negócio
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
          <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:border-blue-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
            <CardContent className="relative pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Integrações
                  </p>
                  <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {totalIntegrations}
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
          <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:border-green-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
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
          <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:border-orange-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10" />
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
                  <Sparkles className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filtros e busca */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar integrações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 border-2 focus:border-primary"
          />
        </div>

        <Select
          value={filterStatus}
          onValueChange={(value: any) => setFilterStatus(value)}
        >
          <SelectTrigger className="w-full md:w-[200px] h-11 border-2">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="connected">Conectadas</SelectItem>
            <SelectItem value="available">Disponíveis</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="h-11 w-11"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="h-11 w-11"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Lista de integrações por categoria */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-gray-500/10 to-gray-600/10 mb-4">
            <Search className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">
            Nenhuma integração encontrada
          </h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou buscar por outro termo
          </p>
        </div>
      ) : (
        filteredCategories.map((category, catIndex) => (
          <motion.div
            layout
            key={category.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: catIndex * 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-1 h-8 rounded-full bg-gradient-to-b from-primary to-purple-600"
              />
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                {category.title}
              </h2>
              <Badge variant="outline" className="ml-auto">
                {category.integrations.length}
              </Badge>
            </div>

            <motion.div
              layout
              className={
                viewMode === "grid"
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-4"
              }
            >
              {category.integrations.map((integration, index) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  index={index}
                />
              ))}
            </motion.div>
          </motion.div>
        ))
      )}
    </div>
  );
};

export default IntegrationsPage;
