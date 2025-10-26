// ============================================================================
// FILE GENERATOR - Gerador de arquivos múltiplos (JSON, CSV, XLSX, PDF, HTML, MD)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FileRequest {
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'markdown' | 'zip';
  data: any;
  fileName?: string;
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

    const { format, data, fileName, userId, organizationId, conversationId }: FileRequest = await req.json()

    console.log('📄 Generating file:', format)

    // Gerar arquivo baseado no formato
    let fileContent: string
    let contentType: string
    let extension: string

    switch (format) {
      case 'json':
        fileContent = JSON.stringify(data, null, 2)
        contentType = 'application/json'
        extension = 'json'
        break

      case 'csv':
        fileContent = generateCSV(data)
        contentType = 'text/csv'
        extension = 'csv'
        break

      case 'xlsx':
        // XLSX em JSON (seria necessário biblioteca específica)
        fileContent = JSON.stringify(data, null, 2)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        extension = 'json' // Por enquanto JSON
        break

      case 'pdf':
        fileContent = generatePDF(data)
        contentType = 'application/pdf'
        extension = 'pdf'
        break

      case 'html':
        fileContent = generateHTML(data)
        contentType = 'text/html'
        extension = 'html'
        break

      case 'markdown':
        fileContent = generateMarkdown(data)
        contentType = 'text/markdown'
        extension = 'md'
        break

      case 'zip':
        // ZIP de múltiplos arquivos
        fileContent = await generateZIP(data)
        contentType = 'application/zip'
        extension = 'zip'
        break

      default:
        throw new Error(`Formato não suportado: ${format}`)
    }

    // Upload para Supabase Storage
    const finalFileName = fileName || `arquivo_${Date.now()}.${extension}`
    
    const { error: uploadError } = await supabaseClient.storage
      .from('temp-downloads')
      .upload(finalFileName, fileContent, {
        contentType
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Gerar URL assinada
    const { data: signedUrlData } = await supabaseClient.storage
      .from('temp-downloads')
      .createSignedUrl(finalFileName, 3600)

    console.log('✅ File generated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: `Arquivo ${format.toUpperCase()} gerado com sucesso!`,
        data: {
          fileName: finalFileName,
          downloadUrl: signedUrlData?.signedUrl,
          format,
          size: fileContent.length
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('❌ File generation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao gerar arquivo: ${error.message}`
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// ============================================================================
// FUNÇÕES DE GERAÇÃO
// ============================================================================

function generateCSV(data: any): string {
  if (!Array.isArray(data) || data.length === 0) {
    return 'Nome,Valor\nNenhum dado encontrado,0\n'
  }

  const headers = Object.keys(data[0])
  const rows = data.map(item => 
    headers.map(h => {
      const value = item[h]
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
  )

  return headers.join(',') + '\n' + rows.map(row => row.join(',')).join('\n')
}

function generatePDF(data: any): string {
  // PDF simples em HTML (seria necessário biblioteca específica)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; border-bottom: 2px solid #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #4CAF50; color: white; }
    tr:hover { background-color: #f5f5f5; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Relatório Gerado</h1>
  <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
  <pre>${JSON.stringify(data, null, 2)}</pre>
  <div class="footer">Documento gerado automaticamente</div>
</body>
</html>
  `
  
  // Em produção, usar biblioteca real de PDF
  return html
}

function generateHTML(data: any): string {
  const isArray = Array.isArray(data)
  const items = isArray ? data : [data]
  
  let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 20px; 
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
    }
    th, td { 
      padding: 12px; 
      text-align: left; 
      border-bottom: 1px solid #ddd;
    }
    th { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    tr:hover { background-color: #f9f9f9; }
    .footer { 
      margin-top: 40px; 
      text-align: center; 
      color: #999; 
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Relatório Gerado</h1>
    <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
    <p><strong>Total de itens:</strong> ${items.length}</p>
    
    <table>
      ${generateTableRows(items)}
    </table>
    
    <div class="footer">
      Documento gerado automaticamente pelo SyncAds
    </div>
  </div>
</body>
</html>
  `
  
  return html
}

function generateTableRows(items: any[]): string {
  if (items.length === 0) return '<tr><td colspan="3">Nenhum dado encontrado</td></tr>'
  
  const headers = Object.keys(items[0])
  
  let html = '<thead><tr>'
  headers.forEach(h => html += `<th>${h}</th>`)
  html += '</tr></thead><tbody>'
  
  items.forEach(item => {
    html += '<tr>'
    headers.forEach(h => {
      const value = item[h]
      html += `<td>${typeof value === 'object' ? JSON.stringify(value) : value}</td>`
    })
    html += '</tr>'
  })
  
  html += '</tbody>'
  return html
}

function generateMarkdown(data: any): string {
  const isArray = Array.isArray(data)
  const items = isArray ? data : [data]
  
  let md = '# Relatório Gerado\n\n'
  md += `**Data:** ${new Date().toLocaleString('pt-BR')}\n\n`
  md += `**Total de itens:** ${items.length}\n\n`
  
  if (items.length > 0) {
    md += '## Dados\n\n'
    md += '| ' + Object.keys(items[0]).join(' | ') + ' |\n'
    md += '| ' + Object.keys(items[0]).map(() => '---').join(' | ') + ' |\n'
    
    items.forEach(item => {
      md += '| ' + Object.values(item).map(v => 
        typeof v === 'object' ? JSON.stringify(v) : v
      ).join(' | ') + ' |\n'
    })
  }
  
  return md
}

async function generateZIP(data: any): Promise<string> {
  // ZIP simples (por enquanto, concatenar JSON)
  const timestamp = Date.now()
  const zipContent = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    files: Array.isArray(data) ? data : [data]
  }
  
  return JSON.stringify(zipContent, null, 2)
}
