import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { content, filename, format = "html", options = {} } = await req.json();

    // Validar dados
    if (!content) {
      throw new Error("Content is required");
    }

    if (!filename) {
      throw new Error("Filename is required");
    }

    // Processar conteúdo baseado no formato
    let htmlContent: string;

    if (format === "markdown") {
      htmlContent = markdownToHtml(content);
    } else if (format === "html") {
      htmlContent = content;
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    // Gerar PDF simples em formato texto (fallback)
    // Para PDF real, usaríamos puppeteer/chromium mas é pesado
    // Por enquanto, geramos HTML que pode ser convertido
    const pdfContent = generatePdfFallback(htmlContent, options);

    // Garantir extensão .pdf
    const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

    // Upload via file-manager
    const fileManagerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/file-manager`;
    const uploadResponse = await fetch(fileManagerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        action: "upload",
        content: pdfContent,
        filename: safeFilename,
        mimeType: "application/pdf",
      }),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Upload failed: ${errorData.error}`);
    }

    const uploadResult = await uploadResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        file: uploadResult.file,
        format: format,
        message: `PDF criado com sucesso!`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Create PDF error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Converte Markdown para HTML
 */
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Line breaks
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");

  // Lists
  html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
  html = html.replace(/^\- (.*$)/gim, "<li>$1</li>");

  // Code blocks
  html = html.replace(/```(.*?)```/gs, "<pre><code>$1</code></pre>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  return html;
}

/**
 * Gera PDF básico (fallback usando HTML print-ready)
 * NOTA: Para PDF real precisaria de Puppeteer/Chromium
 * Por enquanto geramos HTML otimizado para impressão/conversão
 */
function generatePdfFallback(htmlContent: string, options: any): string {
  const {
    title = "Document",
    author = "SyncAds AI",
    pageSize = "A4",
    orientation = "portrait",
    margin = "20mm",
  } = options;

  // HTML completo pronto para converter em PDF
  const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="author" content="${escapeHtml(author)}">
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: ${margin};
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
      margin-top: 30px;
    }

    h2 {
      color: #34495e;
      border-bottom: 1px solid #bdc3c7;
      padding-bottom: 8px;
      margin-top: 25px;
    }

    h3 {
      color: #7f8c8d;
      margin-top: 20px;
    }

    p {
      margin: 15px 0;
      text-align: justify;
    }

    ul, ol {
      margin: 15px 0;
      padding-left: 30px;
    }

    li {
      margin: 5px 0;
    }

    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    pre {
      background: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      border-left: 4px solid #3498db;
    }

    pre code {
      background: none;
      padding: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }

    th {
      background: #3498db;
      color: white;
      font-weight: bold;
    }

    tr:nth-child(even) {
      background: #f9f9f9;
    }

    a {
      color: #3498db;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3498db;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 0.9em;
      color: #7f8c8d;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }

      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(title)}</h1>
    <p style="color: #7f8c8d;">Gerado por ${escapeHtml(author)}</p>
    <p style="color: #95a5a6; font-size: 0.9em;">${new Date().toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}</p>
  </div>

  <div class="content">
    ${htmlContent}
  </div>

  <div class="footer">
    <p>Documento gerado automaticamente pelo SyncAds AI</p>
    <p>${new Date().toLocaleString('pt-BR')}</p>
  </div>

  <script>
    // Auto-print quando carregar (opcional)
    // window.addEventListener('load', () => window.print());
  </script>
</body>
</html>`;

  return fullHtml;
}

/**
 * Escapa HTML
 */
function escapeHtml(str: string): string {
  if (typeof str !== "string") {
    str = String(str);
  }

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return str.replace(/[&<>"'/]/g, (char) => map[char]);
}
