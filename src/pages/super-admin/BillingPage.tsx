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
  HiUsers,
  HiCheckCircle,
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
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usedAiMessages: number;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  plan?: {
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
  user?: {
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

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  gradient: string;
  delay?: number;
}

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  gradient,
  delay = 0,
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.02 }}
  >
    <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl hover:border-gray-600 transition-all group cursor-pointer relative overflow-hidden">
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`}
      />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-gray-300">
          {title}
        </CardTitle>
        <div
          className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <p className="text-xs text-gray-400">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

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

      // Load subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from("Subscription")
        .select("*")
        .order("createdAt", { ascending: false });

      if (subsError) throw subsError;

      // Load users for subscriptions
      const userIds = [...new Set(subsData?.map((s) => s.userId) || [])];
      const { data: usersData } = await supabase
        .from("User")
        .select("id, name, email")
        .in("id", userIds);

      // Load plans for subscriptions
      const planIds = [...new Set(subsData?.map((s) => s.planId) || [])];
      const { data: plansData } = await supabase
        .from("Plan")
        .select("id, name, price, maxAiMessages")
        .in("id", planIds);

      // Map users and plans to subscriptions
      const subsWithData = (subsData || []).map((sub) => ({
        ...sub,
        user: usersData?.find((u) => u.id === sub.userId),
        plan: plansData?.find((p) => p.id === sub.planId),
      }));

      // Load invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("Invoice")
        .select("*")
        .order("createdAt", { ascending: false });

      if (invoicesError) throw invoicesError;

      // Load users for invoices
      const invoiceUserIds = [
        ...new Set(invoicesData?.map((i) => i.userId) || []),
      ];
      const { data: invoiceUsersData } = await supabase
        .from("User")
        .select("id, name, email")
        .in("id", invoiceUserIds);

      // Map users to invoices
      const invoicesWithData = (invoicesData || []).map((inv) => ({
        ...inv,
        user: invoiceUsersData?.find((u) => u.id === inv.userId),
      }));

      setSubscriptions(subsWithData);
      setInvoices(invoicesWithData);

      // Calculate stats
      const activeSubscriptions = subsWithData.filter(
        (s) => s.status === "active",
      ).length;
      const monthlyRevenue = subsWithData
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + (s.plan?.price || 0), 0);

      const paidInvoices = invoicesWithData.filter(
        (i) => i.status === "paid",
      ).length;
      const pendingInvoices = invoicesWithData.filter(
        (i) => i.status === "open" || i.status === "draft",
      ).length;
      const totalRevenue = invoicesWithData
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + i.amount, 0);

      setStats({
        totalRevenue,
        monthlyRevenue,
        activeSubscriptions,
        totalInvoices: invoicesWithData.length,
        paidInvoices,
        pendingInvoices,
      });
    } catch (error: any) {
      console.error("Error loading billing data:", error);
      toast({
        title: "Erro ao carregar dados",
        description:
          error.message || "Não foi possível carregar os dados de faturamento.",
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
    }).format(price / 100);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: {
        label: "Ativa",
        className:
          "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 border",
      },
      trialing: {
        label: "Trial",
        className:
          "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30 border",
      },
      past_due: {
        label: "Atrasada",
        className:
          "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 border-orange-500/30 border",
      },
      canceled: {
        label: "Cancelada",
        className:
          "bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-300 border-gray-500/30 border",
      },
      paid: {
        label: "Paga",
        className:
          "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 border",
      },
      open: {
        label: "Aberta",
        className:
          "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30 border",
      },
      draft: {
        label: "Rascunho",
        className:
          "bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-300 border-gray-500/30 border",
      },
      void: {
        label: "Cancelada",
        className:
          "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border-red-500/30 border",
      },
    };

    const variant = variants[status] || {
      label: status,
      className:
        "bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-300 border-gray-500/30 border",
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

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full"
          />
        </div>
      </SuperAdminLayout>
    );
  }

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
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Receita Total"
            value={formatPrice(stats.totalRevenue)}
            description={`${stats.paidInvoices} faturas pagas`}
            icon={HiCurrencyDollar}
            gradient="from-green-500 to-emerald-500"
            delay={0.1}
          />
          <StatCard
            title="MRR"
            value={formatPrice(stats.monthlyRevenue)}
            description="Receita mensal recorrente"
            icon={HiArrowTrendingUp}
            gradient="from-blue-500 to-cyan-500"
            delay={0.2}
          />
          <StatCard
            title="Assinaturas Ativas"
            value={stats.activeSubscriptions}
            description="Clientes com planos ativos"
            icon={HiCheckCircle}
            gradient="from-purple-500 to-pink-500"
            delay={0.3}
          />
          <StatCard
            title="Faturas Pendentes"
            value={stats.pendingInvoices}
            description="Aguardando pagamento"
            icon={HiDocumentText}
            gradient="from-orange-500 to-red-500"
            delay={0.4}
          />
        </div>

        {/* Tabs and Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Tab Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setActiveTab("subscriptions")}
                    className={
                      activeTab === "subscriptions"
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0"
                        : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700"
                    }
                  >
                    <HiCreditCard className="h-4 w-4 mr-2" />
                    Assinaturas
                  </Button>
                  <Button
                    onClick={() => setActiveTab("invoices")}
                    className={
                      activeTab === "invoices"
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0"
                        : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700"
                    }
                  >
                    <HiDocumentText className="h-4 w-4 mr-2" />
                    Faturas
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32 bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem
                        value="all"
                        className="text-white hover:bg-gray-800"
                      >
                        Todos
                      </SelectItem>
                      {activeTab === "subscriptions" ? (
                        <>
                          <SelectItem
                            value="active"
                            className="text-white hover:bg-gray-800"
                          >
                            Ativa
                          </SelectItem>
                          <SelectItem
                            value="trialing"
                            className="text-white hover:bg-gray-800"
                          >
                            Trial
                          </SelectItem>
                          <SelectItem
                            value="canceled"
                            className="text-white hover:bg-gray-800"
                          >
                            Cancelada
                          </SelectItem>
                          <SelectItem
                            value="past_due"
                            className="text-white hover:bg-gray-800"
                          >
                            Atrasada
                          </SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem
                            value="paid"
                            className="text-white hover:bg-gray-800"
                          >
                            Paga
                          </SelectItem>
                          <SelectItem
                            value="open"
                            className="text-white hover:bg-gray-800"
                          >
                            Aberta
                          </SelectItem>
                          <SelectItem
                            value="draft"
                            className="text-white hover:bg-gray-800"
                          >
                            Rascunho
                          </SelectItem>
                          <SelectItem
                            value="void"
                            className="text-white hover:bg-gray-800"
                          >
                            Cancelada
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {activeTab === "subscriptions" ? (
                <div className="border border-gray-700/50 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700/50 hover:bg-gray-800/50">
                        <TableHead className="text-gray-300 font-semibold">
                          Cliente
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold">
                          Plano
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold">
                          Valor
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold">
                          Status
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold">
                          Uso IA
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold">
                          Renovação
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold">
                          Criado em
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-12 text-gray-500"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <HiCreditCard className="w-12 h-12 text-gray-600" />
                              <p>Nenhuma assinatura encontrada</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubscriptions.map((sub, index) => (
                          <motion.tr
                            key={sub.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-gray-700/50 hover:bg-gray-800/50 transition-colors"
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium text-white">
                                  {sub.user?.name || "N/A"}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {sub.user?.email || "N/A"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30 border">
                                {sub.plan?.name || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-white">
                              {formatPrice(sub.plan?.price || 0)}/mês
                            </TableCell>
                            <TableCell>{getStatusBadge(sub.status)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="font-medium text-white">
                                  {sub.usedAiMessages}
                                </span>
                                <span className="text-gray-400">
                                  {" "}
                                  /{" "}
                                  {sub.plan?.maxAiMessages === 0
                                    ? "∞"
                                    : sub.plan?.maxAiMessages || "N/A"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-400">
                              {formatDate(sub.currentPeriodEnd)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-400">
                              {formatDate(sub.createdAt)}
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border border-gray-700/50 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700/50 hover:bg-gray-800/50">
                        <TableHead className="text-gray-300 font-semibold">
                          Fatura
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold">
                          Cliente
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold">
                          Valor
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold">
                          Status
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold">
                          Pago em
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold">
                          Criado em
                        </TableHead>
                        <TableHead className="text-gray-300 font-semibold text-right">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-12 text-gray-500"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <HiDocumentText className="w-12 h-12 text-gray-600" />
                              <p>Nenhuma fatura encontrada</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInvoices.map((invoice, index) => (
                          <motion.tr
                            key={invoice.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-gray-700/50 hover:bg-gray-800/50 transition-colors"
                          >
                            <TableCell className="font-medium text-white">
                              {invoice.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-white">
                                  {invoice.user?.name || "N/A"}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {invoice.user?.email || "N/A"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-white">
                              {formatPrice(invoice.amount)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(invoice.status)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-400">
                              {formatDate(invoice.paidAt)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-400">
                              {formatDate(invoice.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-gray-700/50 text-gray-400 hover:text-white"
                              >
                                <HiArrowDownTray className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
}
