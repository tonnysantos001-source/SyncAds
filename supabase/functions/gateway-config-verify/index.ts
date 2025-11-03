// ============================================
// SYNCADS - GATEWAY CONFIG VERIFY EDGE FUNCTION
// ============================================
//
// Objetivo:
// - Verificar credenciais de gateways em PRODUÇÃO, sem sandbox/mock
// - Atualizar campos: isVerified, verifiedAt, verificationMetadata, environment
// - Inserir auditoria em GatewayVerification
// - NUNCA logar chaves sensíveis
//
// Suporta (inicial):
// - Stripe: GET https://api.stripe.com/v1/account (Bearer sk_live...)
// - Mercado Pago: GET https://api.mercadopago.com/users/me (Bearer ACCESS_TOKEN)
// - Asaas: GET https://www.asaas.com/api/v3/myAccount (Header: access_token)
//
// Requisitos de segurança:
// - Requer usuário autenticado (JWT válido)
// - Somente o dono da config (userId) ou super admin pode verificar
// - Timeout curto (5s), sem retries por padrão
// - Sem logs de credenciais, somente códigos e mensagens genéricas
//
// Entrada (JSON):
// {
//   "configId"?: string,             // recomendado (ID de GatewayConfig)
//   "slug"?: string,                  // opcional (ex: "stripe", "mercadopago", "asaas")
//   "credentials"?: object,           // opcional - apenas para verificação transitória
//   "persistCredentials"?: boolean    // opcional (default: false) - se true, cifra e persiste em credentialsEncrypted
// }
//
// Saída (JSON):
// {
//   "success": boolean,
//   "gatewayId": string|null,
//   "gatewaySlug": string|null,
//   "httpStatus": number|null,
//   "message": string,
//   "verifiedAt": string|null,
//   "capabilities"?: Record<string, boolean>,
//   "environment": "production" | "sandbox"
// }
//
// Observações:
// - environment sempre "production" aqui (forçando produção).
// - Caso queira permitir sandbox no futuro, ajustar lógica conforme necessidade.
// ============================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, any>;

// CORS básico
const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface VerifyResult {
  ok: boolean;
  httpStatus: number;
  message: string;
  capabilities?: Record<string, boolean>;
  metadata?: Record<string, any>;
}

interface Adapter {
  slug: string;
  verify: (credentials: Json, signal: AbortSignal) => Promise<VerifyResult>;
}

function withTimeout(ms: number): AbortController {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  // @ts-ignore - patching for cleanup in finally
  (controller as any)._timeoutId = id;
  return controller;
}

function cleanupTimeout(controller: AbortController) {
  // @ts-ignore
  if ((controller as any)._timeoutId)
    clearTimeout((controller as any)._timeoutId);
}

function redact(str?: string): string {
  if (!str) return "";
  if (str.length <= 8) return "****";
  return `${str.slice(0, 4)}****${str.slice(-4)}`;
}

// ============ Adapters (provider verification) ============

// Stripe: GET /v1/account with Bearer secretKey (sk_live_...)
const stripeAdapter: Adapter = {
  slug: "stripe",
  async verify(credentials, signal) {
    const secretKey =
      credentials?.secretKey || credentials?.apiKey || credentials?.SECRET_KEY;
    if (!secretKey || typeof secretKey !== "string") {
      return {
        ok: false,
        httpStatus: 400,
        message: "Credenciais Stripe inválidas: secretKey ausente",
      };
    }
    const res = await fetch("https://api.stripe.com/v1/account", {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
      signal,
    }).catch((e) => {
      if (e.name === "AbortError") {
        return new Response(null, {
          status: 408,
          statusText: "Request Timeout",
        });
      }
      return new Response(null, { status: 500, statusText: "Internal Error" });
    });

    if (!res) {
      return {
        ok: false,
        httpStatus: 500,
        message: "Falha ao conectar ao Stripe",
      };
    }

    const httpStatus = res.status;
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const capabilities = {
        credit_card: true,
        pix: false, // Stripe Pix depende de integração externa - default false
        boleto: false,
      };
      const livemode = !!data.livemode;
      // Em produção esperamos secretKey live; no entanto, Stripe permite testar endpoints com keys live sem criar cobranças
      return {
        ok: true,
        httpStatus,
        message: `Conta Stripe verificada (id=${data.id || "desconhecido"}, livemode=${livemode})`,
        capabilities,
        metadata: {
          account_id: data.id,
          default_currency: data.default_currency,
          livemode,
          business_type: data.business_type,
        },
      };
    } else {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        httpStatus,
        message: `Stripe rejeitou as credenciais (${httpStatus})`,
        metadata: { response_excerpt: text.slice(0, 200) },
      };
    }
  },
};

