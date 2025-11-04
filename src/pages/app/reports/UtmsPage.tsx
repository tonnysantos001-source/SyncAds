import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  RefreshCw,
  Search,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { utmApi, UTMStats, UTMAnalytics } from "@/lib/api/utmApi";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const UtmsPage = () => {
  const [stats, setStats] = useState<UTMStats | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [mediums, setMediums] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<{
    source?: string;
    medium?: string;
    campaign?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, dateRange]);

  const loadData = async () => {
    try {
      if (!user?.id) return;
      setLoading(true);

      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const period = {
        from: subDays(new Date(), days).toISOString(),
        to: new Date().toISOString(),
      };

      const [statsData, sourcesData, mediumsData, campaignsData] =
        await Promise.all([
          utmApi.getStats(user.id, period),
          utmApi.getUniqueSources(user.id),
          utmApi.getUniqueMediums(user.id),
          utmApi.getUniqueCampaigns(user.id),
        ]);

      setStats(statsData);
      setSources(sourcesData);
      setMediums(mediumsData);
      setCampaigns(campaignsData);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const filterBySearch = (items: [string, UTMAnalytics][]) => {
    if (!searchTerm) return items;
    return items.filter(([name]) =>
      name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const getPeriodLabel = () => {
    switch (dateRange) {
      case "7d":
        return "Últimos 7 dias";
      case "30d":
        return "Últimos 30 dias";
      case "90d":
        return "Últimos 90 dias";
      default:
        return "Período";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Rastreamento UTM
          </h1>
          <p className="text-muted-foreground">
            Analise o desempenho de suas campanhas de marketing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Sessões
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                {getPeriodLabel()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalConversions}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa: {formatPercent(stats.conversionRate)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket médio: {formatCurrency(stats.averageOrderValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Conversão
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercent(stats.conversionRate)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSessions} sessões
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por fonte, meio ou campanha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">
            <BarChart3 className="h-4 w-4 mr-2" />
            Fontes ({sources.length})
          </TabsTrigger>
          <TabsTrigger value="mediums">
            <ExternalLink className="h-4 w-4 mr-2" />
            Meios ({mediums.length})
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Target className="h-4 w-4 mr-2" />
            Campanhas ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="top">
            <TrendingUp className="h-4 w-4 mr-2" />
            Top Performers
          </TabsTrigger>
        </TabsList>

        {/* Sources */}
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Fonte</CardTitle>
              <CardDescription>
                Análise de tráfego por fonte de origem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && Object.keys(stats.bySource).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma fonte rastreada ainda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fonte</TableHead>
                      <TableHead className="text-right">Visitas</TableHead>
                      <TableHead className="text-right">Conversões</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Ticket Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats &&
                      filterBySearch(Object.entries(stats.bySource))
                        .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue)
                        .map(([source, data]) => (
                          <TableRow key={source}>
                            <TableCell>
                              <div className="font-medium">{source}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              {data.totalVisits}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium text-green-600">
                                {data.totalConversions}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">
                                {formatPercent(data.conversionRate)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(data.totalRevenue)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(data.averageOrderValue)}
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mediums */}
        <TabsContent value="mediums">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Meio</CardTitle>
              <CardDescription>
                Análise de tráfego por meio de aquisição
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && Object.keys(stats.byMedium).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum meio rastreado ainda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meio</TableHead>
                      <TableHead className="text-right">Visitas</TableHead>
                      <TableHead className="text-right">Conversões</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Ticket Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats &&
                      filterBySearch(Object.entries(stats.byMedium))
                        .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue)
                        .map(([medium, data]) => (
                          <TableRow key={medium}>
                            <TableCell>
                              <div className="font-medium">{medium}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              {data.totalVisits}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium text-green-600">
                                {data.totalConversions}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">
                                {formatPercent(data.conversionRate)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(data.totalRevenue)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(data.averageOrderValue)}
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Campanha</CardTitle>
              <CardDescription>
                Análise detalhada de cada campanha
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && Object.keys(stats.byCampaign).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma campanha rastreada ainda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campanha</TableHead>
                      <TableHead className="text-right">Visitas</TableHead>
                      <TableHead className="text-right">Conversões</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Ticket Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats &&
                      filterBySearch(Object.entries(stats.byCampaign))
                        .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue)
                        .map(([campaign, data]) => (
                          <TableRow key={campaign}>
                            <TableCell>
                              <div className="font-medium">{campaign}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              {data.totalVisits}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium text-green-600">
                                {data.totalConversions}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">
                                {formatPercent(data.conversionRate)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(data.totalRevenue)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(data.averageOrderValue)}
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Performers */}
        <TabsContent value="top">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Top Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Fontes</CardTitle>
                <CardDescription>Por receita gerada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topPerformers.sources.slice(0, 5).map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.conversions} conversões
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {formatCurrency(item.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Mediums */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Meios</CardTitle>
                <CardDescription>Por receita gerada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topPerformers.mediums.slice(0, 5).map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.conversions} conversões
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {formatCurrency(item.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Campanhas</CardTitle>
                <CardDescription>Por receita gerada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topPerformers.campaigns
                    .slice(0, 5)
                    .map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.conversions} conversões
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            {formatCurrency(item.revenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UtmsPage;
