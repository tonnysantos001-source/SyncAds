/**
 * ============================================
 * SYNCADS PYTHON MICROSERVICE - INTEGRATION
 * ============================================
 * Exemplos de integração com TypeScript/React
 * ============================================
 */

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const PYTHON_SERVICE_URL =
  process.env.VITE_PYTHON_SERVICE_URL || "http://localhost:8000";

// ==========================================
// HELPER FUNCTION
// ==========================================

async function callPythonService<T>(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  data?: any,
): Promise<T> {
  const response = await fetch(`${PYTHON_SERVICE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao chamar serviço Python");
  }

  return response.json();
}

// ==========================================
// 1. SCRAPING
// ==========================================

interface ScrapeResult {
  success: boolean;
  url: string;
  data?: any;
  html?: string;
  text?: string;
  images?: string[];
  links?: string[];
  products?: Array<{
    name?: string;
    price?: string;
    image?: string;
    link?: string;
  }>;
  screenshot?: string;
  method: string;
  execution_time: number;
  error?: string;
}

/**
 * Faz scraping de um website
 */
export async function scrapeWebsite(
  url: string,
  options?: {
    javascript?: boolean;
    extractImages?: boolean;
    extractLinks?: boolean;
    screenshot?: boolean;
  },
): Promise<ScrapeResult> {
  return callPythonService<ScrapeResult>("/api/scraping/scrape", "POST", {
    url,
    javascript: options?.javascript || false,
    extract_images: options?.extractImages || false,
    extract_links: options?.extractLinks || false,
    screenshot: options?.screenshot || false,
    approach: "auto",
  });
}

/**
 * Scraping de produtos e-commerce
 */
export async function scrapeProducts(url: string, maxProducts: number = 100) {
  return callPythonService("/api/scraping/scrape-products", "POST", {
    url,
    max_products: maxProducts,
  });
}

/**
 * Exemplo de uso no chat:
 *
 * const result = await scrapeWebsite('https://example.com/produtos');
 * if (result.success) {
 *   console.log('Produtos encontrados:', result.products);
 * }
 */

// ==========================================
// 2. GERAÇÃO DE PDF
// ==========================================

interface PDFResult {
  success: boolean;
  pdf_base64?: string;
  filename: string;
  size_bytes?: number;
  pages?: number;
  error?: string;
}

/**
 * Gera PDF a partir de texto
 */
export async function generatePDF(
  title: string,
  content: string,
  options?: {
    author?: string;
    includeHeader?: boolean;
    includeFooter?: boolean;
  },
): Promise<PDFResult> {
  return callPythonService<PDFResult>("/api/pdf/generate", "POST", {
    title,
    content,
    author: options?.author,
    include_header: options?.includeHeader ?? true,
    include_footer: options?.includeFooter ?? true,
  });
}

/**
 * Converte HTML para PDF
 */
export async function htmlToPDF(
  html: string,
  css?: string,
): Promise<PDFResult> {
  return callPythonService<PDFResult>("/api/pdf/from-html", "POST", {
    html,
    css,
    page_size: "A4",
  });
}

/**
 * Gera relatório PDF de campanha
 */
export async function generateCampaignReport(campaignData: {
  title: string;
  data: Record<string, any>;
  tables?: Array<{ title: string; data: any[][] }>;
}): Promise<PDFResult> {
  return callPythonService<PDFResult>("/api/pdf/report", "POST", campaignData);
}

/**
 * Exemplo de uso:
 *
 * const pdf = await generateCampaignReport({
 *   title: 'Relatório de Campanha - Janeiro 2025',
 *   data: {
 *     'Total de Cliques': '5.432',
 *     'Conversões': '234',
 *     'ROI': 'R$ 12.450,00',
 *   },
 *   tables: [{
 *     title: 'Top 5 Anúncios',
 *     data: [
 *       ['Anúncio', 'Cliques', 'CTR'],
 *       ['Anúncio A', '1.234', '2.5%'],
 *       ['Anúncio B', '987', '2.1%'],
 *     ]
 *   }]
 * });
 *
 * // Download do PDF
 * const blob = base64ToBlob(pdf.pdf_base64!, 'application/pdf');
 * downloadBlob(blob, pdf.filename);
 */

// ==========================================
// 3. PROCESSAMENTO DE IMAGENS
// ==========================================

interface ImageResult {
  success: boolean;
  image_base64?: string;
  width?: number;
  height?: number;
  format?: string;
  size_bytes?: number;
  original_size_bytes?: number;
  compression_ratio?: number;
  error?: string;
}

/**
 * Redimensiona imagem
 */
export async function resizeImage(
  imageBase64: string,
  width?: number,
  height?: number,
  maintainAspect: boolean = true,
): Promise<ImageResult> {
  return callPythonService<ImageResult>("/api/images/resize", "POST", {
    image_base64: imageBase64,
    width,
    height,
    maintain_aspect: maintainAspect,
    quality: 85,
  });
}

/**
 * Otimiza imagem para web
 */
export async function optimizeImage(imageBase64: string): Promise<ImageResult> {
  return callPythonService<ImageResult>("/api/images/optimize", "POST", {
    image_base64: imageBase64,
    max_width: 1920,
    max_height: 1080,
    quality: 85,
    format: "JPEG",
  });
}

/**
 * Aplica filtro em imagem
 */
export async function applyImageFilter(
  imageBase64: string,
  filterType:
    | "blur"
    | "sharpen"
    | "grayscale"
    | "sepia"
    | "vintage"
    | "contrast"
    | "brightness",
  intensity: number = 1.0,
): Promise<ImageResult> {
  return callPythonService<ImageResult>("/api/images/filter", "POST", {
    image_base64: imageBase64,
    filter_type: filterType,
    intensity,
  });
}

/**
 * Remove background da imagem
 */
export async function removeBackground(
  imageBase64: string,
): Promise<ImageResult> {
  return callPythonService<ImageResult>(
    "/api/images/remove-background",
    "POST",
    {
      image_base64: imageBase64,
    },
  );
}

/**
 * Adiciona marca d'água
 */
export async function addWatermark(
  imageBase64: string,
  text: string,
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center" = "bottom-right",
  opacity: number = 0.5,
): Promise<ImageResult> {
  return callPythonService<ImageResult>("/api/images/watermark", "POST", {
    image_base64: imageBase64,
    text,
    position,
    opacity,
  });
}

/**
 * Exemplo de uso:
 *
 * // Usuário faz upload de imagem
 * const file = event.target.files[0];
 * const base64 = await fileToBase64(file);
 *
 * // Otimizar para web
 * const optimized = await optimizeImage(base64);
 * console.log('Redução:', optimized.compression_ratio);
 *
 * // Aplicar filtro vintage
 * const filtered = await applyImageFilter(optimized.image_base64!, 'vintage');
 *
 * // Adicionar watermark
 * const final = await addWatermark(filtered.image_base64!, 'SyncAds © 2025');
 *
 * // Exibir resultado
 * setProcessedImage(final.image_base64);
 */

// ==========================================
// 4. MACHINE LEARNING (Quando implementado)
// ==========================================

/**
 * Predição de ROI de campanha
 */
export async function predictROI(campaignData: {
  budget: number;
  platform: string;
  targetAudience: string;
  adType: string;
}): Promise<{ predicted_roi: number; confidence: number }> {
  return callPythonService("/api/ml/predict-roi", "POST", campaignData);
}

/**
 * Análise de sentimento de texto
 */
export async function analyzeSentiment(text: string): Promise<{
  sentiment: "positive" | "negative" | "neutral";
  score: number;
}> {
  return callPythonService("/api/nlp/sentiment", "POST", { text });
}

// ==========================================
// 5. ANÁLISE DE DADOS (Quando implementado)
// ==========================================

/**
 * Análise estatística de dados
 */
export async function analyzeData(data: any[]): Promise<{
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
}> {
  return callPythonService("/api/data/analyze", "POST", { data });
}

// ==========================================
// 6. EXECUÇÃO DE CÓDIGO PYTHON (Quando implementado)
// ==========================================

/**
 * Executa código Python customizado
 */
export async function executePython(
  code: string,
  packages?: string[],
): Promise<{ result: any; output: string; error?: string }> {
  return callPythonService("/api/python/execute", "POST", {
    code,
    packages: packages || [],
  });
}

// ==========================================
// UTILITIES
// ==========================================

/**
 * Converte File para base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo "data:image/xxx;base64,"
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Converte base64 para Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeType });
}

/**
 * Download de blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// INTEGRAÇÃO COM CHAT IA
// ==========================================

/**
 * Adicionar aos handlers do chat
 *
 * Em: src/lib/ai/chatHandlers.ts
 */

// Exemplo de handler para usar o microserviço Python:

/*

import { scrapeWebsite, generatePDF, optimizeImage } from './pythonService';

async function handlePythonScraping(
  context: ChatContext,
  params: Record<string, any>,
  onProgress?: (status: string, progress?: number) => void,
): Promise<ChatHandlerResult> {
  try {
    const url = params.url || context.userMessage;

    if (onProgress) {
      onProgress('🕷️ Fazendo scraping...', 30);
    }

    // Chamar microserviço Python
    const result = await scrapeWebsite(url, {
      javascript: true,
      extractImages: true,
    });

    if (!result.success) {
      return {
        success: false,
        content: `Falhou ao fazer scraping: ${result.error}`,
        error: result.error,
      };
    }

    if (onProgress) {
      onProgress('✅ Scraping concluído!', 100);
    }

    return {
      success: true,
      content: `✅ Scraping concluído!\n\n**URL:** ${result.url}\n**Método:** ${result.method}\n**Tempo:** ${result.execution_time.toFixed(2)}s\n\n**Dados extraídos:**\n${result.text?.substring(0, 500)}...`,
      attachments: result.images?.map(img => ({
        type: 'image',
        url: img,
        title: 'Imagem extraída',
      })),
      metadata: {
        type: 'scraping',
        url: result.url,
        method: result.method,
      },
    };
  } catch (error: any) {
    console.error('❌ Erro no scraping Python:', error);
    return {
      success: false,
      content: `Erro: ${error.message}`,
      error: error.message,
    };
  }
}

*/

// ==========================================
// HEALTH CHECK
// ==========================================

/**
 * Verifica se o microserviço está online
 */
export async function checkPythonServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Exemplo de uso no componente:
 *
 * useEffect(() => {
 *   const checkService = async () => {
 *     const isOnline = await checkPythonServiceHealth();
 *     if (!isOnline) {
 *       console.warn('⚠️ Microserviço Python offline');
 *     }
 *   };
 *   checkService();
 * }, []);
 */