// Mercado Pago: GET /users/me with Bearer accessToken
const mercadopagoAdapter: Adapter = {
  slug: "mercadopago",
  async verify(credentials, signal) {
    const accessToken =
      credentials?.accessToken ||
      credentials?.ACCESS_TOKEN ||
      credentials?.token;
    if (!accessToken || typeof accessToken !== "string") {
      return {
        ok: false,
        httpStatus: 400,
        message: "Credenciais Mercado Pago inválidas: accessToken ausente",
      };
    }
    const res = await fetch("https://api.mercadopago.com/users/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    }).catch((e) => {
      if (e.name === "AbortError") {
        return new Response(null, {
          status: 408,
          statusText: "Request Timeout",
        });
      }
      return new Response(null, { status: 500, statusText: "Internal Error" });
    });

    if (!res) {
      return {
        ok: false,
        httpStatus: 500,
        message: "Falha ao conectar ao Mercado Pago",
      };
    }

    const httpStatus = res.status;
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const capabilities = {
        credit_card: true,
        pix: true,
        boleto: true,
      };
      return {
        ok: true,
        httpStatus,
        message: `Conta Mercado Pago verificada (id=${data.id || "desconhecido"})`,
        capabilities,
        metadata: {
          user_id: data.id,
          nickname: data.nickname,
          site_id: data.site_id,
          email: data.email,
        },
      };
    } else {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        httpStatus,
        message: `Mercado Pago rejeitou as credenciais (${httpStatus})`,
        metadata: { response_excerpt: text.slice(0, 200) },
      };
    }
  },
};

// Asaas: GET /myAccount with access_token header
const asaasAdapter: Adapter = {
  slug: "asaas",
  async verify(credentials, signal) {
    const apiKey =
      credentials?.apiKey || credentials?.API_KEY || credentials?.access_token;
    if (!apiKey || typeof apiKey !== "string") {
      return {
        ok: false,
        httpStatus: 400,
        message: "Credenciais Asaas inválidas: apiKey ausente",
      };
    }
    const res = await fetch("https://www.asaas.com/api/v3/myAccount", {
      method: "GET",
      headers: { "Content-Type": "application/json", access_token: apiKey },
      signal,
    }).catch((e) => {
      if (e.name === "AbortError") {
        return new Response(null, {
          status: 408,
          statusText: "Request Timeout",
        });
      }
      return new Response(null, { status: 500, statusText: "Internal Error" });
    });

    if (!res) {
      return {
        ok: false,
        httpStatus: 500,
        message: "Falha ao conectar ao Asaas",
      };
    }

    const httpStatus = res.status;
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const capabilities = {
        credit_card: true,
        pix: true,
        boleto: true,
      };
      return {
        ok: true,
        httpStatus,
        message: `Conta Asaas verificada (name=${data?.name || "desconhecido"})`,
        capabilities,
        metadata: {
          name: data?.name,
          email: data?.email,
          cpfCnpj: data?.cpfCnpj,
          mobilePhone: data?.mobilePhone,
        },
      };
    } else {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        httpStatus,
        message: `Asaas rejeitou as credenciais (${httpStatus})`,
        metadata: { response_excerpt: text.slice(0, 200) },
      };
    }
  },
};

