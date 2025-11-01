import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  Calendar,
  Download,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Activity,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import paymentMetricsApi, {
  CheckoutMetrics,
  PaymentAlert,
  GatewayMetrics,
  GatewaySuccessRate,
  FailingGateway,
} from "@/lib/api/paymentMetricsApi";

const ReportsOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [metrics, setMetrics] = useState<CheckoutMetrics>({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    refundedTransactions: 0,
    totalRevenue: 0,
    refundedRevenue: 0,
    netRevenue: 0,
    avgTicket: 0,
    successRate: 0,
    failureRate: 0,
    conversionRate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [gatewayMetrics, setGatewayMetrics] = useState<GatewayMetrics[]>([]);
  const [successRates, setSuccessRates] = useState<GatewaySuccessRate[]>([]);
  const [failingGateways, setFailingGateways] = useState<FailingGateway[]>([]);
  const [retryStats, setRetryStats] = useState({
    pending: 0,
    processing: 0,
    success: 0,
    failed: 0,
  });

  const [checkoutSetup, setCheckoutSetup] = useState({
    billing: false,
    domain: false,
    gateway: false,
    shipping: false,
    loading: true,
  });

  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCheckoutMetrics(),
        loadAlerts(),
        loadGatewayMetrics(),
        loadSuccessRates(),
        loadFailingGateways(),
        loadRetryStats(),
        loadCheckoutSetupStatus(),
      ]);
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCheckoutMetrics = async () => {
    if (!user?.id) return;
    try {
      const data = await paymentMetricsApi.getCheckoutMetrics(user.id);
      setMetrics(data);
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    }
  };

  const loadAlerts = async () => {
    if (!user?.id) return;
    try {
      const data = await paymentMetricsApi.getActiveAlerts(user.id);
      setAlerts(data);
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
    }
  };

  const loadGatewayMetrics = async () => {
    if (!user?.id) return;
    try {
      const data = await paymentMetricsApi.getGatewayMetrics(user.id);
      setGatewayMetrics(data.slice(0, 5)); // Top 5
    } catch (error) {
      console.error("Erro ao carregar métricas de gateway:", error);
    }
  };

  const loadSuccessRates = async () => {
    if (!user?.id) return;
    try {
      const data = await paymentMetricsApi.getGatewaySuccessRates(user.id);
      setSuccessRates(data.slice(0, 5)); // Top 5
    } catch (error) {
      console.error("Erro ao carregar taxas de sucesso:", error);
    }
  };

  const loadFailingGateways = async () => {
    if (!user?.id) return;
    try {
      const data = await paymentMetricsApi.getFailingGateways(user.id);
      setFailingGateways(data);
    } catch (error) {
      console.error("Erro ao carregar gateways com falha:", error);
    }
  };

  const loadRetryStats = async () => {
    if (!user?.id) return;
    try {
      const data = await paymentMetricsApi.getRetryStats(user.id);
      setRetryStats(data);
    } catch (error) {
      console.error("Erro ao carregar stats de retry:", error);
    }
  };

  const loadCheckoutSetupStatus = async () => {
    if (!user?.id) return;
    try {
      const [billing, domain, gateway, shipping] = await Promise.all([
        checkBillingStatus(),
        checkDomainStatus(),
        checkGatewayStatus(),
        checkShippingStatus(),
      ]);

      setCheckoutSetup({
        billing,
        domain,
        gateway,
        shipping,
        loading: false,
      });
    } catch (error) {
      console.error("Erro ao verificar setup:", error);
      setCheckoutSetup((prev) => ({ ...prev, loading: false }));
    }
  };

  const checkBillingStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data } = await supabase
        .from("User")
        .select("currentPlanId")
        .eq("id", user.id)
        .single();
      return !!data?.currentPlanId;
    } catch {
      return false;
    }
  };

  const checkDomainStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data } = await supabase
        .from("User")
        .select("domain, domainVerified")
        .eq("id", user.id)
        .single();
      return !!(data?.domain && data?.domainVerified);
    } catch {
      return false;
    }
  };

  const checkGatewayStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data } = await supabase
        .from("GatewayConfig")
        .select("id")
        .eq("userId", user.id)
        .eq("isActive", true)
        .limit(1);
      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  };

  const checkShippingStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data } = await supabase
        .from("ShippingMethod")
        .select("id")
        .eq("userId", user.id)
        .eq("isActive", true)
        .limit(1);
      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await paymentMetricsApi.refreshMetrics();
      await loadAllData();
    } catch (error) {
      console.error("Erro ao atualizar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!user?.id) return;
    try {
      await paymentMetricsApi.acknowledgeAlert(alertId, user.id);
      await loadAlerts();
    } catch (error) {
      console.error("Erro ao reconhecer alerta:", error);
    }
  };

  const handleExportReport = async () => {
    if (!user?.id) return;
    try {
      const blob = await paymentMetricsApi.exportTransactionReport(user.id, {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transacoes_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "error":
        return "destructive";
      case "warning":
        return "default";
      default:
        return "secondary";
    }
  };

  const setupProgress = checkoutSetup.loading
    ? 0
    : [
        checkoutSetup.billing,
        checkoutSetup.domain,
        checkoutSetup.gateway,
        checkoutSetup.shipping,
      ].filter(Boolean).length * 25;

  if (loading && metrics.totalTransactions === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard de Pagamentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Métricas e relatórios completos do checkout
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alertas Críticos */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={
                alert.severity === "critical" ? "destructive" : "default"
              }
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <div className="flex-1">
                  <strong>{alert.title}</strong>
                  <p className="text-sm mt-1">{alert.message}</p>
                  {alert.gatewayName && (
                    <Badge variant="outline" className="mt-2">
                      {alert.gatewayName}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                >
                  Reconhecer
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Setup do Checkout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            Configuração do Checkout
          </CardTitle>
          <CardDescription>
            Complete a configuração para começar a receber pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-gray-500">{setupProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${setupProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                {checkoutSetup.billing ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300" />
                )}
                <span className="text-sm">Plano de Faturamento</span>
                {!checkoutSetup.billing && (
                  <Button
                    size="sm"
                    variant="link"
                    className="ml-auto"
                    onClick={() => navigate("/billing")}
                  >
                    Configurar <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {checkoutSetup.domain ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300" />
                )}
                <span className="text-sm">Domínio Verificado</span>
                {!checkoutSetup.domain && (
                  <Button
                    size="sm"
                    variant="link"
                    className="ml-auto"
                    onClick={() => navigate("/checkout/domain")}
                  >
                    Configurar <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {checkoutSetup.gateway ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300" />
                )}
                <span className="text-sm">Gateway de Pagamento</span>
                {!checkoutSetup.gateway && (
                  <Button
                    size="sm"
                    variant="link"
                    className="ml-auto"
                    onClick={() => navigate("/checkout/gateways")}
                  >
                    Configurar <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {checkoutSetup.shipping ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300" />
                )}
                <span className="text-sm">Métodos de Envio</span>
                {!checkoutSetup.shipping && (
                  <Button
                    size="sm"
                    variant="link"
                    className="ml-auto"
                    onClick={() => navigate("/checkout/shipping")}
                  >
                    Configurar <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Líquido: {formatCurrency(metrics.netRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalTransactions}
            </div>
            <div className="flex gap-3 mt-1">
              <p className="text-xs text-green-600">
                ✓ {metrics.successfulTransactions}
              </p>
              <p className="text-xs text-red-600">
                ✗ {metrics.failedTransactions}
              </p>
              <p className="text-xs text-yellow-600">
                ⏳ {metrics.pendingTransactions}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Sucesso
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(metrics.successRate)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {metrics.successRate >= 80 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Excelente performance
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  Abaixo do esperado
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.avgTicket)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por transação aprovada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fila de Retry */}
      {(retryStats.pending > 0 || retryStats.processing > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Fila de Retry Automático
            </CardTitle>
            <CardDescription>
              Transações sendo reprocessadas automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold">{retryStats.pending}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Processando</p>
                <p className="text-2xl font-bold text-blue-600">
                  {retryStats.processing}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sucesso</p>
                <p className="text-2xl font-bold text-green-600">
                  {retryStats.success}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Falhou</p>
                <p className="text-2xl font-bold text-red-600">
                  {retryStats.failed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Gateways */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Gateways por Receita</CardTitle>
            <CardDescription>
              Gateways com maior volume de transações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gatewayMetrics.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma transação registrada ainda
              </p>
            ) : (
              <div className="space-y-3">
                {gatewayMetrics.map((gateway) => (
                  <div
                    key={gateway.gatewayId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{gateway.gatewayName}</p>
                      <p className="text-xs text-gray-500">
                        {gateway.totalTransactions} transações
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatCurrency(gateway.totalRevenue)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPercent(gateway.successRate)} sucesso
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de Sucesso por Gateway</CardTitle>
            <CardDescription>
              Performance de cada gateway configurado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {successRates.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Configure um gateway para começar
              </p>
            ) : (
              <div className="space-y-3">
                {successRates.map((gateway) => (
                  <div key={gateway.gatewayId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {gateway.gatewayName}
                      </span>
                      <span className="text-sm font-bold">
                        {formatPercent(gateway.successRate)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          gateway.successRate >= 80
                            ? "bg-green-500"
                            : gateway.successRate >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${gateway.successRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {gateway.successfulTransactions} de{" "}
                      {gateway.totalTransactions} transações
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gateways com Problemas */}
      {failingGateways.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Gateways com Alta Taxa de Falha
            </CardTitle>
            <CardDescription>
              Estes gateways precisam de atenção urgente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failingGateways.map((gateway) => (
                <div
                  key={gateway.gatewayId}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      {gateway.gatewayName}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {gateway.failureCount} falhas em {gateway.totalAttempts}{" "}
                      tentativas
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">
                      {formatPercent(gateway.failureRate)}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      Última falha:{" "}
                      {new Date(gateway.lastFailureAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/checkout/gateways")}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Gerenciar Gateways
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/orders/all")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Todas Transações
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/checkout/customize")}
            >
              <Activity className="w-4 h-4 mr-2" />
              Personalizar Checkout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsOverviewPage;
