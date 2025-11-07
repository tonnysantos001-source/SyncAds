import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { gatewaysList } from "@/lib/gateways/gatewaysList";
import GatewayCard from "@/components/gateway/GatewayCard";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

const GatewaysListPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGatewayIds, setActiveGatewayIds] = useState<string[]>([]);
  const user = useAuthStore((state) => state.user);

  // Buscar gateways ativos (configurados e ativos)
  useEffect(() => {
    const loadActiveGateways = async () => {
      if (!user?.id) {
        console.log("⚠️ [GATEWAYS] Usuário não logado");
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
        return;
      }

      if (configs && configs.length > 0) {
        const ids = configs.map((c) => c.gatewayId);
        console.log("🟢🟢🟢 [GATEWAYS] GATEWAYS ATIVOS:", configs.length);
        console.table(configs);
        console.log("🆔 [GATEWAYS] IDs dos gateways ativos:", ids);
        setActiveGatewayIds(ids);
      } else {
        console.log("⚪ [GATEWAYS] Nenhum gateway ativo encontrado");
      }
    };

    loadActiveGateways();
  }, [user?.id]);

  // Filter gateways
  const filteredGateways = useMemo(() => {
    let filtered = gatewaysList;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((gateway) =>
        gateway.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return filtered;
  }, [searchTerm]);

  // Debug: Log quando renderizar
  useEffect(() => {
    console.log("🎨 [GATEWAYS] Página renderizada");
    console.log("📋 [GATEWAYS] Total de gateways:", gatewaysList.length);
    console.log("🟢 [GATEWAYS] Gateways ativos (IDs):", activeGatewayIds);
  }, [activeGatewayIds]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gateways
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gateways de pagamento disponíveis para seu e-commerce
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar gateway..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Gateways Grid */}
      {filteredGateways.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "Nenhum gateway encontrado com esse nome."
                : "Nenhum gateway disponível."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGateways.map((gateway) => {
            const isActive = activeGatewayIds.includes(gateway.id);

            // Log individual para cada gateway
            if (isActive) {
              console.log(
                `🟢 [CARD] ${gateway.name} está ATIVO (ID: ${gateway.id})`,
              );
            }

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
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GatewaysListPage;
