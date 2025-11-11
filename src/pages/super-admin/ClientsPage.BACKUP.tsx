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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HiUsers,
  HiMagnifyingGlass,
  HiChatBubbleBottomCenterText,
  HiShieldCheck,
  HiCheckCircle,
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
  _count?: {
    campaigns: number;
    messages: number;
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

export default function ClientsPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
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

      // Para cada usuário, buscar contagem de campanhas e mensagens
      const usersWithCounts = await Promise.all(
        clientUsers.map(async (user: any) => {
          const { count: campaignsCount } = await supabase
            .from("Campaign")
            .select("*", { count: "exact", head: true })
            .eq("userId", user.id);

          const { count: messagesCount } = await supabase
            .from("ChatMessage")
            .select("*", { count: "exact", head: true })
            .eq("userId", user.id);

          return {
            ...user,
            _count: {
              campaigns: campaignsCount || 0,
              messages: messagesCount || 0,
            },
          };
        }),
      );

      setUsers(usersWithCounts);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        Suspenso
      </Badge>
    );
  };

  const calculateStats = () => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      verified: users.filter((u) => u.emailVerified).length,
      totalCampaigns: users.reduce(
        (acc, u) => acc + (u._count?.campaigns || 0),
        0,
      ),
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
            Usuários
          </h1>
          <p className="text-gray-400 mt-1">
            Todos os usuários cadastrados na plataforma
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total de Usuários"
            value={stats.total}
            description="Todos cadastrados"
            icon={HiUsers}
            gradient="from-blue-500 to-cyan-500"
            delay={0.1}
          />
          <StatCard
            title="Usuários Ativos"
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
            title="Total Campanhas"
            value={stats.totalCampaigns}
            description="Criadas por todos"
            icon={HiSparkles}
            gradient="from-orange-500 to-red-500"
            delay={0.4}
          />
        </div>

        {/* Search and Table */}
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
                    Todos os Usuários
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Lista completa de usuários cadastrados
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="border border-gray-700/50 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700/50 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300 font-semibold">
                        Usuário
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
                        Campanhas
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Conversas
                      </TableHead>
                      <TableHead className="text-gray-300 font-semibold">
                        Criado em
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-12 text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <HiUsers className="w-12 h-12 text-gray-600" />
                            <p>Nenhum usuário encontrado</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-gray-700/50 hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell>
                            <div className="font-medium text-white">
                              {user.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-400">
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">
                                {user._count?.campaigns || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            {user._count?.messages || 0}
                          </TableCell>
                          <TableCell className="text-sm text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString(
                              "pt-BR",
                            )}
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
    </SuperAdminLayout>
  );
}