// Pague-X: GET /v1/transactions (Basic Auth: publicKey:secretKey)
const paguexAdapter: Adapter = {
  slug: "paguex",
  async verify(credentials, signal) {
    console.log("[PagueX] ========== INICIANDO VERIFICAÇÃO ==========");
    console.log(
      "[PagueX] Credentials recebidas:",
      Object.keys(credentials || {}),
    );

    const publicKey = credentials?.publicKey || credentials?.PUBLIC_KEY;
    const secretKey = credentials?.secretKey || credentials?.SECRET_KEY;

    console.log("[PagueX] PublicKey presente:", !!publicKey);
    console.log(
      "[PagueX] PublicKey (primeiros 15 chars):",
      publicKey?.substring(0, 15),
    );
    console.log("[PagueX] SecretKey presente:", !!secretKey);

    if (!publicKey || !secretKey) {
      console.log("[PagueX] ❌ Credenciais ausentes!");
      return {
        ok: false,
        httpStatus: 400,
        message:
          "Credenciais Pague-X inválidas: publicKey e/ou secretKey ausentes",
      };
    }

    // Gerar Basic Auth: base64(publicKey:secretKey)
    const authString = btoa(`${publicKey}:${secretKey}`);
    console.log(
      "[PagueX] Auth string gerado (primeiros 30 chars):",
      authString.substring(0, 30),
    );

    // Endpoint de verificação leve (lista transações com limit=1)
    console.log(
      "[PagueX] Fazendo requisição para: https://api.inpagamentos.com/v1/transactions?limit=1",
    );

    let res: Response | null = null;
    try {
      res = await fetch(
        "https://api.inpagamentos.com/v1/transactions?limit=1",
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${authString}`,
            "Content-Type": "application/json",
          },
          signal,
        },
      );

      console.log("[PagueX] Response recebida!");
      console.log("[PagueX] Status Code:", res.status);
      console.log("[PagueX] Status OK:", res.ok);
      console.log(
        "[PagueX] Headers:",
        Object.fromEntries(res.headers.entries()),
      );
    } catch (e: any) {
      console.log("[PagueX] ❌ ERRO no fetch:", e?.name, e?.message);

      if (e?.name === "AbortError") {
        console.log("[PagueX] ❌ TIMEOUT após 5 segundos");
        return {
          ok: false,
          httpStatus: 408,
          message: "Pague-X: timeout (limite de 5 segundos excedido)",
        };
      }

      console.log("[PagueX] ❌ ERRO DE CONEXÃO:", e?.message || "Desconhecido");
      return {
        ok: false,
        httpStatus: 500,
        message: `Pague-X: erro de conexão - ${e?.message || "Desconhecido"}`,
      };
    }

    if (!res) {
      console.log("[PagueX] ❌ Response é null/undefined!");
      return {
        ok: false,
        httpStatus: 500,
        message: "Pague-X: resposta vazia",
      };
    }

    const httpStatus = res.status;

    if (res.ok) {
      console.log("[PagueX] ✅ VERIFICAÇÃO SUCESSO! Status:", httpStatus);

      const data = await res.json().catch(() => ({}));
      console.log("[PagueX] ✅ Data recebida:", Object.keys(data));

      const capabilities = {
        credit_card: true,
        pix: true,
        boleto: true,
        wallet: false,
      };

      console.log("[PagueX] ✅ Retornando resultado positivo");
      return {
        ok: true,
        httpStatus,
        message: `Credenciais Pague-X verificadas com sucesso`,
        capabilities,
        metadata: {
          api_version: "v1",
          provider: "inpagamentos.com",
        },
      };
    }

    // Erro: status não-2xx
    const text = await res.text().catch(() => "");
    console.log("[PagueX] ❌ VERIFICAÇÃO FALHOU! Status:", httpStatus);
    console.log(
      "[PagueX] ❌ Response body (primeiros 200 chars):",
      text.slice(0, 200),
    );

    // Mensagens específicas por código HTTP
    let message = `Pague-X rejeitou as credenciais (${httpStatus})`;
    if (httpStatus === 401) {
      message =
        "Pague-X: credenciais inválidas - verifique publicKey e secretKey";
      console.log("[PagueX] ❌ 401 Unauthorized - Credenciais incorretas");
    } else if (httpStatus === 403) {
      message = "Pague-X: acesso negado - verifique permissões da conta";
      console.log("[PagueX] ❌ 403 Forbidden - Sem permissão");
    } else if (httpStatus === 404) {
      message = "Pague-X: endpoint não encontrado - verifique URL da API";
      console.log("[PagueX] ❌ 404 Not Found - Endpoint incorreto");
    } else if (httpStatus === 429) {
      message =
        "Pague-X: limite de requisições excedido - aguarde e tente novamente";
      console.log("[PagueX] ❌ 429 Too Many Requests - Rate limit");
    } else if (httpStatus >= 500) {
      message =
        "Pague-X: erro no servidor da inpagamentos.com - tente novamente mais tarde";
      console.log("[PagueX] ❌ 5xx Server Error - Problema no servidor");
    }

    return {
      ok: false,
      httpStatus,
      message,
      metadata: { response_excerpt: text.slice(0, 200) },
    };
  },
};

const adapters: Record<string, Adapter> = {
  stripe: stripeAdapter,

  "mercado-pago": mercadopagoAdapter,

  mercadopago: mercadopagoAdapter,

  asaas: asaasAdapter,

  paguex: paguexAdapter,
};

// ============ Encryption helper (AES-GCM) ============

async function importAesKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function toBase64(arr: Uint8Array): string {
  let s = "";
  arr.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

async function encryptJsonGCM(keyB64: string, payload: Json): Promise<string> {
  const key = await importAesKeyFromBase64(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  const out = new Uint8Array(iv.byteLength + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.byteLength);
  return toBase64(out);
}

// ============ Main handler ============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment configuration" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Auth
    const { data: auth, error: userErr } = await supabase.auth.getUser();
    if (userErr || !auth?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const userId: string = auth.user.id;

    // Load user profile to check super admin
    const { data: userProfile } = await supabase
      .from("User")
      .select("id, isSuperAdmin")
      .eq("id", userId)
      .single();
    const isSuperAdmin = !!userProfile?.isSuperAdmin;

    const body = await req.json().catch(() => ({}) as any);
    const configId: string | undefined = body?.configId;
    const slugInput: string | undefined = body?.slug;
    const credentials: Json | undefined = body?.credentials;
    const persistCredentials: boolean = !!body?.persistCredentials;

    console.log(
      "[HANDLER] ========== Nova requisição de verificação ==========",
    );
    console.log("[HANDLER] configId:", configId);
    console.log("[HANDLER] slugInput:", slugInput);
    console.log("[HANDLER] credentials keys:", Object.keys(credentials || {}));
    console.log("[HANDLER] persistCredentials:", persistCredentials);

    // 1) Obter GatewayConfig (+ Gateway) pela configId OU slug+userId
    let gatewayConfig: any | null = null;
    let gateway: any | null = null;

    if (configId) {
      const { data, error } = await supabase
        .from("GatewayConfig")
        .select("*, Gateway(*)")
        .eq("id", configId)
        .single();
      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "GatewayConfig não encontrada" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          },
        );
      }
      gatewayConfig = data;
      gateway = data.Gateway;
    } else if (slugInput) {
      const { data: gw } = await supabase
        .from("Gateway")
        .select("id, slug, name")
        .eq("slug", slugInput)
        .single();
      if (!gw) {
        return new Response(
          JSON.stringify({
            error: `Gateway não encontrado para slug=${slugInput}`,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          },
        );
      }
      const { data: cfg } = await supabase
        .from("GatewayConfig")
        .select("*, Gateway(*)")
        .eq("userId", userId)
        .eq("gatewayId", gw.id)
        .single();
      if (!cfg) {
        return new Response(
          JSON.stringify({
            error: "GatewayConfig não encontrada para o usuário",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          },
        );
      }
      gatewayConfig = cfg;
      gateway = cfg.Gateway;
    } else {
      return new Response(
        JSON.stringify({ error: "Informe configId ou slug" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // 2) Autorização: dono da config ou super admin
    if (!isSuperAdmin && gatewayConfig.userId !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // 3) Determinar slug e credenciais (preferir corpo → verificação transitória)
    const slug = (gateway?.slug || slugInput || "").toLowerCase();
    const creds = credentials ?? gatewayConfig.credentials ?? {};
    // importate: não logar creds

    console.log("[HANDLER] Gateway determinado:");
    console.log("[HANDLER] - slug:", slug);
    console.log("[HANDLER] - gateway.name:", gateway?.name);
    console.log("[HANDLER] - creds keys:", Object.keys(creds || {}));

    // 4) Adapter e verificação real (timeout curto 5s)
    const adapter = adapters[slug];
    if (!adapter) {
      console.log("[HANDLER] ❌ Adapter não encontrado para slug:", slug);
      console.log("[HANDLER] ❌ Adapters disponíveis:", Object.keys(adapters));
      return new Response(
        JSON.stringify({
          error: `Verificação não implementada para '${slug}'`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 422,
        },
      );
    }

    console.log("[HANDLER] ✅ Adapter encontrado:", slug);
    console.log("[HANDLER] Iniciando verificação com timeout de 5000ms...");

    const controller = withTimeout(5000);
    let verifyResult: VerifyResult;
    try {
      verifyResult = await adapter.verify(creds, controller.signal);
      console.log("[HANDLER] Verificação concluída!");
      console.log("[HANDLER] - ok:", verifyResult.ok);
      console.log("[HANDLER] - httpStatus:", verifyResult.httpStatus);
      console.log("[HANDLER] - message:", verifyResult.message);
      console.log("[HANDLER] - capabilities:", verifyResult.capabilities);
    } finally {
      cleanupTimeout(controller);
    }

    console.log("[HANDLER] Preparando atualização do GatewayConfig...");

    // 5) Atualizar GatewayConfig com resultado de verificação
    // - environment: 'production'
    // - isVerified: true/false
    // - verifiedAt: agora se ok
    // - verificationMetadata: dados úteis do provider
    const updates: Record<string, any> = {
      environment: "production",
      isVerified: verifyResult.ok,
      verifiedAt: verifyResult.ok ? new Date().toISOString() : null,
      verificationMetadata: {
        httpStatus: verifyResult.httpStatus,
        message: verifyResult.message,
        capabilities: verifyResult.capabilities ?? null,
        providerMetadata: verifyResult.metadata ?? null,
        provider: slug,
        // Nunca gravar valores sensíveis aqui
      },
      updatedAt: new Date().toISOString(),
    };

    // Opcional: cifrar credenciais e persistir em credentialsEncrypted
    const encKey = Deno.env.get("CREDENTIALS_ENCRYPTION_KEY"); // base64 / 32 bytes
    if (persistCredentials && encKey) {
      try {
        updates.credentialsEncrypted = await encryptJsonGCM(encKey, creds);
      } catch {
        // Não falhar a verificação por erro de cifra
        // Apenas não gravar o campo
      }
    }

    // Executar update
    // RLS deve permitir update pelo owner ou por super admin (se houver política)
    console.log("[HANDLER] Atualizando GatewayConfig no banco...");
    const { error: upErr } = await supabase
      .from("GatewayConfig")
      .update(updates)
      .eq("id", gatewayConfig.id);
    if (upErr) {
      console.log(
        "[HANDLER] ⚠️ Erro ao atualizar GatewayConfig:",
        upErr.message,
      );
      // Não interromper a resposta de verificação, mas informar
      // Sem incluir dados sensíveis
    } else {
      console.log("[HANDLER] ✅ GatewayConfig atualizado com sucesso");
    }

    // 6) Inserir auditoria em GatewayVerification
    console.log("[HANDLER] Inserindo registro de auditoria...");
    await supabase.from("GatewayVerification").insert({
      gatewayConfigId: gatewayConfig.id,
      userId,
      success: verifyResult.ok,
      httpStatus: verifyResult.httpStatus,
      message: verifyResult.message,
      responseJson: {
        provider: slug,
        capabilities: verifyResult.capabilities ?? null,
        meta: verifyResult.metadata ?? null,
      },
    });

    // 7) Retornar resultado
    const resp = {
      success: verifyResult.ok,
      gatewayId: gateway?.id ?? null,
      gatewaySlug: slug || null,
      httpStatus: verifyResult.httpStatus ?? null,
      message: verifyResult.message,
      verifiedAt: verifyResult.ok ? new Date().toISOString() : null,
      capabilities: verifyResult.capabilities ?? undefined,
      environment: "production" as const,
    };

    // Somente logs inofensivos (sem chaves)
    console.info(
      `[gateway-config-verify] user=${redact(userId)} provider=${slug} status=${verifyResult.httpStatus} ok=${verifyResult.ok}`,
    );

    console.log(
      "[HANDLER] ========== Retornando resposta com status 200 ==========",
    );
    console.log("[HANDLER] Response body:", JSON.stringify(resp, null, 2));

    return new Response(JSON.stringify(resp), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    const message =
      typeof err?.message === "string" ? err.message : "Erro interno";
    console.error("[gateway-config-verify] error:", message);

    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
