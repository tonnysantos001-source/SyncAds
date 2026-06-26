import { HttpClientInterface, CacheInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean,
    private cache: CacheInterface
  ) {}

  private getBaseUrl(): string {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  /**
   * Obtém o token de acesso OAuth2 usando HTTP Basic Auth
   */
  async getAccessToken(): Promise<string> {
    const cacheKey = `getnet_token_${this.credentials.clientId}_${this.isTestMode ? "sandbox" : "prod"}`;
    const cachedToken = await this.cache.get<string>(cacheKey);
    if (cachedToken) {
      return cachedToken;
    }

    const url = `${this.getBaseUrl()}/auth/oauth/v2/token`;
    const basicAuth = btoa(`${this.credentials.clientId}:${this.credentials.clientSecret}`);

    const res = await this.http.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: "scope=oob&grant_type=client_credentials",
      timeoutMs: config.timeoutMs,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.error_description || `Failed to authenticate with Getnet. Status: ${res.status}`);
    }

    const data = await res.json();
    const token = data.access_token;
    
    // Cache token (usa 90% do expires_in, padrão 3600s)
    const expiresSeconds = Math.floor((data.expires_in || 3600) * 0.9);
    await this.cache.set(cacheKey, token, expiresSeconds);

    return token;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "seller_id": this.credentials.sellerId,
    };
  }

  /**
   * Testa a conexão obtendo o token de acesso
   */
  async ping(): Promise<Response> {
    try {
      const token = await this.getAccessToken();
      if (token) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ success: false }), { status: 400 });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, message: err.message }), { status: 401 });
    }
  }

  /**
   * Cria pagamento via PIX
   */
  async createPix(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/v1/payments/qrcode/pix`;
    const headers = await this.getHeaders();
    return await this.http.request(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria pagamento via Cartão de Crédito
   */
  async createCreditCard(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/v1/payments/credit`;
    const headers = await this.getHeaders();
    return await this.http.request(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria pagamento via Cartão de Débito
   */
  async createDebitCard(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/v1/payments/debit`;
    const headers = await this.getHeaders();
    return await this.http.request(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria pagamento via Boleto
   */
  async createBoleto(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/v1/payments/boleto`;
    const headers = await this.getHeaders();
    return await this.http.request(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Obtém detalhes de um pagamento
   */
  async getPayment(paymentId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/v1/payments/${paymentId}`;
    const headers = await this.getHeaders();
    return await this.http.request(url, {
      method: "GET",
      headers,
      timeoutMs: config.timeoutMs,
    });
  }
}
