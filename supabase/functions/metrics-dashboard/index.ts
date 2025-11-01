// ============================================
// METRICS DASHBOARD - Analytics & Monitoring
// ============================================
// API para dashboard de métricas e analytics
// Retorna estatísticas de uso, performance, jobs, etc.
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_utils/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Autenticação
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    let response;

    switch (endpoint) {
      case 'overview':
        response = await getOverview(supabaseClient, user.id);
        break;

      case 'ai-usage':
        response = await getAiUsage(supabaseClient, user.id, url.searchParams);
        break;

      case 'jobs':
        response = await getJobsMetrics(supabaseClient, user.id, url.searchParams);
        break;

      case 'alerts':
        response = await getAlerts(supabaseClient, user.id);
        break;

      case 'price-monitors':
        response = await getPriceMonitors(supabaseClient, user.id);
        break;

      case 'scheduled-scrapings':
        response = await getScheduledScrapings(supabaseClient, user.id);
        break;

      case 'competitors':
        response = await getCompetitorComparisons(supabaseClient, user.id);
        break;

      case 'performance':
        response = await getPerformanceMetrics(supabaseClient, user.id);
        break;

      default:
        response = await getOverview(supabaseClient, user.id);
    }

    return new Response(
      JSON.stringify({ success: true, data: response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Metrics error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// OVERVIEW - Resumo geral
// ============================================
async function getOverview(supabase: any, userId: string) {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total de métricas de IA (últimas 24h)
  const { data: aiMetrics24h } = await supabase
    .from('AiMetrics')
    .select('success, executionTime')
    .eq('userId', userId)
    .gte('createdAt', last24h.toISOString());

  const totalRequests24h = aiMetrics24h?.length || 0;
  const successRequests24h = aiMetrics24h?.filter((m: any) => m.success).length || 0;
  const avgExecutionTime = aiMetrics24h?.length > 0
    ? aiMetrics24h.reduce((sum: number, m: any) => sum + (m.executionTime || 0), 0) / aiMetrics24h.length
    : 0;

  // Jobs (últimos 7 dias)
  const { data: jobs7d } = await supabase
    .from('JobQueue')
    .select('status')
    .eq('userId', userId)
    .gte('createdAt', last7d.toISOString());

  const totalJobs = jobs7d?.length || 0;
  const completedJobs = jobs7d?.filter((j: any) => j.status === 'completed').length || 0;
  const failedJobs = jobs7d?.filter((j: any) => j.status === 'failed').length || 0;
  const pendingJobs = jobs7d?.filter((j: any) => j.status === 'pending').length || 0;

  // Alertas não lidos
  const { data: unreadAlerts } = await supabase
    .from('SystemAlert')
    .select('severity')
    .eq('userId', userId)
    .eq('read', false);

  // Monitores de preço ativos
  const { data: activeMonitors } = await supabase
    .from('PriceMonitor')
    .select('id')
    .eq('userId', userId)
    .eq('alertEnabled', true);

  // Scraping agendados ativos
  const { data: activeScrapings } = await supabase
    .from('ScheduledScraping')
    .select('id')
    .eq('userId', userId)
    .eq('enabled', true);

  // Comparações de concorrentes
  const { data: comparisons } = await supabase
    .from('CompetitorComparison')
    .select('id')
    .eq('userId', userId);

  return {
    aiUsage: {
      last24h: {
        totalRequests: totalRequests24h,
        successRate: totalRequests24h > 0 ? (successRequests24h / totalRequests24h) * 100 : 0,
        avgExecutionTime: Math.round(avgExecutionTime),
      },
    },
    jobs: {
      last7d: {
        total: totalJobs,
        completed: completedJobs,
        failed: failedJobs,
        pending: pendingJobs,
        successRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      },
    },
    alerts: {
      unread: unreadAlerts?.length || 0,
      critical: unreadAlerts?.filter((a: any) => a.severity === 'critical').length || 0,
    },
    monitoring: {
      activePriceMonitors: activeMonitors?.length || 0,
      activeScrapings: activeScrapings?.length || 0,
      competitorComparisons: comparisons?.length || 0,
    },
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// AI USAGE - Uso detalhado da IA
// ============================================
async function getAiUsage(supabase: any, userId: string, params: URLSearchParams) {
  const days = parseInt(params.get('days') || '7');
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Métricas por ferramenta
  const { data: metrics } = await supabase
    .from('AiMetrics')
    .select('*')
    .eq('userId', userId)
    .gte('createdAt', startDate.toISOString())
    .order('createdAt', { ascending: false });

  if (!metrics || metrics.length === 0) {
    return {
      totalRequests: 0,
      byTool: [],
      timeline: [],
      successRate: 0,
    };
  }

  // Agrupar por ferramenta
  const byTool: Record<string, any> = {};
  metrics.forEach((m: any) => {
    if (!byTool[m.toolName]) {
      byTool[m.toolName] = {
        toolName: m.toolName,
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        avgExecutionTime: 0,
        totalExecutionTime: 0,
      };
    }
    byTool[m.toolName].totalCalls++;
    if (m.success) {
      byTool[m.toolName].successCalls++;
    } else {
      byTool[m.toolName].failedCalls++;
    }
    byTool[m.toolName].totalExecutionTime += m.executionTime || 0;
  });

  // Calcular médias
  Object.values(byTool).forEach((tool: any) => {
    tool.avgExecutionTime = Math.round(tool.totalExecutionTime / tool.totalCalls);
    tool.successRate = (tool.successCalls / tool.totalCalls) * 100;
    delete tool.totalExecutionTime;
  });

  // Timeline (por dia)
  const timeline: Record<string, any> = {};
  metrics.forEach((m: any) => {
    const date = m.createdAt.split('T')[0];
    if (!timeline[date]) {
      timeline[date] = { date, total: 0, success: 0, failed: 0 };
    }
    timeline[date].total++;
    if (m.success) {
      timeline[date].success++;
    } else {
      timeline[date].failed++;
    }
  });

  return {
    totalRequests: metrics.length,
    successRate: (metrics.filter((m: any) => m.success).length / metrics.length) * 100,
    byTool: Object.values(byTool).sort((a: any, b: any) => b.totalCalls - a.totalCalls),
    timeline: Object.values(timeline).sort((a: any, b: any) => a.date.localeCompare(b.date)),
  };
}

// ============================================
// JOBS - Métricas de jobs
// ============================================
async function getJobsMetrics(supabase: any, userId: string, params: URLSearchParams) {
  const limit = parseInt(params.get('limit') || '50');
  const status = params.get('status') || 'all';

  let query = supabase
    .from('JobQueue')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
    .limit(limit);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: jobs } = await query;

  // Estatísticas por tipo
  const byType: Record<string, any> = {};
  jobs?.forEach((j: any) => {
    if (!byType[j.type]) {
      byType[j.type] = {
        type: j.type,
        total: 0,
        completed: 0,
        failed: 0,
        pending: 0,
        processing: 0,
      };
    }
    byType[j.type].total++;
    byType[j.type][j.status]++;
  });

  return {
    totalJobs: jobs?.length || 0,
    byType: Object.values(byType),
    recentJobs: jobs?.slice(0, 10).map((j: any) => ({
      id: j.id,
      type: j.type,
      status: j.status,
      createdAt: j.createdAt,
      completedAt: j.completedAt,
      attempts: j.attempts,
      error: j.error,
    })),
  };
}

// ============================================
// ALERTS - Alertas do sistema
// ============================================
async function getAlerts(supabase: any, userId: string) {
  const { data: alerts } = await supabase
    .from('SystemAlert')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
    .limit(50);

  const unread = alerts?.filter((a: any) => !a.read) || [];
  const bySeverity = {
    info: alerts?.filter((a: any) => a.severity === 'info').length || 0,
    warning: alerts?.filter((a: any) => a.severity === 'warning').length || 0,
    error: alerts?.filter((a: any) => a.severity === 'error').length || 0,
    critical: alerts?.filter((a: any) => a.severity === 'critical').length || 0,
  };

  return {
    total: alerts?.length || 0,
    unread: unread.length,
    bySeverity,
    recent: alerts?.slice(0, 10),
  };
}

// ============================================
// PRICE MONITORS - Monitores de preço
// ============================================
async function getPriceMonitors(supabase: any, userId: string) {
  const { data: monitors } = await supabase
    .from('PriceMonitor')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  const activeMonitors = monitors?.filter((m: any) => m.alertEnabled) || [];
  const targetReached = monitors?.filter(
    (m: any) => m.targetPrice && m.currentPrice && m.currentPrice <= m.targetPrice
  ) || [];

  return {
    total: monitors?.length || 0,
    active: activeMonitors.length,
    targetReached: targetReached.length,
    monitors: monitors?.map((m: any) => ({
      id: m.id,
      productName: m.productName,
      productUrl: m.productUrl,
      currentPrice: m.currentPrice,
      targetPrice: m.targetPrice,
      alertEnabled: m.alertEnabled,
      lastCheckedAt: m.lastCheckedAt,
      priceHistory: m.priceHistory?.slice(-10), // Últimas 10 mudanças
    })),
  };
}

// ============================================
// SCHEDULED SCRAPINGS - Scraping agendado
// ============================================
async function getScheduledScrapings(supabase: any, userId: string) {
  const { data: scrapings } = await supabase
    .from('ScheduledScraping')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  const active = scrapings?.filter((s: any) => s.enabled) || [];
  const totalRuns = scrapings?.reduce((sum: number, s: any) => sum + s.runCount, 0) || 0;
  const totalSuccess = scrapings?.reduce((sum: number, s: any) => sum + s.successCount, 0) || 0;

  return {
    total: scrapings?.length || 0,
    active: active.length,
    totalRuns,
    totalSuccess,
    successRate: totalRuns > 0 ? (totalSuccess / totalRuns) * 100 : 0,
    scrapings: scrapings?.map((s: any) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      frequency: s.frequency,
      enabled: s.enabled,
      lastRun: s.lastRun,
      nextRun: s.nextRun,
      runCount: s.runCount,
      successCount: s.successCount,
      failureCount: s.failureCount,
    })),
  };
}

// ============================================
// COMPETITORS - Comparações de concorrentes
// ============================================
async function getCompetitorComparisons(supabase: any, userId: string) {
  const { data: comparisons } = await supabase
    .from('CompetitorComparison')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  return {
    total: comparisons?.length || 0,
    comparisons: comparisons?.map((c: any) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      frequency: c.frequency,
      lastComparisonAt: c.lastComparisonAt,
      summary: c.summary,
      competitors: c.competitors?.map((comp: any) => ({
        name: comp.name,
        url: comp.url,
        totalProducts: comp.totalProducts || 0,
        lastScraped: comp.lastScraped,
      })),
    })),
  };
}

