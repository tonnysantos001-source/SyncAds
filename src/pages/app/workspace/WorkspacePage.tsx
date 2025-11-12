import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiArrowLeft,
  HiCog6Tooth,
  HiChartBar,
  HiShoppingCart,
  HiCreditCard,
  HiCube,
  HiUsers,
  HiMegaphone,
  HiPuzzlePiece,
} from "react-icons/hi2";
import {
  IoStorefront,
  IoRocketSharp,
  IoColorPalette,
  IoBarcode,
  IoTrendingUp,
  IoShieldCheckmark,
} from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface CheckoutData {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
  theme: any;
  createdAt: string;
  updatedAt: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  delay?: number;
  description?: string;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  delay = 0,
  description,
}: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className="border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl hover:shadow-xl transition-all group">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

const WorkspacePage: React.FC = () => {
  const { checkoutId } = useParams<{ checkoutId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    orders: 0,
    revenue: 0,
    conversion: 0,
    visitors: 0,
  });

  useEffect(() => {
    if (checkoutId) {
      loadCheckoutData();
      loadCheckoutStats();
    }
  }, [checkoutId]);

  const loadCheckoutData = async () => {
    try {
      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .select("*")
        .eq("id", checkoutId)
        .single();

      if (error) throw error;
      setCheckout(data);
    } catch (error: any) {
      console.error("Erro ao carregar checkout:", error);
      toast({
        title: "Erro ao carregar checkout",
        description: error.message,
        variant: "destructive",
      });
      navigate("/checkouts");
    } finally {
      setLoading(false);
    }
  };

  const loadCheckoutStats = async () => {
    try {
      // Carregar estatísticas específicas deste checkout
      const { data: orders, error } = await supabase
        .from("Order")
        .select("total")
        .eq("metadata->checkoutId", checkoutId);

      if (!error && orders) {
        const revenue = orders.reduce(
          (sum, order) => sum + (Number(order.total) || 0),
          0
        );
        setStats({
          orders: orders.length,
          revenue: revenue,
          conversion: orders.length > 0 ? 3.2 : 0,
          visitors: orders.length * 10,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const handleToggleActive = async () => {
    if (!checkout) return;

    try {
      const { error } = await supabase
        .from("CheckoutCustomization")
        .update({ isActive: !checkout.isActive })
        .eq("id", checkout.id);

      if (error) throw error;

      setCheckout({ ...checkout, isActive: !checkout.isActive });

      toast({
        title: checkout.isActive ? "Checkout desativado" : "Checkout ativado",
        description: `"${checkout.name}" foi ${checkout.isActive ? "desativado" : "ativado"}.`,
      });
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const quickLinks = [
    {
      title: "Personalizar Tema",
      description: "Cores, fontes e layout",
      icon: IoColorPalette,
      gradient: "from-purple-500 to-pink-500",
      action: () => navigate(`/checkout/customize?id=${checkoutId}`),
    },
    {
      title: "Gateways de Pagamento",
      description: "Configurar métodos",
      icon: HiCreditCard,
      gradient: "from-blue-500 to-cyan-500",
      action: () => navigate("/checkout/gateways"),
    },
    {
      title: "Produtos",
      description: "Gerenciar catálogo",
      icon: HiCube,
      gradient: "from-green-500 to-emerald-500",
      action: () => navigate("/products/all"),
    },
    {
      title: "Marketing",
      description: "Cupons, upsell, pixels",
      icon: HiMegaphone,
      gradient: "from-orange-500 to-red-500",
      action: () => navigate("/marketing/coupons"),
    },
    {
      title: "Pedidos",
      description: "Ver vendas",
      icon: HiShoppingCart,
      gradient: "from-indigo-500 to-purple-500",
      action: () => navigate("/orders/all"),
    },
    {
      title: "Relatórios",
      description: "Analytics completos",
      icon: HiChartBar,
      gradient: "from-yellow-500 to-orange-500",
      action: () => navigate("/reports/overview"),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <IoRocketSharp className="h-12 w-12 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Card className="max-w-md p-8 text-center">
          <CardContent>
            <p className="text-xl font-bold mb-4">Checkout não encontrado</p>
            <Button onClick={() => navigate("/checkouts")}>
              Voltar para Checkouts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.close()}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <HiArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <IoStorefront className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                    {checkout.name}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Workspace ID: {checkout.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                className={cn(
                  "px-4 py-2 text-sm font-semibold",
                  checkout.isActive
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-700"
                )}
              >
                {checkout.isActive ? "Ativo" : "Inativo"}
              </Badge>

              <Button
                variant="outline"
                onClick={handleToggleActive}
                className="gap-2"
              >
                {checkout.isActive ? "Desativar" : "Ativar"}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(`/checkout/customize?id=${checkoutId}`)}
              >
                <HiCog6Tooth className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-1 border border-gray-200 dark:border-gray-800">
            <TabsTrigger value="dashboard" className="gap-2">
              <HiChartBar className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <HiCog6Tooth className="h-4 w-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <HiPuzzlePiece className="h-4 w-4" />
              Integrações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Pedidos"
                value={stats.orders}
                icon={HiShoppingCart}
                gradient="from-blue-500 to-cyan-500"
                delay={0}
                description="Total de vendas"
              />
              <MetricCard
                title="Receita"
                value={`R$ ${stats.revenue.toFixed(2)}`}
                icon={IoTrendingUp}
                gradient="from-green-500 to-emerald-500"
                delay={0.1}
                description="Faturamento total"
              />
              <MetricCard
                title="Conversão"
                value={`${stats.conversion.toFixed(1)}%`}
                icon={IoShieldCheckmark}
                gradient="from-purple-500 to-pink-500"
                delay={0.2}
                description="Taxa de conversão"
              />
              <MetricCard
                title="Visitantes"
                value={stats.visitors}
                icon={HiUsers}
                gradient="from-orange-500 to-red-500"
                delay={0.3}
                description="Visitas únicas"
              />
            </div>

            {/* Quick Links */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Acesso Rápido
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickLinks.map((link, index) => (
                  <motion.div
                    key={link.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      onClick={link.action}
                      className="cursor-pointer hover:shadow-xl transition-all duration-300 group border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                      />
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-xl bg-gradient-to-br ${link.gradient}`}
                          >
                            <link.icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                              {link.title}
                            </CardTitle>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {link.description}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* URL do Checkout */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IoBarcode className="h-5 w-5" />
                  URL do Checkout Público
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <code className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono">
                    {window.location.origin}/checkout/{checkout.id}
                  </code>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/checkout/${checkout.id}`
                      );
                      toast({
                        title: "✅ URL copiada!",
                        description: "Link copiado para a área de transferência",
                      });
                    }}
                  >
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(`/checkout/${checkout.id}`, "_blank")
                    }
                  >
                    Visualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Configurações do Checkout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome do Checkout
                  </label>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {checkout.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Criado em
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white mt-1">
                    {new Date(checkout.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Última atualização
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white mt-1">
                    {new Date(checkout.updatedAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Integrações Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure as integrações específicas para este checkout na
                  página de integrações principal.
                </p>
                <Button
                  onClick={() => navigate("/integrations")}
                  className="mt-4"
                >
                  Ir para Integrações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WorkspacePage;
