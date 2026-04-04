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
  conversationId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Não autorizado');

    const { toolName, parameters, userId, conversationId }: ToolRequest = await req.json();
    console.log(`Executing tool: ${toolName}`, parameters);

    let result: any;

    if (toolName === 'web_search') {
      result = await executeWebSearch(parameters);
    } else if (toolName === 'web_scrape') {
      result = await executeWebScrape(parameters);
    } else if (toolName === 'create_meta_campaign') {
      const { data: integration } = await supabase.from('Integration').select('credentials').eq('userId', userId).eq('platform', 'META_ADS').eq('isConnected', true).single();
      if (!integration) throw new Error('Meta Ads não conectado');
      result = await createMetaCampaign(parameters, integration.credentials);
    } else if (toolName === 'create_shopify_product') {
      const { data: integration } = await supabase.from('Integration').select('credentials').eq('userId', userId).eq('platform', 'SHOPIFY').eq('isConnected', true).single();
      if (!integration) throw new Error('Shopify não conectado');
      result = await createShopifyProduct(parameters, integration.credentials);
    } else if (toolName === 'get_analytics') {
      result = await getAnalytics(parameters, userId, supabase);
    } else if (toolName === 'generate_image') {
      // Forward Auth Header to sub-function
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { ...parameters, provider: 'auto' },
        headers: { 'Authorization': authHeader }
      });
      if (error || !data.success) throw new Error(error?.message || data?.error || 'Erro na imagem');
      result = data;
    } else if (toolName === 'generate_video') {
      // Forward Auth Header to sub-function
      result = await executeGenerateVideo(parameters, supabase, authHeader);
    } else if (toolName === 'generate_marketing_asset') {
      result = await executeGenerateMarketingAsset(parameters, supabase, authHeader);
    } else {
      throw new Error(`Tool não encontrada: ${toolName}`);
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

// ============================================================================
// HELPERS
// ============================================================================

async function executeWebSearch(params: { query: string; maxResults?: number }) {
  const { query, maxResults = 5 } = params;
  const exaKey = Deno.env.get('EXA_API_KEY');
  if (!exaKey) throw new Error("EXA_API_KEY not set");
  const resp = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, numResults: maxResults, type: 'neural' })
  });
  const data = await resp.json();
  return { success: true, data: { results: data.results } };
}

async function executeWebScrape(params: { url: string }) {
  const resp = await fetch(params.url);
  const text = await resp.text();
  return { success: true, data: { content: text.substring(0, 5000) } };
}

async function createMetaCampaign(params: any, creds: any) {
  return { success: true, message: "Campaign created (simulated)", data: { id: "123" } };
}

async function createShopifyProduct(params: any, creds: any) {
  return { success: true, message: "Product created (simulated)", data: { id: "456" } };
}

async function getAnalytics(params: any, userId: string, supabase: any) {
  return { success: true, data: { clicks: 100, impressions: 1000 } };
}

async function executeGenerateVideo(params: { prompt: string; duration?: number }, supabase: any, authHeader: string) {
  const { prompt, duration = 3 } = params;
  const { data, error } = await supabase.functions.invoke('generate-video', { 
    body: { prompt, duration },
    headers: { 'Authorization': authHeader }
  });
  if (error || !data.success) throw new Error(error?.message || data?.error || 'Erro no vídeo');
  return data;
}

async function executeGenerateMarketingAsset(params: { platform: string; type: string; prompt: string; asset_type?: 'image' | 'video' }, supabase: any, authHeader: string) {
  const { platform, type, prompt, asset_type = 'image' } = params;
  const sizeMap: any = {
    tiktok: { portrait: "1080x1920", square: "1080x1080" },
    meta: { square: "1080x1080", stories: "1080x1920", feed: "1080x1350" },
    google: { landscape: "1200x628", square: "1200x1200", rectangle: "300x250" },
    shopify: { banner: "2400x1200", logo: "512x512", product: "1024x1024" }
  };
  const size = sizeMap[platform.toLowerCase()]?.[type.toLowerCase()] || "1024x1024";
  
  if (asset_type === 'video') return await executeGenerateVideo({ prompt, duration: 5 }, supabase, authHeader);
  
  const { data, error } = await supabase.functions.invoke('generate-image', { 
    body: { prompt, size },
    headers: { 'Authorization': authHeader }
  });
  
  if (error || !data.success) throw new Error(error?.message || data?.error);
  return { success: true, data: { url: data.image?.url || data.url, platform, type, size } };
}
