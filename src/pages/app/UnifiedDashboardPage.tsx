import React, { Suspense, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, BarChart3, Megaphone, Sparkles, DollarSign, Target, Activity } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { ActiveCampaignsTable } from './dashboard/ActiveCampaignsTable';
import { DashboardChart } from './dashboard/DashboardChart';
import { ConversionGoalsCard } from './dashboard/ConversionGoalsCard';
import { AiSuggestionsCard } from './dashboard/AiSuggestionsCard';
import { cn } from '@/lib/utils';
import { RecentCampaignsTable } from './dashboard/RecentCampaignsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Link } from 'react-router-dom';

// Importar componentes de Campanhas
import { NewCampaignModal } from './campaigns/NewCampaignModal';
import { EmptyState } from '@/components/EmptyState';

type MetricCardProps = {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ElementType;
  color: string;
  loading?: boolean;
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon: Icon, color, loading }) => {
  const isIncrease = changeType === 'increase';

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('rounded-full p-2', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center">
          <span className={`flex items-center mr-1 ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
            {isIncrease ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {change}
          </span>
          vs. mês passado
        </p>
      </CardContent>
    </Card>
  );
};

const UnifiedDashboardPage: React.FC = () => {
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const { campaigns } = useStore();
  const metrics = useDashboardMetrics();

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral completa do seu negócio</p>
        </div>
        <Button onClick={() => setIsNewCampaignOpen(true)} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Métricas Gerais - Dados Reais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Campanhas"
          value={metrics.totalCampaigns.value}
          change={metrics.totalCampaigns.change}
          changeType={metrics.totalCampaigns.changeType}
          icon={Megaphone}
          color="bg-blue-500/20 text-blue-500"
          loading={metrics.loading}
        />
        <MetricCard
          title="Cliques Totais"
          value={metrics.totalClicks.value.toLocaleString()}
          change={metrics.totalClicks.change}
          changeType={metrics.totalClicks.changeType}
          icon={Target}
          color="bg-purple-500/20 text-purple-500"
          loading={metrics.loading}
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${metrics.conversionRate.value.toFixed(1)}%`}
          change={metrics.conversionRate.change}
          changeType={metrics.conversionRate.changeType}
          icon={Activity}
          color="bg-green-500/20 text-green-500"
          loading={metrics.loading}
        />
        <MetricCard
          title="Receita Total"
          value={`R$ ${metrics.totalRevenue.value.toLocaleString()}`}
          change={metrics.totalRevenue.change}
          changeType={metrics.totalRevenue.changeType}
          icon={DollarSign}
          color="bg-amber-500/20 text-amber-500"
          loading={metrics.loading}
        />
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance de Campanhas</CardTitle>
                  <CardDescription>Últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <DashboardChart />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Campanhas Ativas</CardTitle>
                  <CardDescription>Campanhas em execução no momento</CardDescription>
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
                  <CardDescription>Campanhas concluídas recentemente</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentCampaignsTable />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Campanhas */}
        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="Nenhuma campanha criada"
              description="Crie sua primeira campanha para começar a anunciar"
              actionLabel="Criar Campanha"
              onAction={() => setIsNewCampaignOpen(true)}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <CardDescription>{campaign.platform}</CardDescription>
                      </div>
                      <Badge variant={campaign.status === 'Ativa' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Orçamento</span>
                        <span className="font-medium">
                          R$ {campaign.budgetSpent.toLocaleString()} / R$ {campaign.budgetTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(campaign.budgetSpent / campaign.budgetTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Impressões</p>
                        <p className="font-semibold">{campaign.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cliques</p>
                        <p className="font-semibold">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversões</p>
                        <p className="font-semibold">{campaign.conversions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ROI</p>
                        <p className="font-semibold text-green-600">{campaign.roi}</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/campaigns/${campaign.id}`}>Ver Detalhes</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Detalhada</CardTitle>
                <CardDescription>Análise completa dos últimos 90 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardChart />
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Conversão por Plataforma</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Facebook Ads', 'Google Ads', 'Instagram Ads', 'LinkedIn Ads'].map((platform, index) => {
                      const percentage = [12.5, 8.3, 15.2, 6.8][index];
                      return (
                        <div key={platform} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{platform}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
                              style={{ width: `${percentage * 5}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Funil de Conversão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Impressões', value: 125000, percentage: 100 },
                      { label: 'Cliques', value: 8750, percentage: 7 },
                      { label: 'Landing Page', value: 6125, percentage: 4.9 },
                      { label: 'Conversões', value: 1225, percentage: 1 }
                    ].map((stage) => (
                      <div key={stage.label} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{stage.label}</span>
                          <span className="font-medium">{stage.value.toLocaleString()} ({stage.percentage}%)</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                            style={{ width: `${stage.percentage * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Nova Campanha */}
      <NewCampaignModal 
        open={isNewCampaignOpen}
        onOpenChange={setIsNewCampaignOpen}
      />
    </div>
  );
};

export default UnifiedDashboardPage;
