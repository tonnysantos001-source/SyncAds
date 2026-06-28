import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateOrderPayload } from "./types.ts";

export class Client {
  private static tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  /**
   * Obtém Access Token OAuth2
   */
  async getAccessToken(): Promise<string> {
    if (Client.tokenCache && Client.tokenCache.expiresAt > Date.now()) {
      return Client.tokenCache.token;
    }

    const auth = btoa(`${this.credentials.clientId}:${this.credentials.clientSecret}`);

    const res = await this.http.request(`${this.getBaseUrl()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
      timeoutMs: config.timeoutMs,
    });

    if (!res.ok) {
      throw new Error(`Falha de autenticação PayPal: Status ${res.status}`);
    }

    const data = await res.json();
    Client.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000 * 0.9,
    };

    return data.access_token;
  }

  /**
   * Valida credenciais.
   */
  async ping(): Promise<Response> {
    try {
      const token = await this.getAccessToken();
      if (token) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "No token returned" }), { status: 401 });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 401 });
    }
  }

  /**
   * Cria uma Ordem de pagamento no PayPal.
   * POST /v2/checkout/orders
   */
  async createOrder(payload: CreateOrderPayload, orderId: string): Promise<Response> {
    const token = await this.getAccessToken();
    return await this.http.request(`${this.getBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "PayPal-Request-Id": orderId,
      },
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Captura o pagamento de uma ordem aprovada.
   * POST /v2/checkout/orders/{id}/capture
   */
  async captureOrder(orderId: string): Promise<Response> {
    const token = await this.getAccessToken();
    return await this.http.request(`${this.getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: "{}",
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta os detalhes de uma ordem.
   * GET /v2/checkout/orders/{id}
   */
  async getOrder(orderId: string): Promise<Response> {
    const token = await this.getAccessToken();
    return await this.http.request(`${this.getBaseUrl()}/v2/checkout/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa um pagamento capturado.
   * POST /v2/payments/captures/{capture_id}/refund
   */
  async refundPayment(captureId: string, amount?: number, currency = "USD"): Promise<Response> {
    const token = await this.getAccessToken();
    const body = amount
      ? JSON.stringify({
          amount: {
            value: amount.toFixed(2),
            currency_code: currency,
          },
        })
      : "{}";

    return await this.http.request(`${this.getBaseUrl()}/v2/payments/captures/${captureId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body,
      timeoutMs: config.timeoutMs,
    });
  }
}
