import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  RefreshCw,
  CheckCircle,
  Database,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderStats {
  total: number;
  pending: number;
  paid: number;
  failed: number;
  testOrders: number;
  totalRevenue: number;
}

const OrdersManagementPage = () => {
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    paid: 0,
    failed: 0,
    testOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadStats();
  }, [user?.id]);

  const loadStats = async () => {
    try {
      if (!user?.id) return;

      setLoading(true);

      // Buscar todos os pedidos
      const { data: orders, error } = await supabase
        .from("Order")
        .select("*")
        .eq("userId", user.id);

      if (error) throw error;

      if (orders) {
        const testOrders = orders.filter(
          (o) =>
            o.customerEmail?.includes("nao-informado@syncads.com.br") ||
            o.customerEmail?.includes("test") ||
            o.customerEmail?.includes("teste") ||
            o.customerName?.toLowerCase().includes("cliente"),
        );

        setStats({
          total: orders.length,
          pending: orders.filter((o) => o.paymentStatus === "PENDING").length,
          paid: orders.filter((o) => o.paymentStatus === "PAID").length,
          failed: orders.filter((o) => o.paymentStatus === "FAILED").length,
          testOrders: testOrders.length,
          totalRevenue: orders
            .filter((o) => o.paymentStatus === "PAID")
            .reduce((sum, o) => sum + (o.total || 0), 0),
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar estatísticas:", error);
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTestOrders = async () => {
    try {
      if (!user?.id) return;

      setDeleting(true);
      toast({
        title: "Removendo pedidos de teste...",
      });

      // Buscar pedidos de teste
      const { data: orders, error: fetchError } = await supabase
        .from("Order")
        .select("id")
        .eq("userId", user.id)
        .or(
          `customerEmail.ilike.%nao-informado@syncads.com.br%,customerEmail.ilike.%test%,customerEmail.ilike.%teste%,customerName.ilike.%cliente%`,
        );

      if (fetchError) throw fetchError;

      if (!orders || orders.length === 0) {
        toast({
          title: "Nenhum pedido de teste encontrado",
          description: "Não há pedidos de teste para remover.",
        });
        return;
      }

      const orderIds = orders.map((o) => o.id);

      // Deletar OrderItems primeiro (FK constraint)
      const { error: itemsError } = await supabase
        .from("OrderItem")
        .delete()
        .in("orderId", orderIds);

      if (itemsError) {
        console.warn("Erro ao deletar items:", itemsError);
      }

      // Deletar OrderHistory
      const { error: historyError } = await supabase
        .from("OrderHistory")
        .delete()
        .in("orderId", orderIds);

      if (historyError) {
        console.warn("Erro ao deletar histórico:", historyError);
      }

      // Deletar Orders
      const { error: ordersError } = await supabase
        .from("Order")
        .delete()
        .in("id", orderIds);

      if (ordersError) throw ordersError;

      toast({
        title: "✅ Pedidos de teste removidos!",
        description: `${orders.length} pedido(s) de teste foram removidos com sucesso.`,
      });

      await loadStats();
    } catch (error: any) {
      console.error("Erro ao deletar pedidos de teste:", error);
      toast({
        title: "Erro ao deletar pedidos de teste",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const deleteAllOrders = async () => {
    try {
      if (!user?.id) return;

      setDeleting(true);
      toast({
        title: "Removendo TODOS os pedidos...",
        description: "Esta ação não pode ser desfeita!",
      });

      // Buscar todos os pedidos
      const { data: orders, error: fetchError } = await supabase
        .from("Order")
        .select("id")
        .eq("userId", user.id);

      if (fetchError) throw fetchError;

      if (!orders || orders.length === 0) {
        toast({
          title: "Nenhum pedido encontrado",
          description: "Não há pedidos para remover.",
        });
        return;
      }

      const orderIds = orders.map((o) => o.id);

      // Deletar OrderItems primeiro
      await supabase.from("OrderItem").delete().in("orderId", orderIds);

      // Deletar OrderHistory
      await supabase.from("OrderHistory").delete().in("orderId", orderIds);

      // Deletar Orders
      const { error: ordersError } = await supabase
        .from("Order")
        .delete()
        .in("id", orderIds);

      if (ordersError) throw ordersError;

      // Também limpar ShopifyOrders se houver
      await supabase.from("ShopifyOrder").delete().eq("userId", user.id);

      toast({
        title: "✅ Todos os pedidos foram removidos!",
        description: `${orders.length} pedido(s) foram removidos com sucesso.`,
      });

      await loadStats();
    } catch (error: any) {
      console.error("Erro ao deletar todos os pedidos:", error);
      toast({
        title: "Erro ao deletar pedidos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Gerenciamento de Pedidos
        </h1>
        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 font-medium">
          Limpe pedidos de teste e gerencie o banco de dados
        </p>
      </div>
</text>

<old_text line=267>
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-300" />

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Database className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
</text>

<old_text line=298>
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {stats.paid}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos de Teste
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
</text>

<old_text line=332>
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-orange-600">
                {stats.testOrders}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.totalRevenue)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warning Alert */}
      <Card className="border-0 bg-orange-50/80 dark:bg-orange-950/20 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
            <CardTitle className="text-orange-900 dark:text-orange-400">Zona de Perigo</CardTitle>
          </div>
          <CardDescription className="text-orange-700 dark:text-orange-300">
</text>

<old_text line=365>
        {/* Delete Test Orders */}
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-orange-600" />
            Use estas funções com cuidado. As ações não podem ser desfeitas.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Delete Test Orders */}
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-orange-600" />
              Remover Pedidos de Teste
            </CardTitle>
            <CardDescription>
              Remove apenas pedidos identificados como testes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Esta ação irá remover pedidos que contenham:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Email: nao-informado@syncads.com.br</li>
                <li>Email com "test" ou "teste"</li>
                <li>Nome: "Cliente" (genérico)</li>
              </ul>
              <div className="pt-2">
                <Badge variant="outline" className="text-orange-600">
                  {stats.testOrders} pedido(s) serão removidos
                </Badge>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  disabled={deleting || stats.testOrders === 0}
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover Pedidos de Teste
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá remover <strong>{stats.testOrders}</strong>{" "}
                    pedido(s) de teste permanentemente. Esta ação não pode ser
                    desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteTestOrders}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Sim, remover pedidos de teste
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Delete All Orders */}
        <Card className="border-0 bg-red-50/80 dark:bg-red-950/20 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
</text>

              Remover TODOS os Pedidos
            </CardTitle>
            <CardDescription className="text-red-600">
              ⚠️ PERIGO: Remove TODOS os pedidos do banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Esta ação irá remover:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Todos os pedidos ({stats.total})</li>
                <li>Todos os itens de pedidos</li>
                <li>Todo o histórico de pedidos</li>
                <li>Pedidos sincronizados da Shopify</li>
              </ul>
              <div className="pt-2">
                <Badge variant="destructive">
                  {stats.total} pedido(s) serão removidos
                </Badge>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={deleting || stats.total === 0}
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover TODOS os Pedidos
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600">
                    ⚠️ ATENÇÃO: Ação Irreversível!
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Você está prestes a remover <strong>{stats.total}</strong>{" "}
                    pedido(s) PERMANENTEMENTE, incluindo:
                    <ul className="mt-2 space-y-1">
                      <li>• Todos os pedidos pagos ({stats.paid})</li>
                      <li>• Todos os pedidos pendentes ({stats.pending})</li>
                      <li>
                        • Receita total: {formatCurrency(stats.totalRevenue)}
                      </li>
                    </ul>
                    <p className="mt-3 font-bold text-red-600">
                      Esta ação NÃO pode ser desfeita!
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllOrders}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Sim, remover TODOS os pedidos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            onClick={loadStats}
            disabled={loading}
            className="w-full"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar Estatísticas
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersManagementPage;
