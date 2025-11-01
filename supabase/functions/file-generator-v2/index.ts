// ============================================================================
// FILE GENERATOR V2 - Gerador de arquivos com XLSX, ZIP reais
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.18.5/package/xlsx.mjs'
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FileRequest {
  // Formato novo (simplificado)
  fileName?: string;
  content?: string;
  fileType?: 'csv' | 'json' | 'txt' | 'text';

  // Formato antigo (compatibilidade)
  format?: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'markdown' | 'zip';
  data?: any;

  userId?: string;
  conversationId?: string;
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

    const body: FileRequest = await req.json()

    console.log('📄 Generating file:', body.fileType || body.format)

    // Gerar arquivo baseado no formato
    let fileContent: string | ArrayBuffer
    let contentType: string
    let extension: string
    let finalFileName: string

    // FORMATO NOVO (simplificado - preferencial)
    if (body.content !== undefined && body.fileType) {
      const fileType = body.fileType === 'text' ? 'txt' : body.fileType

      switch (fileType) {
        case 'csv':
          fileContent = body.content
          contentType = 'text/csv'
          extension = 'csv'
          break

        case 'json':
          fileContent = body.content
          contentType = 'application/json'
          extension = 'json'
          break

        case 'txt':
          fileContent = body.content
          contentType = 'text/plain'
          extension = 'txt'
          break

        default:
          throw new Error(`Tipo de arquivo não suportado: ${fileType}`)
      }

      finalFileName = body.fileName || `arquivo_${Date.now()}.${extension}`
    }
    // FORMATO ANTIGO (compatibilidade)
    else if (body.format && body.data !== undefined) {
      switch (body.format) {
        case 'json':
          fileContent = JSON.stringify(body.data, null, 2)
          contentType = 'application/json'
          extension = 'json'
          break

        case 'csv':
          fileContent = generateCSV(body.data)
          contentType = 'text/csv'
          extension = 'csv'
          break

        case 'xlsx':
          fileContent = await generateXLSX(body.data)
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          extension = 'xlsx'
          break

        case 'pdf':
          fileContent = generatePDF(body.data)
          contentType = 'text/html'
          extension = 'html'
          break

        case 'html':
          fileContent = generateHTML(body.data)
          contentType = 'text/html'
          extension = 'html'
          break

        case 'markdown':
          fileContent = generateMarkdown(body.data)
          contentType = 'text/markdown'
          extension = 'md'
          break

        case 'zip':
          fileContent = await generateZIPReal(body.data)
          contentType = 'application/zip'
          extension = 'zip'
          break

        default:
          throw new Error(`Formato não suportado: ${body.format}`)
      }

      finalFileName = body.fileName || `arquivo_${Date.now()}.${extension}`
    } else {
      throw new Error('Formato inválido. Use: { fileName, content, fileType } ou { format, data }')
    }
</text>

<old_text line=100>
    // Upload para Supabase Storage
    const finalFileName = fileName || `arquivo_${Date.now()}.${extension}`

    // Converter ArrayBuffer para Uint8Array se necessário

    // Upload para Supabase Storage
    const finalFileName = fileName || `arquivo_${Date.now()}.${extension}`

    // Converter ArrayBuffer para Uint8Array se necessário
    let uploadContent: string | Uint8Array

    if (fileContent instanceof ArrayBuffer) {
      uploadContent = new Uint8Array(fileContent)
    } else {
      uploadContent = fileContent as string
    }

    // Upload para storage com path único por usuário
    const uploadPath = user.id ? `${user.id}/${finalFileName}` : finalFileName

    const { error: uploadError } = await supabaseClient.storage
      .from('temp-downloads')
      .upload(uploadPath, uploadContent, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Gerar URL assinada (expira em 1 hora)
    const { data: signedUrlData, error: urlError } = await supabaseClient.storage
      .from('temp-downloads')
      .createSignedUrl(uploadPath, 3600)

    if (urlError || !signedUrlData?.signedUrl) {
      throw new Error('Failed to generate download URL')
    }

    console.log('✅ File generated successfully:', signedUrlData.signedUrl)

    const responseFormat = body.fileType || body.format || extension

    return new Response(
      JSON.stringify({
        success: true,
        message: `Arquivo ${responseFormat.toUpperCase()} gerado com sucesso!`,
        fileName: finalFileName,
        downloadUrl: signedUrlData.signedUrl,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        size: fileContent instanceof ArrayBuffer ? fileContent.byteLength : fileContent.length,
        format: responseFormat
      }),
</text>

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
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    tr:hover { background-color: #f9f9f9; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Relatório Gerado</h1>
    <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
    <p><strong>Total de itens:</strong> ${items.length}</p>
    <table>${generateTableRows(items)}</table>
    <div class="footer">Documento gerado automaticamente pelo SyncAds</div>
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

async function generateXLSX(data: any): Promise<ArrayBuffer> {
  const wb = XLSX.utils.book_new()

  if (Array.isArray(data) && data.length > 0) {
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'Dados')
  } else if (typeof data === 'object') {
    for (const [sheetName, sheetData] of Object.entries(data)) {
      if (Array.isArray(sheetData)) {
        const ws = XLSX.utils.json_to_sheet(sheetData)
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }
    }
  }

  const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return xlsxBuffer
}

async function generateZIPReal(data: any): Promise<ArrayBuffer> {
  const zip = new JSZip()

  if (typeof data === 'object' && data.files) {
    for (const [filename, content] of Object.entries(data.files)) {
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      zip.file(filename, contentStr)
    }
  } else {
    const content = JSON.stringify(data, null, 2)
    zip.file('data.json', content)
  }

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })
  return zipBuffer as ArrayBuffer
}
