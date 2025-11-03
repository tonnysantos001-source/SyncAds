import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type Json = Record<string, any>;

interface VerifyResult {
  ok: boolean;
  httpStatus: number;
  message: string;
  capabilities?: Record<string, boolean>;
  metadata?: Record<string, any>;
}

// Minimal adapters (mirroring the real edge adapters behavior) for unit testing
async function verifyStripe(credentials: Json, _signal?: AbortSignal): Promise<VerifyResult> {
  const secretKey = credentials?.secretKey || credentials?.apiKey || credentials?.SECRET_KEY;
  if (!secretKey || typeof secretKey !== "string") {
    return { ok: false, httpStatus: 400, message: "Credenciais Stripe inválidas: secretKey ausente" };
  }
  try {
    const res = await fetch("https://api.stripe.com/v1/account", {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
      // signal: _signal, // unused in tests
    } as any);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: true,
        httpStatus: res.status,
        message: `Conta Stripe verificada (id=${data.id || "desconhecido"}, livemode=${!!data.livemode})`,
        capabilities: { credit_card: true, pix: false, boleto: false },
        metadata: {
          account_id: data.id,
          default_currency: data.default_currency,
          livemode: !!data.livemode,
          business_type: data.business_type,
        },
      };
    } else {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        httpStatus: res.status,
        message: `Stripe rejeitou as credenciais (${res.status})`,
        metadata: { response_excerpt: text.slice(0, 200) },
      };
    }
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return { ok: false, httpStatus: 408, message: "Stripe: timeout" };
    }
    return { ok: false, httpStatus: 500, message: "Falha ao conectar ao Stripe" };
  }
}

async function verifyMercadoPago(credentials: Json, _signal?: AbortSignal): Promise<VerifyResult> {
  const accessToken = credentials?.accessToken || credentials?.ACCESS_TOKEN || credentials?.token;
  if (!accessToken || typeof accessToken !== "string") {
    return { ok: false, httpStatus: 400, message: "Credenciais Mercado Pago inválidas: accessToken ausente" };
  }
  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      // signal: _signal,
    } as any);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: true,
        httpStatus: res.status,
        message: `Conta Mercado Pago verificada (id=${data.id || "desconhecido"})`,
        capabilities: { credit_card: true, pix: true, boleto: true },
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
        httpStatus: res.status,
        message: `Mercado Pago rejeitou as credenciais (${res.status})`,
        metadata: { response_excerpt: text.slice(0, 200) },
      };
    }
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return { ok: false, httpStatus: 408, message: "Mercado Pago: timeout" };
    }
    return { ok: false, httpStatus: 500, message: "Falha ao conectar ao Mercado Pago" };
  }
}

async function verifyAsaas(credentials: Json, _signal?: AbortSignal): Promise<VerifyResult> {
  const apiKey = credentials?.apiKey || credentials?.API_KEY || credentials?.access_token;
  if (!apiKey || typeof apiKey !== "string") {
    return { ok: false, httpStatus: 400, message: "Credenciais Asaas inválidas: apiKey ausente" };
  }
  try {
    const res = await fetch("https://www.asaas.com/api/v3/myAccount", {
      method: "GET",
      headers: { "Content-Type": "application/json", access_token: apiKey },
      // signal: _signal,
    } as any);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: true,
        httpStatus: res.status,
        message: `Conta Asaas verificada (name=${data?.name || "desconhecido"})`,
        capabilities: { credit_card: true, pix: true, boleto: true },
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
        httpStatus: res.status,
        message: `Asaas rejeitou as credenciais (${res.status})`,
        metadata: { response_excerpt: text.slice(0, 200) },
      };
    }
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return { ok: false, httpStatus: 408, message: "Asaas: timeout" };
    }
    return { ok: false, httpStatus: 500, message: "Falha ao conectar ao Asaas" };
  }
}