// ============================================
// PERFORMANCE - Métricas de performance
// ============================================
async function getPerformanceMetrics(supabase: any, userId: string) {
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Tempos de execução
  const { data: metrics } = await supabase
    .from('AiMetrics')
    .select('toolName, executionTime, success')
    .eq('userId', userId)
    .gte('createdAt', last7d.toISOString());

  const byTool: Record<string, any> = {};
  metrics?.forEach((m: any) => {
    if (!byTool[m.toolName]) {
      byTool[m.toolName] = {
        toolName: m.toolName,
        times: [],
        successCount: 0,
        failureCount: 0,
      };
    }
    if (m.executionTime) {
      byTool[m.toolName].times.push(m.executionTime);
    }
    if (m.success) {
      byTool[m.toolName].successCount++;
    } else {
      byTool[m.toolName].failureCount++;
    }
  });

  // Calcular estatísticas
  const performance = Object.values(byTool).map((tool: any) => {
    const times = tool.times.sort((a: number, b: number) => a - b);
    const avg = times.reduce((a: number, b: number) => a + b, 0) / times.length;
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];

    return {
      toolName: tool.toolName,
      avgTime: Math.round(avg),
      p50: Math.round(p50 || 0),
      p95: Math.round(p95 || 0),
      p99: Math.round(p99 || 0),
      minTime: Math.round(Math.min(...times)),
      maxTime: Math.round(Math.max(...times)),
      successRate: ((tool.successCount / (tool.successCount + tool.failureCount)) * 100).toFixed(2),
    };
  });

  return {
    byTool: performance.sort((a: any, b: any) => b.avgTime - a.avgTime),
  };
}
