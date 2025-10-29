// ============================================
// PYTHON EXECUTOR - Pyodide Runtime
// ============================================
// Executa código Python no browser usando Pyodide
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_utils/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, packages = [], timeout = 30000 } = await req.json();

    if (!code) {
      throw new Error('Código Python é obrigatório');
    }

    console.log('🐍 Executando Python code...');
    console.log('📦 Packages:', packages);

    // Criar HTML com Pyodide
    const html = generatePyodideHTML(code, packages);

    // Em produção, você pode usar Puppeteer aqui
    // Por enquanto, retornar instruções de uso

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Código Python preparado para execução',
        code,
        packages,
        instructions: 'Use Pyodide no frontend para executar este código',
        pyodideHTML: html,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Erro:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generatePyodideHTML(code: string, packages: string[]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"></script>
</head>
<body>
  <div id="output"></div>
  <script>
    async function runPython() {
      try {
        const pyodide = await loadPyodide();
        
        // Carregar packages
        ${packages.length > 0 ? `await pyodide.loadPackage(${JSON.stringify(packages)});` : ''}
        
        // Executar código
        const result = await pyodide.runPythonAsync(\`
${code}
        \`);
        
        document.getElementById('output').innerHTML = '<pre>' + result + '</pre>';
        
        // Enviar resultado de volta
        if (window.parent) {
          window.parent.postMessage({ success: true, result: String(result) }, '*');
        }
      } catch (error) {
        document.getElementById('output').innerHTML = '<pre style="color: red;">' + error + '</pre>';
        if (window.parent) {
          window.parent.postMessage({ success: false, error: String(error) }, '*');
        }
      }
    }
    
    runPython();
  </script>
</body>
</html>
  `;
}

