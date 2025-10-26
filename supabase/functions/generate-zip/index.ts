import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZipFileRequest {
  files: Array<{
    name: string;
    content: string;
    type: 'text' | 'json' | 'csv' | 'base64';
  }>;
  zipName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { files, zipName = 'download.zip' }: ZipFileRequest = await req.json()

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Criar arquivo ZIP usando JSZip
    const JSZip = (await import('https://cdn.skypack.dev/jszip@3.10.1')).default
    const zip = new JSZip()

    // Adicionar arquivos ao ZIP
    for (const file of files) {
      let fileContent: string | Uint8Array

      switch (file.type) {
        case 'base64':
          // Converter base64 para Uint8Array
          const binaryString = atob(file.content)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          fileContent = bytes
          break
        case 'json':
          fileContent = JSON.stringify(JSON.parse(file.content), null, 2)
          break
        case 'csv':
        case 'text':
        default:
          fileContent = file.content
          break
      }

      zip.file(file.name, fileContent)
    }

    // Gerar ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const zipArrayBuffer = await zipBlob.arrayBuffer()
    const zipBase64 = btoa(String.fromCharCode(...new Uint8Array(zipArrayBuffer)))

    // Salvar no storage temporário
    const fileName = `${Date.now()}-${zipName}`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('temp-downloads')
      .upload(fileName, zipBlob, {
        contentType: 'application/zip',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to save zip file' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Gerar URL pública
    const { data: { publicUrl } } = supabaseClient.storage
      .from('temp-downloads')
      .getPublicUrl(fileName)

    // Agendar limpeza do arquivo (1 hora)
    setTimeout(async () => {
      try {
        await supabaseClient.storage
          .from('temp-downloads')
          .remove([fileName])
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    }, 3600000) // 1 hora

    return new Response(
      JSON.stringify({ 
        success: true,
        downloadUrl: publicUrl,
        fileName: zipName,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error generating zip:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
