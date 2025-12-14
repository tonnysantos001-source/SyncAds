import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  HiCurrencyDollar,
  HiArrowTrendingUp,
  HiCreditCard,
  HiCalendar,
  HiArrowPath,
  HiReceiptPercent,
} from "react-icons/hi2";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";

interface Subscription {
  id: string;
  organizationId: string;
  plan: string;
  status: string;
  billingCycle: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  organization: {
    name: string;
    slug: string;
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("Subscription")
        .select(
          `
          *,
          organization:Organization (
            name,
            slug
          )
        `,
        )
        .order("startDate", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar assinaturas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = subscriptions.length;
    const active = subscriptions.filter((s) => s.status === "ACTIVE").length;
    const mrr = subscriptions
      .filter((s) => s.status === "ACTIVE")
      .reduce((acc, s) => acc + (s.amount || 0), 0);

    return { total, active, mrr };
  };

  const stats = calculateStats();

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      ACTIVE: {
        className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
        label: "Ativa",
      },
      TRIALING: {
        className: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white",
        label: "Trial",
      },
      PAST_DUE: {
        className: "bg-gradient-to-r from-orange-500 to-red-600 text-white",
        label: "Atrasada",
      },
      CANCELLED: {
        className:
          "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        label: "Cancelada",
      },
    };
    const item = config[status] || config.ACTIVE;
    return <Badge className={`${item.className} border-0`}>{item.label}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: "bg-gradient-to-r from-gray-400 to-gray-500 text-white",
      STARTER: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      PRO: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
      ENTERPRISE: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[plan] || colors.FREE}`}
      >
        {plan}
      </span>
    );
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
          <HiArrowPath className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="p-8 space-y-8">
        {/* Header com gradiente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <HiReceiptPercent className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Assinaturas
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerencie todas as assinaturas do sistema
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards com gradientes */}
        <div className="grid gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Total de Assinaturas
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <HiCreditCard className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {stats.total}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {stats.active} ativas no momento
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  MRR (Receita Mensal)
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <HiCurrencyDollar className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  R${" "}
                  {stats.mrr.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Receita recorrente mensal
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Taxa de Conversão
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <HiArrowTrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {stats.total > 0
                    ? ((stats.active / stats.total) * 100).toFixed(1)
                    : 0}
                  %
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Trial para pago
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Subscriptions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <HiReceiptPercent className="h-6 w-6 text-green-600" />
                Todas as Assinaturas
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Lista completa de assinaturas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit mx-auto mb-4">
                    <HiCalendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma assinatura ainda
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    As assinaturas aparecerão aqui quando forem criadas
                  </p>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableHead className="font-semibold">
                          Organização
                        </TableHead>
                        <TableHead className="font-semibold">Plano</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Ciclo</TableHead>
                        <TableHead className="font-semibold">Valor</TableHead>
                        <TableHead className="font-semibold">Início</TableHead>
                        <TableHead className="font-semibold">
                          Próxima Cobrança
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub, index) => (
                        <motion.tr
                          key={sub.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {sub.organization.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                {sub.organization.slug}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell className="capitalize font-medium text-gray-700 dark:text-gray-300">
                            {sub.billingCycle.toLowerCase()}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600 dark:text-green-400">
                            {sub.currency} {sub.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {new Date(sub.startDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {sub.endDate
                              ? new Date(sub.endDate).toLocaleDateString(
                                  "pt-BR",
                                )
                              : "-"}
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
    </SuperAdminLayout>
  );
}

