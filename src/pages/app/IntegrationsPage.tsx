import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AVAILABLE_INTEGRATIONS, Integration } from "@/config/integrations";
import { useAuthStore } from "@/store/authStore";
import { useIntegrationsStore } from "@/store/integrationsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { shopifyIntegrationApi } from "@/lib/api/shopifyIntegrationApi";
import { vtexIntegrationApi } from "@/lib/api/vtexIntegrationApi";
import { nuvemshopIntegrationApi } from "@/lib/api/nuvemshopIntegrationApi";
import { woocommerceIntegrationApi } from "@/lib/api/woocommerceIntegrationApi";
import { mercadolivreIntegrationApi } from "@/lib/api/mercadolivreIntegrationApi";

const IntegrationCard: React.FC<{ integration: Integration }> = React.memo(
  ({ integration }) => {
    const user = useAuthStore((state) => state.user);
    const {
      isIntegrationConnected,
      connectIntegration,
      disconnectIntegration,
    } = useIntegrationsStore();
    const { toast } = useToast();
    const isConnected = isIntegrationConnected(integration.id);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const { comingSoon } = integration;

    const handleToggle = async (checked: boolean) => {
      if (comingSoon || !user) return;

      if (checked) {
        setIsModalOpen(true);
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

    const handleConnect = async () => {
      if (!user) return;

      // Shopify OAuth flow
      if (integration.id === "shopify") {
        const shopName = prompt(
          "Digite o nome da sua loja Shopify (sem .myshopify.com):",
        );
        if (!shopName) return;

        setIsConnecting(true);
        try {
          const result = await shopifyIntegrationApi.startOAuth(shopName);
          if (result.success && result.authUrl) {
            window.location.href = result.authUrl;
          } else {
            throw new Error(result.error || "Failed to start OAuth");
          }
        } catch (error: any) {
          setIsConnecting(false);
          toast({
            title: "Erro ao Conectar Shopify",
            description: error.message || "Não foi possível iniciar conexão.",
            variant: "destructive",
          });
        }
        return;
      }

      // VTEX flow
      if (integration.id === "vtex") {
        const accountName = prompt("Digite o Account Name da sua loja VTEX:");
        if (!accountName) return;

        const appKey = prompt("Digite seu VTEX App Key:");
        if (!appKey) return;

        const appToken = prompt("Digite seu VTEX App Token:");
        if (!appToken) return;

        setIsConnecting(true);
        try {
          const result = await vtexIntegrationApi.connect(
            accountName,
            appKey,
            appToken,
          );
          setIsConnecting(false);
          setIsModalOpen(false);

          if (result.success) {
            toast({
              title: "VTEX Conectado!",
              description: "Sua loja VTEX foi conectada com sucesso.",
            });
            await loadIntegrations(user.id);
          } else {
            throw new Error(result.error || "Failed to connect");
          }
        } catch (error: any) {
          setIsConnecting(false);
          toast({
            title: "Erro ao Conectar VTEX",
            description: error.message || "Não foi possível conectar.",
            variant: "destructive",
          });
        }
        return;
      }

      // Nuvemshop flow
      if (integration.id === "nuvemshop") {
        const storeId = prompt("Digite o Store ID da sua loja Nuvemshop:");
        if (!storeId) return;

        const storeName = prompt("Digite o nome da sua loja:");
        if (!storeName) return;

        const accessToken = prompt("Digite seu Nuvemshop Access Token:");
        if (!accessToken) return;

        setIsConnecting(true);
        try {
          const result = await nuvemshopIntegrationApi.connect(
            storeId,
            storeName,
            accessToken,
          );
          setIsConnecting(false);
          setIsModalOpen(false);

          if (result.success) {
            toast({
              title: "Nuvemshop Conectado!",
              description: "Sua loja Nuvemshop foi conectada com sucesso.",
            });
            await loadIntegrations(user.id);
          } else {
            throw new Error(result.error || "Failed to connect");
          }
        } catch (error: any) {
          setIsConnecting(false);
          toast({
            title: "Erro ao Conectar Nuvemshop",
            description: error.message || "Não foi possível conectar.",
            variant: "destructive",
          });
        }
        return;
      }

      // WooCommerce flow
      if (integration.id === "woocommerce") {
        const siteUrl = prompt(
          "Digite a URL do seu site WooCommerce (ex: https://seusite.com):",
        );
        if (!siteUrl) return;

        const consumerKey = prompt("Digite seu WooCommerce Consumer Key:");
        if (!consumerKey) return;

        const consumerSecret = prompt(
          "Digite seu WooCommerce Consumer Secret:",
        );
        if (!consumerSecret) return;

        setIsConnecting(true);
        try {
          const result = await woocommerceIntegrationApi.connect(
            siteUrl,
            consumerKey,
            consumerSecret,
          );
          setIsConnecting(false);
          setIsModalOpen(false);

          if (result.success) {
            toast({
              title: "WooCommerce Conectado!",
              description: "Sua loja WooCommerce foi conectada com sucesso.",
            });
            await loadIntegrations(user.id);
          } else {
            throw new Error(result.error || "Failed to connect");
          }
        } catch (error: any) {
          setIsConnecting(false);
          toast({
            title: "Erro ao Conectar WooCommerce",
            description: error.message || "Não foi possível conectar.",
            variant: "destructive",
          });
        }
        return;
      }

      // Mercado Livre flow
      if (integration.id === "mercado-livre") {
        setIsConnecting(true);
        try {
          const result = await mercadolivreIntegrationApi.startOAuth();

          if (result.success && result.authUrl) {
            window.location.href = result.authUrl;
          } else {
            throw new Error(result.error || "Failed to start OAuth");
          }
        } catch (error: any) {
          setIsConnecting(false);
          toast({
            title: "Erro ao Conectar Mercado Livre",
            description: error.message || "Não foi possível conectar.",
            variant: "destructive",
          });
        }
        return;
      }

      // Google Ads flow
      if (integration.id === "google-ads") {
        toast({
          title: "Em Desenvolvimento",
          description: "Configure suas credenciais do Google Ads no dashboard.",
        });
        return;
      }

      // Meta Ads flow
      if (integration.id === "meta-ads") {
        toast({
          title: "Em Desenvolvimento",
          description: "Configure suas credenciais do Meta Ads no dashboard.",
        });
        return;
      }

      // Google Analytics flow
      if (integration.id === "google-analytics") {
        toast({
          title: "Em Desenvolvimento",
          description:
            "Configure suas credenciais do Google Analytics no dashboard.",
        });
        return;
      }

      // RD Station flow
      if (integration.id === "rd-station") {
        toast({
          title: "Em Desenvolvimento",
          description: "Configure suas credenciais do RD Station no dashboard.",
        });
        return;
      }

      // WhatsApp flow
      if (integration.id === "whatsapp") {
        toast({
          title: "Em Desenvolvimento",
          description:
            "Configure suas credenciais do WhatsApp Business no dashboard.",
        });
        return;
      }

      // Fluxo normal para outras integrações
      setIsConnecting(true);
      try {
        await connectIntegration(user.id, integration.id);
        setIsConnecting(false);
        setIsModalOpen(false);
        toast({
          title: "Integração Conectada!",
          description: `${integration.name} foi conectado com sucesso.`,
        });
      } catch (error) {
        setIsConnecting(false);
        toast({
          title: "Erro ao Conectar",
          description: "Não foi possível conectar a integração.",
          variant: "destructive",
        });
      }
    };

    const Logo = integration.logo;

    return (
      <>
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <Logo className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                </div>
              </div>
              {comingSoon ? (
                <Badge variant="outline">Em breve</Badge>
              ) : (
                <Switch
                  checked={isConnected}
                  onCheckedChange={handleToggle}
                  aria-label={`Conectar ${integration.name}`}
                />
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {integration.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar com {integration.name}</DialogTitle>
              <DialogDescription>
                Insira sua chave de API para conectar sua conta.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="api-key">Chave de API</Label>
                <Input id="api-key" placeholder="sk_live_..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConnect} loading={isConnecting}>
                Conectar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

IntegrationCard.displayName = "IntegrationCard";

const IntegrationsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const loadIntegrations = useIntegrationsStore(
    (state) => state.loadIntegrations,
  );

  // Carregar integrations do Supabase ao montar
  useEffect(() => {
    if (user) {
      loadIntegrations(user.id);
    }
  }, [user, loadIntegrations]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">
          Conecte suas ferramentas e automatize seu fluxo de trabalho.
        </p>
      </div>
      {AVAILABLE_INTEGRATIONS.map((category) => (
        <motion.div layout key={category.title} className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            {category.title}
          </h2>
          <motion.div
            layout
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
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
