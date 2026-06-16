import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Users,
  Search,
  Mail,
  Phone,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  TrendingUp,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { customersApi, Customer } from "@/lib/api/customersApi";
import { shopifySyncApi } from "@/lib/api/shopifySync";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDebounce } from "@/hooks/useDebounce";
import { useCustomers } from "@/hooks/useCustomers";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay?: number;
  subtitle?: string;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
  subtitle,
}: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
        <div
          className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full blur-3xl`}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AllCustomersPage = () => {
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  // Debounce search para evitar queries excessivas
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Hook otimizado com React Query
  const {
    data: customers,
    isLoading: loading,
    totalCount,
    totalPages,
    refetch: refetchCustomers,
  } = useCustomers({
    userId: user?.id || "",
    page: currentPage,
    pageSize: 50,
    search: debouncedSearch,
    type: typeFilter,
    enabled: !!user?.id,
  });

  // Usar customers diretamente
  const filteredCustomers = customers;

  useEffect(() => {
    // Reset page quando search ou filtros mudarem
    setCurrentPage(0);
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    await refetchCustomers();
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
        description: "Buscando clientes da Shopify",
      });

      const result = await shopifySyncApi.syncCustomers(user.id);

      if (result.success) {
        toast({
          title: "Sincronização concluída!",
          description: result.message,
        });
        await refetchCustomers();
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

  const handleExportCustomers = async () => {
    if (!user?.id) return;
    try {
      toast({
        title: "Preparando download...",
        description: "Carregando base de clientes completa para exportação.",
      });

      const [customersRes, shopifyCustomersRes, ordersRes] = await Promise.all([
        supabase.from('Customer').select('*').eq('userId', user.id),
        supabase.from('ShopifyCustomer').select('*').eq('userId', user.id),
        supabase.from('Order').select('*').eq('userId', user.id),
      ]);

      if (customersRes.error) throw customersRes.error;

      const dbCustomers = customersRes.data || [];
      const dbShopifyCustomers = shopifyCustomersRes.data || [];
      const dbOrders = ordersRes.data || [];

      const customerMap = new Map<string, any>();

      for (const c of dbCustomers) {
        if (!c.email) continue;
        const emailKey = c.email.toLowerCase().trim();
        customerMap.set(emailKey, {
          name: c.name || '',
          email: c.email,
          phone: c.phone || null,
          totalOrders: Number(c.totalOrders) || 0,
          totalSpent: Number(c.totalSpent) || 0,
          lastOrderAt: c.lastOrderAt || null,
          status: c.status || 'ACTIVE',
          createdAt: c.createdAt || new Date().toISOString(),
        });
      }

      for (const c of dbShopifyCustomers) {
        if (!c.email) continue;
        const emailKey = c.email.toLowerCase().trim();
        const existing = customerMap.get(emailKey);

        const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Cliente Shopify';
        const ordersCount = Number(c.ordersCount) || 0;
        const totalSpent = parseFloat(c.totalSpent || '0');
        const lastOrderDate = c.shopifyData?.last_order_date || null;

        if (existing) {
          if (!existing.name) existing.name = name;
          if (!existing.phone && c.phone) existing.phone = c.phone;
          if (existing.totalOrders === 0) {
            existing.totalOrders = ordersCount;
            existing.totalSpent = totalSpent;
          }
          if (!existing.lastOrderAt) existing.lastOrderAt = lastOrderDate;
        } else {
          customerMap.set(emailKey, {
            name,
            email: c.email,
            phone: c.phone || null,
            totalOrders: ordersCount,
            totalSpent: totalSpent,
            lastOrderAt: lastOrderDate,
            status: 'ACTIVE',
            createdAt: c.createdAt || new Date().toISOString(),
          });
        }
      }

      const ordersByEmail: Record<string, typeof dbOrders> = {};
      for (const order of dbOrders) {
        if (!order.customerEmail) continue;
        const emailKey = order.customerEmail.toLowerCase().trim();
        if (!ordersByEmail[emailKey]) {
          ordersByEmail[emailKey] = [];
        }
        ordersByEmail[emailKey].push(order);
      }

      for (const [emailKey, ords] of Object.entries(ordersByEmail)) {
        ords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latestOrder = ords[0];

        const localOrdersCount = ords.length;
        const localTotalSpent = ords.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        const localLastOrderAt = latestOrder.createdAt;

        const existing = customerMap.get(emailKey);

        if (existing) {
          existing.totalOrders += localOrdersCount;
          existing.totalSpent += localTotalSpent;
          if (!existing.lastOrderAt || new Date(localLastOrderAt).getTime() > new Date(existing.lastOrderAt).getTime()) {
            existing.lastOrderAt = localLastOrderAt;
          }
          if (!existing.name && latestOrder.customerName) existing.name = latestOrder.customerName;
          if (!existing.phone && latestOrder.customerPhone) existing.phone = latestOrder.customerPhone;
        } else {
          customerMap.set(emailKey, {
            name: latestOrder.customerName || 'Cliente sem Nome',
            email: latestOrder.customerEmail,
            phone: latestOrder.customerPhone || null,
            totalOrders: localOrdersCount,
            totalSpent: localTotalSpent,
            lastOrderAt: localLastOrderAt,
            status: 'ACTIVE',
            createdAt: latestOrder.createdAt || new Date().toISOString(),
          });
        }
      }

      const allCustomersList = Array.from(customerMap.values());

      if (allCustomersList.length === 0) {
        toast({
          title: "Aviso",
          description: "Não há clientes cadastrados para exportar.",
          variant: "destructive",
        });
        return;
      }

      allCustomersList.sort((a, b) => {
        const dateA = a.lastOrderAt || a.createdAt;
        const dateB = b.lastOrderAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      const headers = [
        "Nome",
        "E-mail",
        "Telefone",
        "Total de Pedidos",
        "Total Gasto (R$)",
        "Ticket Médio (R$)",
        "Última Compra",
        "Status"
      ];

      const rows = allCustomersList.map((c) => {
        const ticket = c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0;
        return [
          c.name || "",
          c.email || "",
          c.phone || "",
          String(c.totalOrders),
          c.totalSpent.toFixed(2),
          ticket.toFixed(2),
          c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("pt-BR") : "",
          c.status === "ACTIVE" ? "Ativo" : "Bloqueado",
        ];
      });

      const csvContent = 
        "\uFEFF" +
        [headers.join(";"), ...rows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(";"))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `clientes_syncads_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Sucesso",
        description: "Clientes exportados com sucesso!",
      });
    } catch (err: any) {
      console.error("Erro ao exportar clientes:", err);
      toast({
        title: "Erro ao exportar",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);
  const activeCustomers = customers.filter((c) => c.status === "ACTIVE").length;
  const avgTicket = customers.length > 0 ? totalSpent / customers.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
            Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
            Visualize e gerencie todos os clientes da sua loja
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-3 items-center flex-wrap"
        >
          <Button
            onClick={handleExportCustomers}
            variant="outline"
            size="lg"
            className="border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Baixar Clientes
          </Button>

          <Button
            onClick={handleSyncShopify}
            disabled={syncing}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <RefreshCw
              className={`mr-2 h-5 w-5 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Sincronizando..." : "Sincronizar Shopify"}
          </Button>
        </motion.div>
      </motion.div>

      {/* Métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Clientes"
          value={customers.length}
          icon={Users}
          color="bg-blue-500"
          delay={0.1}
        />
        <MetricCard
          title="Clientes Ativos"
          value={activeCustomers}
          icon={UserCheck}
          color="bg-green-500"
          delay={0.2}
          subtitle={`${((activeCustomers / customers.length) * 100 || 0).toFixed(0)}% do total`}
        />
        <MetricCard
          title="Total de Pedidos"
          value={totalOrders}
          icon={ShoppingBag}
          color="bg-purple-500"
          delay={0.3}
          subtitle={`${(totalOrders / customers.length || 0).toFixed(1)} por cliente`}
        />
        <MetricCard
          title="Receita Total"
          value={formatCurrency(totalSpent)}
          icon={DollarSign}
          color="bg-pink-500"
          delay={0.4}
          subtitle={`Ticket médio: ${formatCurrency(avgTicket)}`}
        />
      </div>

      {/* Busca */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <Input
          placeholder="Buscar por nome, email ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg text-base"
        />
      </motion.div>

      {/* Tabela */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Lista de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-3xl rounded-full" />
                  <Users className="relative h-20 w-20 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                  {searchTerm
                    ? "Tente ajustar os filtros de busca"
                    : "Sincronize com a Shopify para importar seus clientes"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={handleSyncShopify}
                    disabled={syncing}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <RefreshCw
                      className={`mr-2 h-5 w-5 ${syncing ? "animate-spin" : ""}`}
                    />
                    Sincronizar Clientes
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Cliente
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Contato
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Pedidos
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Total Gasto
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Última Compra
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer, index) => (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-gray-200 dark:border-gray-700"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {customer.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Phone className="h-3 w-3 text-gray-400" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-purple-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {customer.totalOrders}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(customer.totalSpent)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {customer.lastOrderAt
                              ? format(
                                  new Date(customer.lastOrderAt),
                                  "dd/MM/yyyy",
                                  {
                                    locale: ptBR,
                                  },
                                )
                              : "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              customer.status === "ACTIVE"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              customer.status === "ACTIVE"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }
                          >
                            {customer.status === "ACTIVE"
                              ? "Ativo"
                              : "Bloqueado"}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Paginação */}
            {!loading && filteredCustomers.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage + 1} de {totalPages} ({totalCount}{" "}
                  clientes no total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                    }
                    disabled={currentPage >= totalPages - 1}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AllCustomersPage;

