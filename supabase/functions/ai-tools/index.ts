import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ToolRequest {
  toolName: string;
  parameters: any;
  userId: string;
  organizationId: string;
  conversationId: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Não autorizado');
    }

    // Parse request
    const { toolName, parameters, userId, organizationId, conversationId }: ToolRequest = await req.json();

    console.log(`Executing tool: ${toolName}`, parameters);

    let result: any;

    // ========================================================================
    // WEB SEARCH TOOLS
    // ========================================================================

    if (toolName === 'web_search') {
      result = await executeWebSearch(parameters);
    }

    // ========================================================================
    // WEB SCRAPING
    // ========================================================================

    else if (toolName === 'web_scrape') {
      result = await executeWebScrape(parameters);
    }

    // ========================================================================
    // META ADS TOOLS
    // ========================================================================

    else if (toolName === 'create_meta_campaign') {
      // Buscar credentials do Meta
      const { data: integration } = await supabase
        .from('Integration')
        .select('credentials')
        .eq('userId', userId)
        .eq('platform', 'META_ADS')
        .eq('isConnected', true)
        .single();

      if (!integration) {
        throw new Error('Meta Ads não conectado. Conecte primeiro usando o OAuth.');
      }

      result = await createMetaCampaign(parameters, integration.credentials);
    }

    // ========================================================================
    // SHOPIFY TOOLS
    // ========================================================================

    else if (toolName === 'create_shopify_product') {
      const { data: integration } = await supabase
        .from('Integration')
        .select('credentials')
        .eq('userId', userId)
        .eq('platform', 'SHOPIFY')
        .eq('isConnected', true)
        .single();

      if (!integration) {
        throw new Error('Shopify não conectado. Forneça as credenciais primeiro.');
      }

      result = await createShopifyProduct(parameters, integration.credentials);
    }

    // ========================================================================
    // ANALYTICS
    // ========================================================================

    else if (toolName === 'get_analytics') {
      result = await getAnalytics(parameters, userId, organizationId, supabase);
    }

    // ========================================================================
    // UNKNOWN TOOL
    // ========================================================================

    else {
      throw new Error(`Tool não encontrada: ${toolName}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function executeWebSearch(params: { query: string; maxResults?: number }) {
  const { query, maxResults = 5 } = params;

  // Usar Serper API (alternativa ao Google)
  // https://serper.dev/
  const serperApiKey = Deno.env.get('SERPER_API_KEY');

  if (!serperApiKey) {
    return {
      success: false,
      message: 'SERPER_API_KEY não configurada',
    };
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': serperApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: maxResults,
    }),
  });

  const data = await response.json();

  return {
    success: true,
    message: `Encontrados ${data.organic?.length || 0} resultados`,
    data: {
      query,
      results: data.organic?.map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
      })) || [],
      answerBox: data.answerBox,
      knowledgeGraph: data.knowledgeGraph,
    },
  };
}

async function executeWebScrape(params: { url: string; selector?: string }) {
  const { url } = params;

  try {
    const response = await fetch(url);
    const html = await response.text();

    // Extração simples - idealmente usar cheerio ou similar
    const textContent = html.replace(/<[^>]*>/g, ' ').substring(0, 5000);

    return {
      success: true,
      message: `Conteúdo extraído de ${url}`,
      data: {
        url,
        content: textContent,
        statusCode: response.status,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao acessar ${url}: ${error.message}`,
    };
  }
}

async function createMetaCampaign(params: any, credentials: any) {
  const { name, objective, budget } = params;
  const { accessToken, adAccountId } = credentials;

  // Chamar Meta Graph API
  const response = await fetch(
    `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        objective,
        status: 'PAUSED',
        daily_budget: Math.round(budget * 100), // centavos
        access_token: accessToken,
      }),
    }
  );

  const data = await response.json();

  if (data.error) {
    return {
      success: false,
      message: `Erro Meta API: ${data.error.message}`,
    };
  }

  return {
    success: true,
    message: `Campanha "${name}" criada no Meta Ads!`,
    data: {
      campaignId: data.id,
      name,
    },
  };
}

async function createShopifyProduct(params: any, credentials: any) {
  const { title, description, price, inventory } = params;
  const { shopName, apiKey, apiSecret } = credentials;

  const authHeader = 'Basic ' + btoa(`${apiKey}:${apiSecret}`);

  const response = await fetch(
    `https://${shopName}/admin/api/2024-01/products.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product: {
          title,
          body_html: description,
          variants: [
            {
              price,
              inventory_quantity: inventory,
            },
          ],
        },
      }),
    }
  );

  const data = await response.json();

  if (data.errors) {
    return {
      success: false,
      message: `Erro Shopify: ${JSON.stringify(data.errors)}`,
    };
  }

  return {
    success: true,
    message: `Produto "${title}" criado na Shopify!`,
    data: {
      productId: data.product?.id,
      title,
    },
  };
}

async function getAnalytics(params: any, userId: string, organizationId: string, supabase: any) {
  const { platform, startDate, endDate } = params;

  // Buscar campanhas do Supabase
  let query = supabase
    .from('Campaign')
    .select('*')
    .eq('userId', userId)
    .gte('createdAt', startDate)
    .lte('createdAt', endDate);

  if (platform !== 'ALL') {
    query = query.eq('platform', platform);
  }

  const { data: campaigns, error } = await query;

  if (error) {
    return {
      success: false,
      message: `Erro ao buscar analytics: ${error.message}`,
    };
  }

  // Agregar métricas
  const metrics = campaigns.reduce(
    (acc, campaign) => ({
      impressions: acc.impressions + (campaign.impressions || 0),
      clicks: acc.clicks + (campaign.clicks || 0),
      conversions: acc.conversions + (campaign.conversions || 0),
      spend: acc.spend + (campaign.budgetSpent || 0),
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
  );

  const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
  const cpc = metrics.clicks > 0 ? metrics.spend / metrics.clicks : 0;

  return {
    success: true,
    message: `Analytics de ${startDate} até ${endDate}`,
    data: {
      ...metrics,
      ctr: ctr.toFixed(2),
      cpc: cpc.toFixed(2),
      totalCampaigns: campaigns.length,
    },
  };
}
