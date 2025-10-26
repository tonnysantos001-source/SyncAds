// ============================================================================
// ADVANCED SCRAPER - Puppeteer + Cheerio para scraping robusto
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// PROCESSAMENTO PARALELO
// ============================================================================

async function processParallel<T>(
  items: T[],
  fn: (item: T) => Promise<any>,
  maxConcurrent = 5
): Promise<any[]> {
  const results = []
  
  // Processar em batches paralelos
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent)
    const batchResults = await Promise.all(
      batch.map(item => fn(item))
    )
    results.push(...batchResults)
  }
  
  return results
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapeRequest {
  url: string;
  format?: 'csv' | 'json' | 'zip';
  userId: string;
  organizationId: string;
  conversationId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Unauthorized')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { url, format = 'csv', userId, organizationId, conversationId }: ScrapeRequest = await req.json()

    console.log('🔍 Starting advanced scraping for:', url)

    // Step 1: Fetch HTML com headers realistas
    console.log('📥 Fetching HTML...')
    const html = await fetchHTML(url)
    
    // Step 2: Tentar extrair produtos com múltiplos métodos
    console.log('📊 Extracting products...')
    const products = await extractProducts(html, url)
    
    console.log(`✅ Found ${products.length} products`)

    // Step 3: Gerar CSV
    console.log('💾 Generating CSV...')
    const csvContent = generateCSV(products, format)

    // Step 4: Upload para Supabase Storage
    console.log('⬆️ Uploading to storage...')
    const fileName = `produtos_${Date.now()}.${format}`
    
    const { error: uploadError } = await supabaseClient.storage
      .from('temp-downloads')
      .upload(fileName, csvContent, {
        contentType: format === 'csv' ? 'text/csv' : 'application/json'
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Step 5: Gerar URL assinada
    const { data: signedUrlData } = await supabaseClient.storage
      .from('temp-downloads')
      .createSignedUrl(fileName, 3600)

    console.log('✅ Scraping completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraping concluído! ${products.length} produtos extraídos.`,
        data: {
          totalProducts: products.length,
          fileName: fileName,
          downloadUrl: signedUrlData?.signedUrl,
          format: format,
          url: url,
          products: products.slice(0, 5) // Preview
        },
        steps: [
          { step: 'Fetching HTML', status: 'completed' },
          { step: 'Extracting products', status: 'completed', details: `${products.length} found` },
          { step: 'Generating CSV', status: 'completed' },
          { step: 'Upload to storage', status: 'completed' },
          { step: 'Creating signed URL', status: 'completed' }
        ]
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('❌ Scraping error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro no scraping: ${error.message}`,
        steps: [{
          step: 'Scraping',
          status: 'failed',
          error: error.message
        }]
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return await response.text()
}

async function extractProducts(html: string, url: string): Promise<any[]> {
  const products: any[] = []

  // Método 1: Extrair JSON embutido (mais confiável)
  console.log('🔍 Method 1: Extracting embedded JSON...')
  const jsonPatterns = [
    /"products":\s*(\[.*?\])/s,
    /window\.__INITIAL_STATE__\s*=\s*({.*?});/s,
    /window\.__APOLLO_STATE__\s*=\s*({.*?});/s,
  ]

  for (const pattern of jsonPatterns) {
    const match = html.match(pattern)
    if (match) {
      try {
        const data = JSON.parse(match[1])
        if (Array.isArray(data)) {
          products.push(...data)
        } else if (data.products) {
          products.push(...data.products)
        }
        if (products.length > 0) {
          console.log(`✅ Found ${products.length} products via JSON`)
          break
        }
      } catch (e) {
        // Continue to next method
      }
    }
  }

  // Método 2: Extrair via regex HTML (fallback)
  if (products.length === 0) {
    console.log('🔍 Method 2: Extracting via HTML patterns...')
    const htmlPatterns = [
      /<div[^>]*class="[^"]*product[^"]*"[^>]*>.*?<h[23][^>]*>([^<]+)<\/h[23]>/gis,
      /itemprop="name"[^>]*>([^<]+)</gi,
      /<a[^>]*href="[^"]*product[^"]*"[^>]*>([^<]+)</gi,
    ]

    for (const pattern of htmlPatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          products.push({
            name: match[1].trim(),
            extracted: true
          })
        }
      }
      if (products.length > 0) break
    }
    console.log(`✅ Found ${products.length} products via HTML`)
  }

  // Método 3: Extrair preços se encontrados
  if (products.length > 0) {
    console.log('💰 Extracting prices...')
    const pricePattern = /"price":\s*(\d+\.?\d*)/g
    const priceMatches = html.matchAll(pricePattern)
    
    let priceIndex = 0
    for (const match of priceMatches) {
      if (products[priceIndex]) {
        products[priceIndex].price = parseFloat(match[1])
        priceIndex++
      }
    }
  }

  return products
}

function generateCSV(products: any[], format: string): string {
  if (products.length === 0) {
    return 'Nome,Preço\nNenhum produto encontrado,0\n'
  }

  const headers = Object.keys(products[0] || {})
  const rows = products.map(p => 
    headers.map(h => {
      const value = p[h]
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
  )

  if (format === 'json') {
    return JSON.stringify(products, null, 2)
  }

  return headers.join(',') + '\n' + rows.map(row => row.join(',')).join('\n')
}
