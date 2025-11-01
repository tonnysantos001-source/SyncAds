// ============================================
// JOB PROCESSOR - Queue Processing Engine
// ============================================
// Processa jobs assíncronos (scraping, reports, comparisons)
// Com retry automático e exponential backoff
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_utils/cors.ts';

interface Job {
  id: string;
  userId: string;
  type: string;
  status: string;
  priority: number;
  payload: any;
  attempts: number;
  maxAttempts: number;
  scheduledFor: string | null;
  createdAt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Criar cliente Supabase com service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🔧 Job Processor iniciado');

    // Buscar próximo job pendente
    const { data: jobs, error: fetchError } = await supabaseClient
      .from('JobQueue')
      .select('*')
      .eq('status', 'pending')
      .or(`scheduledFor.is.null,scheduledFor.lte.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('createdAt', { ascending: true })
      .limit(1);

    if (fetchError) {
      throw new Error(`Erro ao buscar jobs: ${fetchError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log('📭 Nenhum job pendente');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum job pendente',
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const job: Job = jobs[0];
    console.log(`📦 Processando job ${job.id} (${job.type})`);

    // Marcar job como processando
    const { error: updateError } = await supabaseClient
      .from('JobQueue')
      .update({
        status: 'processing',
        startedAt: new Date().toISOString(),
        attempts: job.attempts + 1,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', job.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar status:', updateError);
    }

    // Processar job baseado no tipo
    let result: any;
    let success = false;
    let errorMessage = '';

    try {
      switch (job.type) {
        case 'scraping':
          result = await processScraping(job, supabaseClient);
          success = true;
          break;

        case 'price_check':
          result = await processPriceCheck(job, supabaseClient);
          success = true;
          break;

        case 'competitor_analysis':
          result = await processCompetitorAnalysis(job, supabaseClient);
          success = true;
          break;

        case 'scheduled_scraping':
          result = await processScheduledScraping(job, supabaseClient);
          success = true;
          break;

        case 'report_generation':
          result = await processReportGeneration(job, supabaseClient);
          success = true;
          break;

        default:
          throw new Error(`Tipo de job não suportado: ${job.type}`);
      }
    } catch (error: any) {
      console.error(`❌ Erro ao processar job:`, error);
      errorMessage = error.message;
      success = false;
    }

    const executionTime = Date.now() - startTime;

    // Atualizar job com resultado
    if (success) {
      await supabaseClient
        .from('JobQueue')
        .update({
          status: 'completed',
          result,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Criar alerta de sucesso
      await createAlert(supabaseClient, job.userId, {
        type: 'job_completed',
        severity: 'info',
        title: `${getJobTypeName(job.type)} concluído`,
        message: `Seu job foi processado com sucesso em ${executionTime}ms`,
        actionUrl: `/jobs/${job.id}`,
        metadata: { jobId: job.id, jobType: job.type },
      });

      // Registrar métrica
      await recordMetric(supabaseClient, job.userId, {
        toolName: `job_${job.type}`,
        success: true,
        executionTime,
        metadata: { jobId: job.id },
      });

      console.log(`✅ Job ${job.id} concluído com sucesso`);
    } else {
      // Verificar se deve retry
      const shouldRetry = job.attempts < job.maxAttempts;

      if (shouldRetry) {
        // Calcular delay com exponential backoff
        const delay = Math.min(1000 * Math.pow(2, job.attempts), 60000); // Max 1 minuto
        const nextSchedule = new Date(Date.now() + delay);

        await supabaseClient
          .from('JobQueue')
          .update({
            status: 'pending',
            error: errorMessage,
            scheduledFor: nextSchedule.toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .eq('id', job.id);

        console.log(`🔄 Job ${job.id} agendado para retry em ${delay}ms`);
      } else {
        // Falha definitiva
        await supabaseClient
          .from('JobQueue')
          .update({
            status: 'failed',
            error: errorMessage,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .eq('id', job.id);

        // Criar alerta de erro
        await createAlert(supabaseClient, job.userId, {
          type: 'job_failed',
          severity: 'error',
          title: `${getJobTypeName(job.type)} falhou`,
          message: `Erro após ${job.attempts} tentativas: ${errorMessage}`,
          actionUrl: `/jobs/${job.id}`,
          metadata: { jobId: job.id, error: errorMessage },
        });

        // Registrar métrica de falha
        await recordMetric(supabaseClient, job.userId, {
          toolName: `job_${job.type}`,
          success: false,
          executionTime,
          error: errorMessage,
          metadata: { jobId: job.id },
        });

        console.log(`❌ Job ${job.id} falhou definitivamente`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: success ? 'Job processado com sucesso' : 'Job falhou mas foi tratado',
        jobId: job.id,
        jobType: job.type,
        jobSuccess: success,
        executionTime,
        attempts: job.attempts + 1,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Erro crítico no job processor:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// PROCESSADORES DE JOBS
// ============================================================================

async function processScraping(job: Job, supabase: any) {
  console.log('🕷️ Processando scraping...');

  const { url, selectors, extractProducts } = job.payload;

  // Chamar playwright-scraper
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/playwright-scraper`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        url,
        selectors,
        extractProducts: extractProducts ?? true,
        maxProducts: 100,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Scraping falhou: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Scraping falhou');
  }

  return {
    totalProducts: result.data?.products?.length || 0,
    products: result.data?.products || [],
    metadata: result.metadata,
  };
}

async function processPriceCheck(job: Job, supabase: any) {
  console.log('💰 Verificando preços...');

  const { monitorId } = job.payload;

  // Buscar monitor
  const { data: monitor, error } = await supabase
    .from('PriceMonitor')
    .select('*')
    .eq('id', monitorId)
    .single();

  if (error || !monitor) {
    throw new Error('Monitor não encontrado');
  }

  // Fazer scraping do preço
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/playwright-scraper`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        url: monitor.productUrl,
        selectors: monitor.selector ? { price: monitor.selector } : undefined,
        extractProducts: true,
        maxProducts: 1,
      }),
    }
  );

  const result = await response.json();
  const newPrice = extractPrice(result.data);

  // Atualizar monitor
  const priceHistory = monitor.priceHistory || [];
  priceHistory.push({
    price: newPrice,
    checkedAt: new Date().toISOString(),
  });

  await supabase
    .from('PriceMonitor')
    .update({
      currentPrice: newPrice,
      lastPrice: monitor.currentPrice,
      lastCheckedAt: new Date().toISOString(),
      priceHistory: priceHistory.slice(-100), // Manter últimas 100
      updatedAt: new Date().toISOString(),
    })
    .eq('id', monitorId);

  // Verificar se deve alertar
  if (monitor.alertEnabled && monitor.targetPrice && newPrice <= monitor.targetPrice) {
    await createAlert(supabase, monitor.userId, {
      type: 'price_drop',
      severity: 'warning',
      title: '🎉 Preço atingiu o alvo!',
      message: `${monitor.productName} agora custa R$ ${newPrice.toFixed(2)} (alvo: R$ ${monitor.targetPrice.toFixed(2)})`,
      actionUrl: monitor.productUrl,
      metadata: {
        monitorId,
        oldPrice: monitor.currentPrice,
        newPrice,
        targetPrice: monitor.targetPrice,
      },
    });
  }

  return {
    monitorId,
    productName: monitor.productName,
    oldPrice: monitor.currentPrice,
    newPrice,
    priceChange: newPrice - monitor.currentPrice,
    targetReached: monitor.targetPrice && newPrice <= monitor.targetPrice,
  };
}

async function processCompetitorAnalysis(job: Job, supabase: any) {
  console.log('🔍 Analisando concorrentes...');

  const { comparisonId } = job.payload;

  // Buscar comparação
  const { data: comparison, error } = await supabase
    .from('CompetitorComparison')
    .select('*')
    .eq('id', comparisonId)
    .single();

  if (error || !comparison) {
    throw new Error('Comparação não encontrada');
  }

  const results = [];

  // Raspar cada concorrente
  for (const competitor of comparison.competitors) {
    try {
      const response = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/playwright-scraper`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            url: competitor.url,
            extractProducts: true,
            maxProducts: 50,
          }),
        }
      );

      const result = await response.json();

      results.push({
        name: competitor.name,
        url: competitor.url,
        success: result.success,
        totalProducts: result.data?.products?.length || 0,
        products: result.data?.products || [],
        lastScraped: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(`Erro ao raspar ${competitor.name}:`, error);
      results.push({
        name: competitor.name,
        url: competitor.url,
        success: false,
        error: error.message,
      });
    }
  }

  // Calcular summary
  const allProducts = results.flatMap((r) => r.products || []);
  const prices = allProducts
    .map((p) => parseFloat(p.price?.replace(/[^\d,]/g, '').replace(',', '.')))
    .filter((p) => !isNaN(p));

  const summary = {
    totalCompetitors: results.length,
    successfulScrapings: results.filter((r) => r.success).length,
    totalProducts: allProducts.length,
    avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
  };

  // Atualizar comparação
  await supabase
    .from('CompetitorComparison')
    .update({
      competitors: results,
      lastComparisonAt: new Date().toISOString(),
      summary,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', comparisonId);

  return {
    comparisonId,
    results,
    summary,
  };
}

async function processScheduledScraping(job: Job, supabase: any) {
  console.log('📅 Processando scraping agendado...');

  const { scheduledScrapingId } = job.payload;

  // Buscar scraping agendado
  const { data: scheduled, error } = await supabase
    .from('ScheduledScraping')
    .select('*')
    .eq('id', scheduledScrapingId)
    .single();

  if (error || !scheduled) {
    throw new Error('Scraping agendado não encontrado');
  }

  // Executar scraping
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/playwright-scraper`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        url: scheduled.url,
        selectors: scheduled.selectors,
        extractProducts: true,
        maxProducts: 100,
      }),
    }
  );

  const result = await response.json();

  // Calcular próxima execução
  const nextRun = calculateNextRun(scheduled.frequency);

  // Atualizar registro
  await supabase
    .from('ScheduledScraping')
    .update({
      lastRun: new Date().toISOString(),
      nextRun: nextRun.toISOString(),
      runCount: scheduled.runCount + 1,
      successCount: result.success ? scheduled.successCount + 1 : scheduled.successCount,
      failureCount: result.success ? scheduled.failureCount : scheduled.failureCount + 1,
      lastResult: result,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', scheduledScrapingId);

  return {
    scheduledScrapingId,
    name: scheduled.name,
    url: scheduled.url,
    success: result.success,
    totalProducts: result.data?.products?.length || 0,
    nextRun: nextRun.toISOString(),
  };
}

async function processReportGeneration(job: Job, supabase: any) {
  console.log('📊 Gerando relatório...');

  const { reportType, filters } = job.payload;

  // Aqui você implementaria a lógica específica de cada tipo de relatório
  // Por exemplo: relatório de vendas, produtos, métricas, etc.

  return {
    reportType,
    generated: true,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function extractPrice(scrapedData: any): number {
  if (!scrapedData) return 0;

  // Tentar extrair de produtos
  if (scrapedData.products && scrapedData.products.length > 0) {
    const priceStr = scrapedData.products[0].price;
    return parseFloat(priceStr?.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }

  return 0;
}

function calculateNextRun(frequency: string): Date {
  const now = new Date();

  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

function getJobTypeName(type: string): string {
  const names: Record<string, string> = {
    scraping: 'Web Scraping',
    price_check: 'Verificação de Preço',
    competitor_analysis: 'Análise de Concorrentes',
    scheduled_scraping: 'Scraping Agendado',
    report_generation: 'Geração de Relatório',
  };
  return names[type] || type;
}

async function createAlert(supabase: any, userId: string, alert: any) {
  const { error } = await supabase.from('SystemAlert').insert({
    userId,
    type: alert.type,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    actionUrl: alert.actionUrl,
    metadata: alert.metadata,
    read: false,
    createdAt: new Date().toISOString(),
  });

  if (error) {
    console.error('Erro ao criar alerta:', error);
  }
}

async function recordMetric(supabase: any, userId: string, metric: any) {
  const { error } = await supabase.from('AiMetrics').insert({
    userId,
    toolName: metric.toolName,
    success: metric.success,
    executionTime: metric.executionTime,
    error: metric.error,
    metadata: metric.metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (error) {
    console.error('Erro ao registrar métrica:', error);
  }
}
