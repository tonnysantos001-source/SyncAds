// PARTE 1: Melhorias na estrutura de dados
// Adicionar aos imports existentes:
import { HiCurrencyDollar } from "react-icons/hi2";

// Adicionar ao interface UserData:
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
    orders: number;  // NOVO
  };
  _stats?: {         // NOVO
    totalSales: number;
    averageOrderValue: number;
  };
}

// Adicionar função formatCurrency antes do componente:
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// SUBSTITUIR a função loadUsers com esta versão melhorada:
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

// SUBSTITUIR calculateStats com esta versão:
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


