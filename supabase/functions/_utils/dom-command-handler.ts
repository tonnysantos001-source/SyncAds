// ============================================================================
// DOM COMMAND HANDLER - Detecta e Executa Comandos DOM Reais
// ============================================================================
// Identifica quando usuário pede para abrir sites/executar ações
// Envia comandos reais para a extensão do Chrome
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// TIPOS
// ============================================================================

export interface DOMCommand {
  type: "NAVIGATE" | "CLICK" | "FILL_FORM" | "SCREENSHOT" | "EXECUTE_JS";
  params: {
    url?: string;
    selector?: string;
    value?: any;
    code?: string;
  };
  description: string;
}

export interface CommandDetectionResult {
  shouldExecute: boolean;
  command?: DOMCommand;
  confirmationMessage?: string;
}

// ============================================================================
// PADRÕES DE DETECÇÃO
// ============================================================================

const NAVIGATION_PATTERNS = [
  // Abrir sites
  { regex: /abr(?:a|e|ir)\s+(?:o\s+)?site\s+(?:do|da)?\s*(\w+)/i, action: "open_site" },
  { regex: /(?:vá|va|ir)\s+para\s+(?:o\s+)?(\w+)/i, action: "open_site" },
  { regex: /(?:acesse|acessar)\s+(?:o\s+)?(\w+)/i, action: "open_site" },
  { regex: /navegue?\s+para\s+(\w+)/i, action: "open_site" },

  // URLs diretas
  { regex: /(https?:\/\/[^\s]+)/i, action: "open_url" },
  { regex: /(?:abrir|acessar)\s+(www\.[^\s]+)/i, action: "open_url" },

  // Sites conhecidos
  { regex: /(?:facebook|fb)(?:\s|$)/i, action: "open_facebook" },
  { regex: /(?:instagram|insta|ig)(?:\s|$)/i, action: "open_instagram" },
  { regex: /(?:youtube|yt)(?:\s|$)/i, action: "open_youtube" },
  { regex: /(?:google|googlar)(?:\s|$)/i, action: "open_google" },
  { regex: /(?:twitter|x\.com)(?:\s|$)/i, action: "open_twitter" },
  { regex: /(?:linkedin)(?:\s|$)/i, action: "open_linkedin" },
  { regex: /(?:whatsapp|wpp)(?:\s|$)/i, action: "open_whatsapp" },
  { regex: /(?:gmail)(?:\s|$)/i, action: "open_gmail" },
  { regex: /(?:shopify)(?:\s|$)/i, action: "open_shopify" },
  { regex: /(?:mercado\s*livre|ml)(?:\s|$)/i, action: "open_mercadolivre" },
];

const SITE_URLS: Record<string, string> = {
  facebook: "https://www.facebook.com",
  instagram: "https://www.instagram.com",
  youtube: "https://www.youtube.com",
  google: "https://www.google.com",
  twitter: "https://twitter.com",
  linkedin: "https://www.linkedin.com",
  whatsapp: "https://web.whatsapp.com",
  gmail: "https://mail.google.com",
  shopify: "https://www.shopify.com",
  mercadolivre: "https://www.mercadolivre.com.br",
};

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Detecta se a mensagem do usuário contém um comando DOM
 */
export function detectDOMCommand(message: string): CommandDetectionResult {
  const lowerMessage = message.toLowerCase().trim();

  // Verificar padrões de navegação
  for (const pattern of NAVIGATION_PATTERNS) {
    const match = lowerMessage.match(pattern.regex);
    if (match) {
      return handleNavigationPattern(pattern.action, match, message);
    }
  }

  return { shouldExecute: false };
}

/**
 * Processa padrão de navegação detectado
 */
function handleNavigationPattern(
  action: string,
  match: RegExpMatchArray,
  originalMessage: string
): CommandDetectionResult {
  switch (action) {
    case "open_site":
      const siteName = match[1]?.toLowerCase();
      return {
        shouldExecute: true,
        command: {
          type: "NAVIGATE",
          params: { url: guessSiteUrl(siteName) },
          description: `Abrindo ${siteName}...`,
        },
        confirmationMessage: `🌐 Abrindo ${siteName} para você...`,
      };

    case "open_url":
      let url = match[1];
      if (!url.startsWith("http")) {
        url = "https://" + url;
      }
      return {
        shouldExecute: true,
        command: {
          type: "NAVIGATE",
          params: { url },
          description: `Navegando para ${url}...`,
        },
        confirmationMessage: `🌐 Abrindo ${url}...`,
      };

    case "open_facebook":
      return createNavigationCommand("Facebook", SITE_URLS.facebook);

    case "open_instagram":
      return createNavigationCommand("Instagram", SITE_URLS.instagram);

    case "open_youtube":
      return createNavigationCommand("YouTube", SITE_URLS.youtube);

    case "open_google":
      return createNavigationCommand("Google", SITE_URLS.google);

    case "open_twitter":
      return createNavigationCommand("Twitter", SITE_URLS.twitter);

    case "open_linkedin":
      return createNavigationCommand("LinkedIn", SITE_URLS.linkedin);

    case "open_whatsapp":
      return createNavigationCommand("WhatsApp Web", SITE_URLS.whatsapp);

    case "open_gmail":
      return createNavigationCommand("Gmail", SITE_URLS.gmail);

    case "open_shopify":
      return createNavigationCommand("Shopify", SITE_URLS.shopify);

    case "open_mercadolivre":
      return createNavigationCommand("Mercado Livre", SITE_URLS.mercadolivre);

    default:
      return { shouldExecute: false };
  }
}

