import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_INTEGRATIONS, Integration } from "@/config/integrations";
import { useAuthStore } from "@/store/authStore";
import { useIntegrationsStore } from "@/store/integrationsStore";
import { useToast } from "@/components/ui/use-toast";
import { Settings } from "lucide-react";

const IntegrationCard: React.FC<{ integration: Integration }> = React.memo(
  ({ integration }) => {
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
        // Navegar para página de configuração
        navigate(`/integrations/${integration.id}`);
      } else {
        try {
          await disconnectIntegration(user.id, integration.id);
          toast({
            title: "Integração Desconectada",
            description: `${integration.name} foi desconectado com sucesso.`,
          });
        } catch (error) {
          toast({
            title: "Erro",
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

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Logo className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  {integration.name}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleConfigure}
                  className="h-8 w-8 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              {comingSoon ? (
                <Badge variant="outline" className="text-xs">
                  Em breve
                </Badge>
              ) : (
                <Switch
                  checked={isConnected}
                  onCheckedChange={handleToggle}
                  aria-label={`Conectar ${integration.name}`}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {integration.description}
            </p>
            {isConnected && (
              <Badge className="mt-3 bg-green-500 hover:bg-green-600">
                Conectado
              </Badge>
            )}
          </CardContent>
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

  useEffect(() => {
    if (user) {
      loadIntegrations(user.id);
    }
  }, [user, loadIntegrations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20 p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Integrações
        </h1>
        <p className="text-gray-600 dark:text-gray-300 font-medium mt-2">
          Conecte suas ferramentas favoritas e automatize seu fluxo de trabalho
        </p>
      </div>

      {AVAILABLE_INTEGRATIONS.map((category) => (
        <motion.div layout key={category.title} className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            {category.title}
          </h2>
          <motion.div
            layout
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {category.integrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};

export default IntegrationsPage;
