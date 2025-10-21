import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { ActiveCampaignsTable } from './dashboard/ActiveCampaignsTable';
import { DashboardChart } from './dashboard/DashboardChart';
import { ConversionGoalsCard } from './dashboard/ConversionGoalsCard';
import { AiSuggestionsCard } from './dashboard/AiSuggestionsCard';
import { cn } from '@/lib/utils';
import { RecentCampaignsTable } from './dashboard/RecentCampaignsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { ordersApi } from '@/lib/api/ordersApi';
import { customersApi } from '@/lib/api/customersApi';
import { productsApi } from '@/lib/api/productsApi';

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
}

const DashboardPage = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenueChange: 0,
    ordersChange: 0,
    customersChange: 0,
    productsChange: 0,
  });
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  const loadDashboardMetrics = async () => {
    try {
      if (!user?.organizationId) return;

      // Carregar dados em paralelo
      const [orders, customers, products] = await Promise.all([
        ordersApi.getAll(user.organizationId),
        customersApi.list(),
        productsApi.list(),
      ]);

      // Calcular métricas
      const totalRevenue = orders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + o.total, 0);

      const totalOrders = orders.length;
      const totalCustomers = customers.length;
      const totalProducts = products.length;

      // Calcular mudanças (comparado com mês passado - simplificado)
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      
      const lastMonthOrders = orders.filter(
        (o) => new Date(o.createdAt) < lastMonth
      );
      const lastMonthRevenue = lastMonthOrders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + o.total, 0);

      const revenueChange = lastMonthRevenue > 0
        ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

      setMetrics({
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        revenueChange,
        ordersChange: 12.5, // Placeholder
        customersChange: 8.2, // Placeholder
        productsChange: 5.0, // Placeholder
      });
    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const dashboardMetrics = [
    {
      title: 'Receita Total',
      value: formatCurrency(metrics.totalRevenue),
      change: `${metrics.revenueChange.toFixed(1)}%`,
      changeType: metrics.revenueChange >= 0 ? 'increase' : 'decrease',
      icon: DollarSign,
      color: 'bg-green-500/10 text-green-500',
    },
    {
      title: 'Pedidos',
      value: metrics.totalOrders.toString(),
      change: `${metrics.ordersChange.toFixed(1)}%`,
      changeType: 'increase',
      icon: ShoppingCart,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      title: 'Clientes',
      value: metrics.totalCustomers.toString(),
      change: `${metrics.customersChange.toFixed(1)}%`,
      changeType: 'increase',
      icon: Users,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      title: 'Produtos',
      value: metrics.totalProducts.toString(),
      change: `${metrics.productsChange.toFixed(1)}%`,
      changeType: 'increase',
      icon: Package,
      color: 'bg-orange-500/10 text-orange-500',
    },
  ];

  return (
    <div className="flex-1 space-y-6">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardMetrics.map((metric) => {
            const Icon = metric.icon;
            const isIncrease = metric.changeType === 'increase';
            
            return (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className={cn('rounded-full p-2', metric.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <span className={`flex items-center mr-1 ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
                      {isIncrease ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {metric.change}
                    </span>
                    vs. mês passado
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance de Campanhas</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <DashboardChart />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Campanhas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <ActiveCampaignsTable />
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <ConversionGoalsCard />
          <AiSuggestionsCard />
          <Card>
            <CardHeader>
                <CardTitle>Campanhas Recentes</CardTitle>
                <CardDescription>Campanhas concluídas recentemente.</CardDescription>
            </CardHeader>
            <CardContent>
                <RecentCampaignsTable />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