// Helpers to mock fetch
function mockFetchOnceOkJson(expectedUrl: string, json: any, check?: (req: Request | string, init?: RequestInit) => void) {
  (globalThis as any).fetch = vi.fn().mockImplementation((req: Request | string, init?: RequestInit) => {
    if (typeof req === "string") {
      expect(req).toBe(expectedUrl);
      check?.(req, init);
    } else {
      expect((req as Request).url).toBe(expectedUrl);
      check?.(req);
    }
    return Promise.resolve(
      new Response(JSON.stringify(json), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
}

function mockFetchOnceStatus(expectedUrl: string, status: number, body: any, isJson = false, check?: (req: Request | string, init?: RequestInit) => void) {
  (globalThis as any).fetch = vi.fn().mockImplementation((req: Request | string, init?: RequestInit) => {
    if (typeof req === "string") {
      expect(req).toBe(expectedUrl);
      check?.(req, init);
    } else {
      expect((req as Request).url).toBe(expectedUrl);
      check?.(req);
    }
    const payload = isJson ? JSON.stringify(body) : String(body);
    return Promise.resolve(
      new Response(payload, {
        status,
        headers: { "Content-Type": isJson ? "application/json" : "text/plain" },
      }),
    );
  });
}

function mockFetchOnceAbort(expectedUrl: string, check?: (req: Request | string, init?: RequestInit) => void) {
  (globalThis as any).fetch = vi.fn().mockImplementation((req: Request | string, init?: RequestInit) => {
    if (typeof req === "string") {
      expect(req).toBe(expectedUrl);
      check?.(req, init);
    } else {
      expect((req as Request).url).toBe(expectedUrl);
      check?.(req);
    }
    const err: any = new Error("Aborted");
    err.name = "AbortError";
    return Promise.reject(err);
  });
}

describe("Gateway credential verification adapters", () => {
  const STRIPE_URL = "https://api.stripe.com/v1/account";
  const MP_URL = "https://api.mercadopago.com/users/me";
  const ASAAS_URL = "https://www.asaas.com/api/v3/myAccount";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Stripe
  describe("Stripe verify", () => {
    it("returns ok=true on 200 with valid account payload", async () => {
      mockFetchOnceOkJson(
        STRIPE_URL,
        { id: "acct_123", livemode: true, default_currency: "brl" },
        (_req, init) => {
          expect(init?.headers).toBeTruthy();
          // @ts-ignore
          const auth = init?.headers?.Authorization || init?.headers?.authorization;
          expect(auth).toBe("Bearer sk_live_abc");
        },
      );

      const res = await verifyStripe({ secretKey: "sk_live_abc" });
      expect(res.ok).toBe(true);
      expect(res.httpStatus).toBe(200);
      expect(res.message).toMatch(/Conta Stripe verificada/);
      expect(res.capabilities).toEqual({ credit_card: true, pix: false, boleto: false });
      expect(res.metadata?.account_id).toBe("acct_123");
      expect(res.metadata?.livemode).toBe(true);
    });

    it("fails when secretKey is missing", async () => {
      const res = await verifyStripe({});
      expect(res.ok).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.message).toMatch(/secretKey ausente/);
    });

    it("returns ok=false on 401 (rejected credentials)", async () => {
      mockFetchOnceStatus(STRIPE_URL, 401, "Unauthorized", false, (_req, init) => {
        // @ts-ignore
        const auth = init?.headers?.Authorization || init?.headers?.authorization;
        expect(auth).toBe("Bearer sk_live_bad");
      });

      const res = await verifyStripe({ secretKey: "sk_live_bad" });
      expect(res.ok).toBe(false);
      expect(res.httpStatus).toBe(401);
      expect(res.message).toMatch(/rejeitou as credenciais/);
      expect(res.metadata?.response_excerpt).toContain("Unauthorized");
    });

    it("maps AbortError to 408 timeout", async () => {
      mockFetchOnceAbort(STRIPE_URL, (_req, init) => {
        // @ts-ignore
        const auth = init?.headers?.Authorization || init?.headers?.authorization;
        expect(auth).toBe("Bearer sk_live_time");
      });
      const res = await verifyStripe({ secretKey: "sk_live_time" });
      expect(res.ok).toBe(false);
      expect(res.httpStatus).toBe(408);
      expect(res.message).toMatch(/timeout/i);
    });
  });

  // Mercado Pago
  describe("Mercado Pago verify", () => {
    it("returns ok=true on 200 with user payload", async () => {
      mockFetchOnceOkJson(
        MP_URL,
        { id: 999, nickname: "store_abc", site_id: "MLB", email: "store@example.com" },
        (_req, init) => {
          // @ts-ignore
          const auth = init?.headers?.Authorization || init?.headers?.authorization;
          expect(auth).toBe("Bearer APP_USR-xyz");
        },
      );

      const res = await verifyMercadoPago({ accessToken: "APP_USR-xyz" });
      expect(res.ok).toBe(true);
      expect(res.httpStatus).toBe(200);
      expect(res.message).toMatch(/verificada/);
      expect(res.capabilities).toEqual({ credit_card: true, pix: true, boleto: true });
      expect(res.metadata?.user_id).toBe(999);
      expect(res.metadata?.nickname).toBe("store_abc");
    });

    it("fails when accessToken is missing", async () => {
      const res = await verifyMercadoPago({});
      expect(res.ok).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.message).toMatch(/accessToken ausente/);
    });

    it("returns ok=false on 403 (rejected)", async () => {
      mockFetchOnceStatus(MP_URL, 403, "Forbidden");
      const res = await verifyMercadoPago({ accessToken: "bad" });
      expect(res.ok).toBe(false);
      expect(res.httpStatus).toBe(403);
      expect(res.message).toMatch(/rejeitou as credenciais/);
      expect(res.metadata?.response_excerpt).toContain("Forbidden");
    });

    it("maps AbortError to 408 timeout", async () => {
      mockFetchOnceAbort(MP_URL);
      const res = await verifyMercadoPago({ accessToken: "time" });
      expect(res.ok).toBe(false);
      expect(res.httpStatus).toBe(408);
      expect(res.message).toMatch(/timeout/i);
    });
  });

  // Asaas
  describe("Asaas verify", () => {
    it("returns ok=true on 200 with account payload", async () => {
      mockFetchOnceOkJson(
        ASAAS_URL,
        { name: "My Biz", email: "biz@example.com", cpfCnpj: "00.000.000/0000-00", mobilePhone: "5599999999" },
        (_req, init) => {
          // @ts-ignore
          const token = init?.headers?.access_token;
          expect(token).toBe("asaas_key_123");
        },
      );

      const res = await verifyAsaas({ apiKey: "asaas_key_123" });
      expect(res.ok).toBe(true);
      expect(res.httpStatus).toBe(200);
      expect(res.message).toMatch(/Conta Asaas verificada/);
      expect(res.capabilities).toEqual({ credit_card: true, pix: true, boleto: true });
      expect(res.metadata?.name).toBe("My Biz");
      expect(res.metadata?.email).toBe("biz@example.com");
    });

    it("fails when apiKey is missing", async () => {
      const res = await verifyAsaas({});
      expect(res.ok).toBe(false);
      expect(res.httpStatus).toBe(400);
      expect(res.message).toMatch(/apiKey ausente/);
    });

    it("returns ok=false on 500 error", async () => {
      mockFetchOnceStatus(ASAAS_URL, 500, "Internal Server Error");
      const res = await verifyAsaas({ apiKey: "asaas_bad" });
      expect(res.ok).toBe(false);
      expect(res.httpStatus).toBe(500);
      expect(res.message).toMatch(/rejeitou as credenciais|Falha ao conectar|500/);
    });

    it("maps AbortError to 408 timeout", async () => {
      mockFetchOnceAbort(ASAAS_URL);
      const res = await verifyAsaas({ apiKey: "asaas_time" });
      expect(res.ok).toBe(false);
      expect(res.httpStatus).toBe(408);
      expect(res.message).toMatch(/timeout/i);
    });
  });
});
