import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreatePaymentPayload } from "./types.ts";

export class Client {
  // Cache estático para o token por instância
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
   * Obtém o Token OAuth2 da GetNet.
   */
  async getAccessToken(): Promise<string> {
    if (Client.tokenCache && Client.tokenCache.expiresAt > Date.now()) {
      return Client.tokenCache.token;
    }

    const authString = `${this.credentials.clientId}:${this.credentials.clientSecret}`;
    const base64Auth = btoa(authString);

    const res = await this.http.request(`${this.getBaseUrl()}/auth/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${base64Auth}`,
      },
      body: "scope=oob&grant_type=client_credentials",
      timeoutMs: config.timeoutMs,
    });

    if (!res.ok) {
      throw new Error(`Falha ao obter token GetNet: Status ${res.status}`);
    }

    const data = await res.json();
    Client.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000 * 0.9,
    };

    return data.access_token;
  }

  /**
   * Verifica credenciais.
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
   * Cria pagamento Pix.
   * POST /v1/payments/qrcode/pix
   */
  async createPix(payload: CreatePaymentPayload): Promise<Response> {
    const token = await this.getAccessToken();
    return await this.http.request(`${this.getBaseUrl()}/v1/payments/qrcode/pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "seller_id": this.credentials.sellerId,
      },
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria pagamento Cartão de Crédito.
   * POST /v1/payments/credit
   */
  async createCreditCard(payload: CreatePaymentPayload): Promise<Response> {
    const token = await this.getAccessToken();
    return await this.http.request(`${this.getBaseUrl()}/v1/payments/credit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "seller_id": this.credentials.sellerId,
      },
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria pagamento Cartão de Débito.
   * POST /v1/payments/debit
   */
  async createDebitCard(payload: CreatePaymentPayload): Promise<Response> {
    const token = await this.getAccessToken();
    return await this.http.request(`${this.getBaseUrl()}/v1/payments/debit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "seller_id": this.credentials.sellerId,
      },
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria pagamento Boleto.
   * POST /v1/payments/boleto
   */
  async createBoleto(payload: CreatePaymentPayload): Promise<Response> {
    const token = await this.getAccessToken();
    return await this.http.request(`${this.getBaseUrl()}/v1/payments/boleto`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "seller_id": this.credentials.sellerId,
      },
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Obtém detalhes de um pagamento.
   * GET /v1/payments/{id}
   */
  async getPayment(paymentId: string): Promise<Response> {
    const token = await this.getAccessToken();
    return await this.http.request(`${this.getBaseUrl()}/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "seller_id": this.credentials.sellerId,
      },
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa/estorna um pagamento.
   * POST /v1/payments/{id}/refund
   */
  async refundPayment(paymentId: string, amount?: number): Promise<Response> {
    const token = await this.getAccessToken();
    const body = amount ? JSON.stringify({ amount }) : "{}";
    return await this.http.request(`${this.getBaseUrl()}/v1/payments/${paymentId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "seller_id": this.credentials.sellerId,
      },
      body,
      timeoutMs: config.timeoutMs,
    });
  }
}
