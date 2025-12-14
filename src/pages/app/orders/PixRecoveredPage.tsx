import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { recoveryApi, RecoveredCart } from "@/lib/api/recoveryApi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type RecoveryStatus = "PENDING" | "RECOVERED" | "EXPIRED" | "FAILED";

const PixRecoveredPage = () => {
  const [recoveries, setRecoveries] = useState<RecoveredCart[]>([]);
  const [filteredRecoveries, setFilteredRecoveries] = useState<RecoveredCart[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadPixRecoveries();
  }, [user?.id]);

  useEffect(() => {
    filterRecoveries();
  }, [searchTerm, statusFilter, recoveries]);

  const loadPixRecoveries = async () => {
    try {
      if (!user?.id) return;

      setLoading(true);

      // Buscar todos os carrinhos recuperados via PIX
      const data = await recoveryApi.getPixRecovered(user.id);
      setRecoveries(data);
    } catch (error: any) {
      console.error("Erro ao carregar PIX recuperados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecoveries = () => {
    let filtered = recoveries;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (recovery) =>
          recovery.customerEmail
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (recovery.orderId &&
            recovery.orderId.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "RECOVERED") {
        filtered = filtered.filter((r) => r.recovered);
      } else if (statusFilter === "PENDING") {
        filtered = filtered.filter(
          (r) =>
            !r.recovered &&
            (!r.pixExpiresAt || new Date(r.pixExpiresAt) > new Date()),
        );
      } else if (statusFilter === "EXPIRED") {
        filtered = filtered.filter(
          (r) =>
            !r.recovered &&
            r.pixExpiresAt &&
            new Date(r.pixExpiresAt) < new Date(),
        );
      }
    }

    setFilteredRecoveries(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getRecoveryStatus = (recovery: RecoveredCart): RecoveryStatus => {
    if (recovery.recovered) return "RECOVERED";
    if (recovery.pixExpiresAt && new Date(recovery.pixExpiresAt) < new Date())
      return "EXPIRED";
    return "PENDING";
  };

  const getStatusBadge = (status: RecoveryStatus) => {
    const statusMap = {
      PENDING: {
        label: "Aguardando Pagamento",
        variant: "secondary" as const,
        icon: Clock,
      },
      RECOVERED: {
        label: "Recuperado",
        variant: "default" as const,
        icon: CheckCircle,
      },
      EXPIRED: {
        label: "Expirado",
        variant: "destructive" as const,
        icon: AlertCircle,
      },
      FAILED: {
        label: "Falhou",
        variant: "destructive" as const,
        icon: AlertCircle,
      },
    };
    return (
      statusMap[status] || {
        label: "Aguardando Pagamento",
        variant: "secondary" as const,
        icon: Clock,
      }
    );
  };

  const totalPending = recoveries
    .filter((r) => getRecoveryStatus(r) === "PENDING")
    .reduce((sum, r) => sum + r.cartValue, 0);
  const totalRecovered = recoveries
    .filter((r) => r.recovered)
    .reduce((sum, r) => sum + r.cartValue, 0);
  const totalExpired = recoveries
    .filter((r) => getRecoveryStatus(r) === "EXPIRED")
    .reduce((sum, r) => sum + r.cartValue, 0);
  const recoveryRate =
    recoveries.length > 0
      ? (
          (recoveries.filter((r) => r.recovered).length / recoveries.length) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
          PIX Recuperados
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Gerencie transações PIX e recupere vendas perdidas
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500 opacity-10 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Aguardando Pagamento
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-500 bg-opacity-10">
                <Clock className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-yellow-600 to-orange-500 bg-clip-text text-transparent">
                {formatCurrency(totalPending)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {
                  recoveries.filter((r) => getRecoveryStatus(r) === "PENDING")
                    .length
                }{" "}
                aguardando
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 opacity-10 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                PIX Recuperados
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500 bg-opacity-10">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-green-600 to-teal-500 bg-clip-text text-transparent">
                {formatCurrency(totalRecovered)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {recoveries.filter((r) => r.recovered).length} recuperados
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-10 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Expirados
              </CardTitle>
              <div className="p-2 rounded-lg bg-red-500 bg-opacity-10">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-red-600 to-pink-500 bg-clip-text text-transparent">
                {formatCurrency(totalExpired)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {
                  recoveries.filter((r) => getRecoveryStatus(r) === "EXPIRED")
                    .length
                }{" "}
                expirados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Taxa de Recuperação
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
                <DollarSign className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {recoveryRate}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Taxa de conversão de PIX
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alert */}
      {totalPending > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Alert className="border-0 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="dark:text-gray-300">
              Você tem{" "}
              <strong className="text-yellow-700 dark:text-yellow-300">
                {formatCurrency(totalPending)}
              </strong>{" "}
              em PIX aguardando pagamento. Considere enviar lembretes para os
              clientes.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center gap-4"
      >
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido, cliente ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm dark:text-white dark:placeholder:text-gray-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px] border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm dark:text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Aguardando</SelectItem>
            <SelectItem value="RECOVERED">Recuperado</SelectItem>
            <SelectItem value="EXPIRED">Expirado</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={loadPixRecoveries}
          className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Recuperação de Carrinhos via PIX
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {filteredRecoveries.length} carrinho(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredRecoveries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <DollarSign className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2 dark:text-white">
                  Nenhum PIX encontrado
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Tente ajustar os filtros"
                    : "Aguardando primeira transação PIX"}
                </p>
              </motion.div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 hover:from-green-100 hover:to-teal-100 dark:hover:from-gray-700 dark:hover:to-gray-700">
                      <TableHead className="font-semibold dark:text-gray-300">
                        Carrinho
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Cliente
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Valor
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Tentativas
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Expira em
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Data
                      </TableHead>
                      <TableHead className="text-right font-semibold dark:text-gray-300">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecoveries.map((recovery, index) => {
                      const status = getRecoveryStatus(recovery);
                      const statusInfo = getStatusBadge(status);
                      const Icon = statusInfo.icon;

                      return (
                        <motion.tr
                          key={recovery.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-teal-50/50 dark:hover:from-gray-800/50 dark:hover:to-gray-800/50 transition-all duration-200"
                        >
                          <TableCell>
                            <div className="font-mono text-sm font-semibold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                              #{recovery.cartId.substring(0, 8)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium dark:text-white">
                                {recovery.customerEmail}
                              </div>
                              {recovery.customerPhone && (
                                <div className="text-sm text-muted-foreground">
                                  {recovery.customerPhone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                              {formatCurrency(recovery.cartValue)}
                            </div>
                            {recovery.discountOffered > 0 && (
                              <div className="text-sm text-green-600 dark:text-green-400">
                                Desconto:{" "}
                                {formatCurrency(recovery.discountOffered)}
                              </div>
                            )}
                            {recovery.recoveredAt && (
                              <div className="text-sm text-green-600 dark:text-green-400">
                                Recuperado em{" "}
                                {format(
                                  new Date(recovery.recoveredAt),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: ptBR },
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm dark:text-gray-300">
                              {recovery.recoveryAttempts} tentativa(s)
                            </div>
                            {recovery.lastRecoveryAt && (
                              <div className="text-xs text-muted-foreground">
                                Última:{" "}
                                {format(
                                  new Date(recovery.lastRecoveryAt),
                                  "dd/MM HH:mm",
                                  { locale: ptBR },
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusInfo.variant}
                              className="gap-1"
                            >
                              <Icon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {recovery.pixExpiresAt ? (
                              <div className="text-sm">
                                {format(
                                  new Date(recovery.pixExpiresAt),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: ptBR },
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(recovery.createdAt),
                              "dd/MM/yyyy",
                              {
                                locale: ptBR,
                              },
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {status === "PENDING" &&
                                recovery.pixCopyPaste && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-md hover:shadow-lg"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        recovery.pixCopyPaste!,
                                      );
                                      toast({ title: "Chave PIX copiada!" });
                                    }}
                                  >
                                    Copiar PIX
                                  </Button>
                                )}
                              {recovery.orderId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 dark:hover:from-gray-800 dark:hover:to-gray-800"
                                >
                                  Ver pedido
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
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

export default PixRecoveredPage;

