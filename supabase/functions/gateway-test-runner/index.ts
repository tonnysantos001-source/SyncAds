/**
 * ============================================
 * SYNCADS - GATEWAY TEST RUNNER (Edge Function)
 * ============================================
 *
 * Objetivo:
 * - Executar verificação REAL dos gateways configurados (produção) sem sandbox/mock
 * - Não persistir segredos nos logs
 * - Retornar relatório detalhado (por gateway/config): httpStatus, success, message, tempo e capabilities
 * - Opcionalmente registrar auditoria em GatewayVerification (sem incluir segredos)
 *
 * Segurança:
 * - Requer JWT válido
 * - Permite:
 *    - Usuário comum: testar apenas suas próprias configs (default)
 *    - Super Admin: testar todas (scope: "all") ou de um userId específico
 *
 * Entrada (JSON) opcional:
 * {
 *   "userId": string | null,         // Se informado e diferente do auth.user.id, requer super admin
 *   "limitToSlugs": string[] | null, // ex: ["stripe","mercadopago"]
 *   "scope": "self" | "all",         // "all" requer super admin; default: "self"
 *   "writeAudit": boolean,           // default true: cria registros em GatewayVerification
 *   "timeoutMs": number              // default 5000
 * }
 *
 * Saída:
 * {
 *   "count": number,
 *   "results": Array<{
 *     configId: string,
 *     userId: string,
 *     gatewayId: string,
 *     gatewaySlug: string,
 *     httpStatus: number | null,
 *     success: boolean,
 *     message: string,
 *     verifiedAt: string | null,
 *     capabilities?: Record<string, boolean> | null,
 *     durationMs: number
 *   }>
 * }
 *
 * Observações:
 * - Não expõe chaves/segredos, não imprime segredos em logs
 * - Sempre valida em PRODUÇÃO (environment='production', isActive=true)
 * ============================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, any>;

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface VerifyResult {
  ok: boolean;
  httpStatus: number | null;
  message: string;
  capabilities?: Record<string, boolean> | null;
  metadata?: Record<string, any> | null;
}

interface Adapter {
  slug: string;
  verify: (credentials: Json, signal: AbortSignal) => Promise<VerifyResult>;
}

function withTimeout(ms: number): AbortController {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  // @ts-ignore internal
  (controller as any)._timeoutId = id;
  return controller;
}

function cleanupTimeout(controller: AbortController) {
  // @ts-ignore internal
  if ((controller as any)._timeoutId) clearTimeout((controller as any)._timeoutId);
}

function redactId(v?: string | null): string {
  if (!v) return "";
  if (v.length <= 6) return "***";
  return `${v.substring(0, 3)}***${v.substring(v.length - 3)}`;
}

// ============ Provider adapters (verificação real, produção) ============

// Stripe: GET /v1/account (Bearer sk_live_...)
const stripeAdapter: Adapter = {
  slug: "stripe",
  async verify(credentials, signal) {
    const secretKey: string | undefined =
      credentials?.secretKey || credentials?.apiKey || credentials?.SECRET_KEY;
    if (!secretKey) {
      return { ok: false, httpStatus: 400, message: "Stripe: secretKey ausente", metadata: null };
    }

    let res: Response | null = null;
    try {
      res = await fetch("https://api.stripe.com/v1/account", {
        method: "GET",
        headers: { Authorization: `Bearer ${secretKey}` },
        signal,
      });
    } catch (e: any) {
      if (e?.name === "AbortError") {
        return { ok: false, httpStatus: 408, message: "Stripe: timeout", metadata: null };
      }
      return { ok: false, httpStatus: 500, message: "Stripe: erro de conexão", metadata: null };
    }

    if (!res) return { ok: false, httpStatus: 500, message: "Stripe: resposta vazia", metadata: null };

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const capabilities = {
        credit_card: true,
        pix: false,
        boleto: false,
      };
      return {
        ok: true,
        httpStatus: res.status,
        message: `Stripe verificado (account=${data?.id ?? "?"}, livemode=${!!data?.livemode})`,
        capabilities,
        metadata: {
          account_id: data?.id,
          livemode: !!data?.livemode,
          default_currency: data?.default_currency,
        },
      };
    }
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      httpStatus: res.status,
      message: `Stripe: credenciais rejeitadas (${res.status})`,
      metadata: { response_excerpt: text.slice(0, 200) },
    };
  },
};

// Mercado Pago: GET /users/me (Bearer ACCESS_TOKEN)
const mercadopagoAdapter: Adapter = {
  slug: "mercadopago",
  async verify(credentials, signal) {
    const token: string | undefined =
      credentials?.accessToken || credentials?.ACCESS_TOKEN || credentials?.token;
    if (!token) {
      return { ok: false, httpStatus: 400, message: "Mercado Pago: accessToken ausente", metadata: null };
    }

    let res: Response | null = null;
    try {
      res = await fetch("https://api.mercadopago.com/users/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
    } catch (e: any) {
      if (e?.name === "AbortError") {
        return { ok: false, httpStatus: 408, message: "Mercado Pago: timeout", metadata: null };
      }
      return { ok: false, httpStatus: 500, message: "Mercado Pago: erro de conexão", metadata: null };
    }

    if (!res) return { ok: false, httpStatus: 500, message: "Mercado Pago: resposta vazia", metadata: null };

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const capabilities = {
        credit_card: true,
        pix: true,
        boleto: true,
      };
      return {
        ok: true,
        httpStatus: res.status,
        message: `Mercado Pago verificado (user_id=${data?.id ?? "?"})`,
        capabilities,
        metadata: { user_id: data?.id, nickname: data?.nickname, site_id: data?.site_id },
      };
    }
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      httpStatus: res.status,
      message: `Mercado Pago: credenciais rejeitadas (${res.status})`,
      metadata: { response_excerpt: text.slice(0, 200) },
    };
  },
};

// Asaas: GET /api/v3/myAccount (Header: access_token)
const asaasAdapter: Adapter = {
  slug: "asaas",
  async verify(credentials, signal) {
    const apiKey: string | undefined =
      credentials?.apiKey || credentials?.API_KEY || credentials?.access_token;
    if (!apiKey) {
      return { ok: false, httpStatus: 400, message: "Asaas: apiKey ausente", metadata: null };
    }

    let res: Response | null = null;
    try {
      res = await fetch("https://www.asaas.com/api/v3/myAccount", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "access_token": apiKey,
        },
        signal,
      });
    } catch (e: any) {
      if (e?.name === "AbortError") {
        return { ok: false, httpStatus: 408, message: "Asaas: timeout", metadata: null };
      }
      return { ok: false, httpStatus: 500, message: "Asaas: erro de conexão", metadata: null };
    }

    if (!res) return { ok: false, httpStatus: 500, message: "Asaas: resposta vazia", metadata: null };

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const capabilities = {
        credit_card: true,
        pix: true,
        boleto: true,
      };
      return {
        ok: true,
        httpStatus: res.status,
        message: `Asaas verificado (name=${data?.name ?? "?"})`,
        capabilities,
        metadata: { name: data?.name, email: data?.email },
      };
    }
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      httpStatus: res.status,
      message: `Asaas: credenciais rejeitadas (${res.status})`,
      metadata: { response_excerpt: text.slice(0, 200) },
    };
  },
};

// Fallback para gateways sem adaptador implementado (retorna não implementado)
const unsupportedAdapter: Adapter = {
  slug: "unsupported",
  async verify() {
    return {
      ok: false,
      httpStatus: 501,
      message: "Verificação não implementada para este gateway",
      capabilities: null,
      metadata: null,
    };
  },
};

const adapters: Record<string, Adapter> = {
  stripe: stripeAdapter,
  mercadopago: mercadopagoAdapter,
  "mercado-pago": mercadopagoAdapter,
  asaas: asaasAdapter,
};

// ============ (Opcional) Decriptação AES-GCM para credentialsEncrypted ============

async function importAesKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
}

function fromBase64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function decryptJsonGCM(keyB64: string, cipherB64: string): Promise<Json | null> {
  try {
    const key = await importAesKeyFromBase64(keyB64);
    const packed = fromBase64ToUint8Array(cipherB64);
    // first 12 bytes = IV
    const iv = packed.slice(0, 12);
    const data = packed.slice(12);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    const text = new TextDecoder().decode(new Uint8Array(plain));
    return JSON.parse(text);
  } catch {
    return null;
  }
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

  const startedAt = Date.now();

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment configuration" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
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
    const currentUserId: string = auth.user.id;

    // Load user profile to check super admin
    const { data: userProfile } = await supabase
      .from("User")
      .select("id, isSuperAdmin")
      .eq("id", currentUserId)
      .single();
    const isSuperAdmin = !!userProfile?.isSuperAdmin;

    // Parse body
    const body = await req.json().catch(() => ({} as any));
    const inputUserId: string | null = body?.userId ?? null;
    const limitToSlugs: string[] | null = Array.isArray(body?.limitToSlugs)
      ? body.limitToSlugs.map((s: string) => String(s).toLowerCase())
      : null;
    const scope: "self" | "all" = body?.scope === "all" ? "all" : "self";
    const writeAudit: boolean = typeof body?.writeAudit === "boolean" ? body.writeAudit : true;
    const timeoutMs: number = Number.isFinite(body?.timeoutMs) ? Math.max(1000, body.timeoutMs) : 5000;

    // Authorization rules:
    // - scope "all" => require super admin
    // - inputUserId != currentUserId => require super admin
    if (scope === "all" && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: requires super admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }
    if (inputUserId && inputUserId !== currentUserId && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: not allowed for other users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Query target GatewayConfig rows (environment=production, isActive=true)
    let query = supabase
      .from("GatewayConfig")
      .select("id, userId, gatewayId, credentials, credentialsEncrypted, environment, isActive, isVerified, verifiedAt, Gateway(id, slug, name)")
      .eq("environment", "production")
      .eq("isActive", true);

    if (scope !== "all") {
      // self scope
      const targetUserId = inputUserId ?? currentUserId;
      query = query.eq("userId", targetUserId);
    } else if (inputUserId) {
      // all + filter by specific userId
      query = query.eq("userId", inputUserId);
    }

    if (limitToSlugs && limitToSlugs.length > 0) {
      // Supabase PostgREST doesn't allow IN on related field directly; filter after fetch
      // We'll fetch all and filter in memory
    }

    const { data: configs, error: cfgErr } = await query;
    if (cfgErr) {
      return new Response(JSON.stringify({ error: "Falha ao buscar GatewayConfig" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const targetConfigs = (configs ?? []).filter((c: any) => {
      const slug = (c?.Gateway?.slug ?? "").toLowerCase();
      if (!slug) return false;
      if (limitToSlugs && limitToSlugs.length > 0) {
        return limitToSlugs.includes(slug);
      }
      return true;
    });

    // Helper: get credentials for verification (prefer JSON, else decrypt)
    async function resolveCredentials(conf: any): Promise<Json> {
      if (conf?.credentials && typeof conf.credentials === "object") {
        return conf.credentials as Json;
      }
      const enc = conf?.credentialsEncrypted as string | null | undefined;
      const keyB64 = Deno.env.get("CREDENTIALS_ENCRYPTION_KEY");
      if (enc && keyB64) {
        const obj = await decryptJsonGCM(keyB64, enc);
        if (obj && typeof obj === "object") {
          return obj;
        }
      }
      // fallback empty
      return {};
    }

    // Verify each config
    const results = [] as Array<{
      configId: string;
      userId: string;
      gatewayId: string;
      gatewaySlug: string;
      httpStatus: number | null;
      success: boolean;
      message: string;
      verifiedAt: string | null;
      capabilities?: Record<string, boolean> | null;
      durationMs: number;
    }>;

    for (const conf of targetConfigs) {
      const startedEach = Date.now();
      const slug: string = (conf?.Gateway?.slug ?? "").toLowerCase();
      const adapter = adapters[slug] ?? unsupportedAdapter;

      // resolve credentials (never log)
      const credentials = await resolveCredentials(conf);
      const controller = withTimeout(timeoutMs);

      let verify: VerifyResult;
      try {
        verify = await adapter.verify(credentials, controller.signal);
      } catch (e: any) {
        verify = {
          ok: false,
          httpStatus: e?.name === "AbortError" ? 408 : 500,
          message: e?.message ? `Erro: ${e.message}` : "Erro interno",
          metadata: null,
          capabilities: null,
        };
      } finally {
        cleanupTimeout(controller);
      }

      const durationMs = Date.now() - startedEach;

      // Audit (opcional) - não inclui segredos
      if (writeAudit) {
        await supabase.from("GatewayVerification").insert({
          gatewayConfigId: conf.id,
          userId: conf.userId,
          success: verify.ok,
          httpStatus: verify.httpStatus ?? null,
          message: verify.message,
          responseJson: {
            provider: slug,
            capabilities: verify.capabilities ?? null,
            meta: verify.metadata ?? null,
            durationMs,
          },
        });
      }

      // Build result (não incluir segredos)
      results.push({
        configId: conf.id,
        userId: conf.userId,
        gatewayId: conf.gatewayId,
        gatewaySlug: slug,
        httpStatus: verify.httpStatus,
        success: verify.ok,
        message: verify.message,
        verifiedAt: verify.ok ? new Date().toISOString() : null,
        capabilities: verify.capabilities ?? null,
        durationMs,
      });

      // Harmless log (sem segredos)
      console.info(
        `[gateway-test-runner] u=${redactId(conf.userId)} cfg=${redactId(
          conf.id,
        )} prov=${slug} status=${verify.httpStatus} ok=${verify.ok} t=${durationMs}ms`,
      );
    }

    const response = {
      count: results.length,
      durationMs: Date.now() - startedAt,
      results,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : "Erro interno";
    console.error("[gateway-test-runner] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
