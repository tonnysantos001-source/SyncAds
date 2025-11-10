import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HiCurrencyDollar,
  HiMagnifyingGlass,
  HiArrowTrendingUp,
  HiCreditCard,
  HiDocumentText,
  HiArrowDownTray,
  HiCalendar,
  HiUsers,
} from "react-icons/hi2";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubscriptionWithUser {
  id: string;
  userId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usedAiMessages: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    maxAiMessages: number;
  };
}

interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface Stats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
}

export default function BillingPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"subscriptions" | "invoices">(
    "subscriptions",
  );

  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>(
    [],
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
  });

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Load subscriptions with user and plan data
      const { data: subsData, error: subsError } = await supabase
        .from("Subscription")
        .select(
          `
          *,
          user:userId (id, name, email),
          plan:planId (id, name, price, maxAiMessages)
        `,
        )
        .order("createdAt", { ascending: false });

      if (subsError) throw subsError;

      // Load invoices with user data
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("Invoice")
        .select(
          `
          *,
          user:userId (name, email)
        `,
        )
        .order("createdAt", { ascending: false });

      if (invoicesError) throw invoicesError;

      setSubscriptions(subsData || []);
      setInvoices(invoicesData || []);

      // Calculate stats
      const activeSubscriptions = (subsData || []).filter(
        (s) => s.status === "active",
      ).length;
      const monthlyRevenue = (subsData || [])
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + (s.plan?.price || 0), 0);

      const paidInvoices = (invoicesData || []).filter(
        (i) => i.status === "paid",
      ).length;
      const pendingInvoices = (invoicesData || []).filter(
        (i) => i.status === "open" || i.status === "draft",
      ).length;
      const totalRevenue = (invoicesData || [])
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + i.amount, 0);

      setStats({
        totalRevenue,
        monthlyRevenue,
        activeSubscriptions,
        totalInvoices: invoicesData?.length || 0,
        paidInvoices,
        pendingInvoices,
      });
    } catch (error) {
      console.error("Error loading billing data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de faturamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: {
        label: "Ativa",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      trialing: {
        label: "Trial",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      past_due: {
        label: "Atrasada",
        className:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      },
      canceled: {
        label: "Cancelada",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      },
      paid: {
        label: "Paga",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      open: {
        label: "Aberta",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      draft: {
        label: "Rascunho",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      },
      void: {
        label: "Cancelada",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
    };

    const variant = variants[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || inv.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Faturamento
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie assinaturas e faturas dos clientes
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Total
              </CardTitle>
              <HiCurrencyDollar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.paidInvoices} faturas pagas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <HiArrowTrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats.monthlyRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Receita mensal recorrente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Assinaturas Ativas
              </CardTitle>
              <HiUsers className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeSubscriptions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Clientes com planos ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Faturas Pendentes
              </CardTitle>
              <HiDocumentText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando pagamento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Tabs */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={
                    activeTab === "subscriptions" ? "default" : "outline"
                  }
                  onClick={() => setActiveTab("subscriptions")}
                  className={
                    activeTab === "subscriptions"
                      ? "bg-pink-600 hover:bg-pink-700"
                      : ""
                  }
                >
                  <HiCreditCard className="h-4 w-4 mr-2" />
                  Assinaturas
                </Button>
                <Button
                  variant={activeTab === "invoices" ? "default" : "outline"}
                  onClick={() => setActiveTab("invoices")}
                  className={
                    activeTab === "invoices"
                      ? "bg-pink-600 hover:bg-pink-700"
                      : ""
                  }
                >
                  <HiDocumentText className="h-4 w-4 mr-2" />
                  Faturas
                </Button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <div className="relative">
                    <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {activeTab === "subscriptions" ? (
                      <>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="trialing">Trial</SelectItem>
                        <SelectItem value="canceled">Cancelada</SelectItem>
                        <SelectItem value="past_due">Atrasada</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="paid">Paga</SelectItem>
                        <SelectItem value="open">Aberta</SelectItem>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="void">Cancelada</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {activeTab === "subscriptions" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uso IA</TableHead>
                      <TableHead>Renovação</TableHead>
                      <TableHead>Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : filteredSubscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          Nenhuma assinatura encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {sub.user?.name || "N/A"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {sub.user?.email || "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {sub.plan?.name || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(sub.plan?.price || 0)}/mês
                          </TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-medium">
                                {sub.usedAiMessages}
                              </span>
                              <span className="text-gray-500">
                                {" "}
                                /{" "}
                                {sub.plan?.maxAiMessages === 0
                                  ? "∞"
                                  : sub.plan?.maxAiMessages}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(sub.currentPeriodEnd)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(sub.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pago em</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          Nenhuma fatura encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {invoice.user?.name || "N/A"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {invoice.user?.email || "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(invoice.amount)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(invoice.paidAt)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(invoice.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
