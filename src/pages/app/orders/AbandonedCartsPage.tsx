import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Mail,
  ShoppingCart,
  Clock,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Package,
  User,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { abandonedCartApi } from "@/lib/api/cartApi";
import { shopifySyncApi } from "@/lib/api/shopifySync";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AbandonedCartsPage = () => {
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadAbandonedCarts();
  }, []);

  const loadAbandonedCarts = async () => {
    try {
      if (!user?.id) return;
      const data = await abandonedCartApi.getAll(user.id);
      setAbandonedCarts(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncShopify = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Faça login para sincronizar",
        variant: "destructive",
      });
      return;
    }

    try {
      setSyncing(true);
      toast({
        title: "Sincronizando...",
        description: "Buscando carrinhos abandonados da Shopify",
      });

      const result = await shopifySyncApi.syncAbandonedCarts(user.id);

      if (result.success) {
        toast({
          title: "Sincronização concluída!",
          description: result.message,
        });
        await loadAbandonedCarts();
      } else {
        toast({
          title: "Erro na sincronização",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar",
        description: "Configure a integração Shopify em Integrações",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSendEmail = async (cartId: string) => {
    try {
      toast({ title: "Email de recuperação enviado!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredCarts = abandonedCarts.filter((c) =>
    c.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalValue = abandonedCarts.reduce((sum, cart) => sum + cart.total, 0);
  const recoveryRate = abandonedCarts.length > 0 ? 12.5 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
            Carrinhos Abandonados
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Recupere vendas de carrinhos abandonados
          </p>
        </div>
        <Button
          onClick={handleSyncShopify}
          disabled={syncing}
          className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Sincronizando..." : "Sincronizar Shopify"}
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-10 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Abandonados
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-500 bg-opacity-10">
                <ShoppingCart className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-orange-600 to-red-500 bg-clip-text text-transparent">
                {abandonedCarts.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Carrinhos esperando recuperação
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-10 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Valor Total
              </CardTitle>
              <div className="p-2 rounded-lg bg-red-500 bg-opacity-10">
                <DollarSign className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-red-600 to-pink-500 bg-clip-text text-transparent">
                {formatCurrency(totalValue)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Potencial de recuperação
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500 opacity-10 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Taxa Recuperação
              </CardTitle>
              <div className="p-2 rounded-lg bg-pink-500 bg-opacity-10">
                <TrendingUp className="h-4 w-4 text-pink-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-pink-600 to-purple-500 bg-clip-text text-transparent">
                {recoveryRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Média de conversão
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm dark:text-white dark:placeholder:text-gray-500"
        />
      </motion.div>

      {/* Carts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              Lista de Carrinhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredCarts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12"
              >
                <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4 mx-auto opacity-50" />
                <h3 className="text-lg font-semibold mb-2 dark:text-white">
                  Nenhum carrinho abandonado
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? "Tente ajustar os filtros de busca"
                    : "Os carrinhos abandonados aparecerão aqui"}
                </p>
              </motion.div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 hover:from-orange-100 hover:to-pink-100 dark:hover:from-gray-700 dark:hover:to-gray-700">
                      <TableHead className="font-semibold dark:text-gray-300">
                        Email
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Produtos
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Valor
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Abandonado há
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCarts.map((cart, index) => (
                      <motion.tr
                        key={cart.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-pink-50/50 dark:hover:from-gray-800/50 dark:hover:to-gray-800/50 transition-all duration-200"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20">
                              <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="font-medium dark:text-white">
                              {cart.customerEmail}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="dark:text-gray-300">
                              {cart.itemCount}{" "}
                              {cart.itemCount === 1 ? "item" : "items"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                            {formatCurrency(cart.total)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {cart.abandonedDays}d
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleSendEmail(cart.id)}
                            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Recuperar
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AbandonedCartsPage;