/**
 * Cria comando de navegação
 */
function createNavigationCommand(name: string, url: string): CommandDetectionResult {
  return {
    shouldExecute: true,
    command: {
      type: "NAVIGATE",
      params: { url },
      description: `Abrindo ${name}...`,
    },
    confirmationMessage: `🌐 Abrindo ${name} para você...`,
  };
}

/**
 * Tenta adivinhar URL do site baseado no nome
 */
function guessSiteUrl(siteName: string): string {
  // Verificar mapeamento direto
  if (SITE_URLS[siteName]) {
    return SITE_URLS[siteName];
  }

  // Tentar variações comuns
  const normalized = siteName.toLowerCase().replace(/\s+/g, "");

  // Verificar se é um domínio conhecido
  for (const [key, url] of Object.entries(SITE_URLS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return url;
    }
  }

  // Fallback: adicionar .com
  return `https://www.${normalized}.com`;
}

// ============================================================================
// EXECUÇÃO DE COMANDOS
// ============================================================================

/**
 * Envia comando para dispositivo da extensão
 */
export async function sendCommandToExtension(
  supabase: any,
  userId: string,
  command: DOMCommand
): Promise<{ success: boolean; deviceId?: string; error?: string }> {
  try {
    // Buscar dispositivo online do usuário
    const { data: devices, error: devicesError } = await supabase
      .from("extension_devices")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "online")
      .order("last_seen", { ascending: false })
      .limit(1);

    if (devicesError) {
      console.error("Erro ao buscar dispositivos:", devicesError);
      return { success: false, error: "Erro ao buscar dispositivos" };
    }

    if (!devices || devices.length === 0) {
      console.warn("Nenhum dispositivo online encontrado");
      return {
        success: false,
        error: "Extensão offline. Por favor, abra a extensão do navegador.",
      };
    }

    const device = devices[0];

    // Criar comando na tabela
    const { data: createdCommand, error: commandError } = await supabase
      .from("extension_commands")
      .insert({
        device_id: device.device_id,
        user_id: userId,
        command_type: command.type,
        params: command.params,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (commandError) {
      console.error("Erro ao criar comando:", commandError);
      return { success: false, error: "Erro ao criar comando" };
    }

    console.log("✅ Comando enviado:", {
      commandId: createdCommand.id,
      deviceId: device.device_id,
      type: command.type,
      params: command.params,
    });

    return {
      success: true,
      deviceId: device.device_id,
    };
  } catch (error: any) {
    console.error("❌ Erro ao enviar comando:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Verifica status do comando
 */
export async function checkCommandStatus(
  supabase: any,
  commandId: string,
  timeoutMs: number = 5000
): Promise<{ success: boolean; result?: any; error?: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const { data: command, error } = await supabase
      .from("extension_commands")
      .select("*")
      .eq("id", commandId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (command.status === "completed") {
      return { success: true, result: command.result };
    }

    if (command.status === "failed") {
      return { success: false, error: command.error || "Comando falhou" };
    }

    // Aguardar 500ms antes de verificar novamente
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return { success: false, error: "Timeout ao executar comando" };
}

/**
 * Wrapper completo: detecta, envia e aguarda execução
 */
export async function executeIfDOMCommand(
  supabase: any,
  userId: string,
  message: string
): Promise<{
  executed: boolean;
  response?: string;
  error?: string;
}> {
  // Detectar comando
  const detection = detectDOMCommand(message);

  if (!detection.shouldExecute || !detection.command) {
    return { executed: false };
  }

  console.log("🎯 Comando DOM detectado:", detection.command);

  // Enviar comando
  const sendResult = await sendCommandToExtension(
    supabase,
    userId,
    detection.command
  );

  if (!sendResult.success) {
    return {
      executed: true,
      error: sendResult.error,
      response: `❌ ${sendResult.error}`,
    };
  }

  // Retornar confirmação imediata
  return {
    executed: true,
    response:
      detection.confirmationMessage ||
      `✅ ${detection.command.description}`,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  detectDOMCommand,
  sendCommandToExtension,
  checkCommandStatus,
  executeIfDOMCommand,
};
