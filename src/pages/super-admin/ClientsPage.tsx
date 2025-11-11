import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  HiUsers,
  HiMagnifyingGlass,
  HiChatBubbleBottomCenterText,
  HiShieldCheck,
  HiCheckCircle,
  HiCurrencyDollar,
  HiLockClosed,
  HiLockOpen,
  HiTrash,
  HiEye,
  HiArrowsUpDown,
  HiEnvelope,
  HiMapPin,
  HiCalendar,
  HiCreditCard,
  HiSparkles,
} from "react-icons/hi2";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";

interface UserData {
  id: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  trialEndsAt: string | null;
  cpf?: string | null;
  birthDate?: string | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  currentPlanId?: string | null;
  _count?: {
    campaigns: number;
    messages: number;
    orders: number;
  };
  _stats?: {
    totalSales: number;
    averageOrderValue: number;
  };
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function ClientsPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "sales" | "messages">("recent");
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [userToToggle, setUserToToggle] = useState<UserData | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const { data: usersData, error } = await supabase
        .from("User")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) throw error;

      // Buscar lista de super admins para filtrar
      const { data: superAdmins } = await supabase
        .from("SuperAdmin")
        .select("id");

      const superAdminIds = new Set(
        (superAdmins || []).map((sa: any) => sa.id),
      );

      // Filtrar super admins da lista de usuários
      const clientUsers = (usersData || []).filter(
        (user: any) => !superAdminIds.has(user.id),
      );

      // Para cada usuário, buscar contagens e estatísticas de vendas
      const usersWithStats = await Promise.all(
        clientUsers.map(async (user: any) => {
          // Contar campanhas
          const { count: campaignsCount } = await supabase
            .from("Campaign")
            .select("*", { count: "exact", head: true })
            .eq("userId", user.id);

          // Contar mensagens
          const { count: messagesCount } = await supabase
            .from("ChatMessage")
            .select("*", { count: "exact", head: true })
            .eq("userId", user.id);

          // Buscar pedidos pagos e calcular vendas
          const { data: orders } = await supabase
            .from("Order")
            .select("totalAmount")
            .eq("userId", user.id)
            .eq("status", "PAID");

          const totalSales = orders?.reduce(
            (sum, order) => sum + (parseFloat(order.totalAmount || "0")),
            0
          ) || 0;

          const ordersCount = orders?.length || 0;
          const averageOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0;

          return {
            ...user,
            _count: {
              campaigns: campaignsCount || 0,
              messages: messagesCount || 0,
              orders: ordersCount,
            },
            _stats: {
              totalSales,
              averageOrderValue,
            },
          };
        }),
      );

      setUsers(usersWithStats);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from("User")
        .delete()
        .eq("id", userToDelete.id);

      if (error) throw error;

      toast({
        title: "Cliente excluído",
        description: `${userToDelete.name} foi removido com sucesso.`,
      });

      await loadUsers();
      setUserToDelete(null);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async () => {
    if (!userToToggle) return;

    try {
      const newStatus = !userToToggle.isActive;

      const { error } = await supabase
        .from("User")
        .update({ isActive: newStatus })
        .eq("id", userToToggle.id);

      if (error) throw error;

      toast({
        title: newStatus ? "Cliente ativado" : "Cliente bloqueado",
        description: `${userToToggle.name} foi ${newStatus ? "ativado" : "bloqueado"} com sucesso.`,
      });

      await loadUsers();
      setUserToToggle(null);
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filtrar e ordenar usuários
  const filteredAndSortedUsers = users
    .filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "sales":
          return (b._stats?.totalSales || 0) - (a._stats?.totalSales || 0);
        case "messages":
          return (b._count?.messages || 0) - (a._count?.messages || 0);
        case "recent":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      ADMIN: {
        className:
          "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30",
        label: "Admin",
      },
      MEMBER: {
        className:
          "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30",
        label: "Membro",
      },
      VIEWER: {
        className:
          "bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-300 border-gray-500/30",
        label: "Visualizador",
      },
    };
    const config = variants[role] || variants.MEMBER;
    return (
      <Badge className={`${config.className} border`}>{config.label}</Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 border">
        Ativo
      </Badge>
    ) : (
      <Badge className="bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border-red-500/30 border">
        Bloqueado
      </Badge>
    );
  };

  const calculateStats = () => {
    const totalSales = users.reduce(
      (acc, u) => acc + (u._stats?.totalSales || 0),
      0,
    );

    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      verified: users.filter((u) => u.emailVerified).length,
      totalSales,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Clientes
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie todos os clientes da plataforma
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total de Clientes"
            value={stats.total}
            description="Todos cadastrados"
            icon={HiUsers}
            gradient="from-blue-500 to-cyan-500"
            delay={0.1}
          />
          <StatCard
            title="Clientes Ativos"
            value={stats.active}
            description="Contas ativas"
            icon={HiCheckCircle}
            gradient="from-green-500 to-emerald-500"
            delay={0.2}
          />
          <StatCard
            title="Emails Verificados"
            value={stats.verified}
            description="Contas verificadas"
            icon={HiShieldCheck}
            gradient="from-purple-500 to-pink-500"
            delay={0.3}
          />
          <StatCard
            title="Total em Vendas"
            value={formatCurrency(stats.totalSales)}
            description="Vendas de todos"
            icon={HiCurrencyDollar}
            gradient="from-orange-500 to-red-500"
            delay={0.4}
          />
        </div>

        {/* Search, Filter and Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">
                    Todos os Clientes
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Lista completa de clientes cadastrados
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                  />
                </div>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[220px] bg-gray-800/50 border-gray-700 text-white">
                    <HiArrowsUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="recent" className="text-white focus:bg-gray-700">
                      Mais Recentes
                    </SelectItem>
                    <SelectItem value="sales" className="text-white focus:bg-gray-700">
                      Maiores Vendedores 💰
                    </SelectItem>
                    <SelectItem value="messages" className="text-white focus:bg-gray-700">
                      Mais Mensagens 💬
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="border border-gray-700/50 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700/50 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300 font-semibold">
                        Cliente
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Email
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Role
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Total Vendas
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Mensagens
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-12 text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <HiUsers className="w-12 h-12 text-gray-600" />
                            <p>Nenhum cliente encontrado</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="border-gray-700/50 hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedUser(user)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-white">
                                  {user.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {user._count?.orders || 0} pedidos
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-gray-400">
                                {user.email}
                              </div>
                              {user.emailVerified && (
                                <HiCheckCircle className="w-4 h-4 text-green-400" title="Email verificado" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-white font-bold">
                                {formatCurrency(user._stats?.totalSales || 0)}
                              </span>
                              <span className="text-xs text-gray-500">
                                Ticket: {formatCurrency(user._stats?.averageOrderValue || 0)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <HiChatBubbleBottomCenterText className="w-4 h-4 text-blue-400" />
                              <span className="text-white font-medium">
                                {user._count?.messages || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-700 hover:bg-blue-500/20 hover:border-blue-500 text-blue-400"
                                onClick={() => setSelectedUser(user)}
                              >
                                <HiEye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className={`border-gray-700 ${
                                  user.isActive
                                    ? "hover:bg-orange-500/20 hover:border-orange-500 text-orange-400"
                                    : "hover:bg-green-500/20 hover:border-green-500 text-green-400"
                                }`}
                                onClick={() => setUserToToggle(user)}
                              >
                                {user.isActive ? (
                                  <HiLockClosed className="w-4 h-4" />
                                ) : (
                                  <HiLockOpen className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-700 hover:bg-red-500/20 hover:border-red-500 text-red-400"
                                onClick={() => setUserToDelete(user)}
                              >
                                <HiTrash className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modal de Detalhes do Cliente */}
      <AnimatePresence>
        {selectedUser && (
          <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Detalhes do Cliente
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Informações completas sobre {selectedUser.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Informações Pessoais */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <HiUsers className="w-5 h-5 text-blue-400" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Nome Completo</label>
                      <p className="text-white font-medium">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 flex items-center gap-1">
                        <HiEnvelope className="w-4 h-4" />
                        Email
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{selectedUser.email}</p>
                        {selectedUser.emailVerified && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            Verificado
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedUser.cpf && (
                      <div>
                        <label className="text-sm text-gray-400">CPF</label>
                        <p className="text-white font-medium">{selectedUser.cpf}</p>
                      </div>
                    )}
                    {selectedUser.birthDate && (
                      <div>
                        <label className="text-sm text-gray-400 flex items-center gap-1">
                          <HiCalendar className="w-4 h-4" />
                          Data de Nascimento
                        </label>
                        <p className="text-white font-medium">
                          {new Date(selectedUser.birthDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Endereço */}
                {selectedUser.cep && (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <HiMapPin className="w-5 h-5 text-green-400" />
                        Endereço
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-white">
                        {selectedUser.street}, {selectedUser.number}
                        {selectedUser.complement && ` - ${selectedUser.complement}`}
                      </p>
                      <p className="text-gray-400">
                        {selectedUser.neighborhood} - {selectedUser.city}/{selectedUser.state}
                      </p>
                      <p className="text-gray-500">CEP: {selectedUser.cep}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-300">
                        Total em Vendas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(selectedUser._stats?.totalSales || 0)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {selectedUser._count?.orders || 0} pedidos realizados
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-300">
                        Ticket Médio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(selectedUser._stats?.averageOrderValue || 0)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Valor médio por pedido
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-300">
                        Campanhas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {selectedUser._count?.campaigns || 0}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Campanhas criadas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-300">
                        Mensagens IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {selectedUser._count?.messages || 0}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Mensagens enviadas
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Informações da Conta */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <HiCreditCard className="w-5 h-5 text-purple-400" />
                      Inform
ações da Conta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedUser.isActive)}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Role</label>
                      <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Data de Cadastro</label>
                      <p className="text-white font-medium">
                        {new Date(selectedUser.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {selectedUser.trialEndsAt && (
                      <div>
                        <label className="text-sm text-gray-400">Trial Termina em</label>
                        <p className="text-white font-medium">
                          {new Date(selectedUser.trialEndsAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Excluir Cliente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja excluir <strong className="text-red-400">{userToDelete?.name}</strong>?
              Esta ação não pode ser desfeita e todos os dados serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação de Bloqueio/Desbloqueio */}
      <AlertDialog open={!!userToToggle} onOpenChange={() => setUserToToggle(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {userToToggle?.isActive ? "Bloquear" : "Desbloquear"} Cliente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja {userToToggle?.isActive ? "bloquear" : "desbloquear"}{" "}
              <strong className="text-blue-400">{userToToggle?.name}</strong>?
              {userToToggle?.isActive && " O cliente não poderá mais acessar a plataforma."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleUserStatus}
              className={`${
                userToToggle?.isActive
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-green-500 hover:bg-green-600"
              } text-white`}
            >
              {userToToggle?.isActive ? "Bloquear" : "Desbloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SuperAdminLayout>
  );
}
