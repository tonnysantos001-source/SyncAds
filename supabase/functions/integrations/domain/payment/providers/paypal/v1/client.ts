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
    const cacheKey = `paypal_token_${this.credentials.clientId}_${this.isTestMode ? "sandbox" : "prod"}`;
    const cachedToken = await this.cache.get<string>(cacheKey);
    if (cachedToken) {
      return cachedToken;
    }

    const url = `${this.getBaseUrl()}/v1/oauth2/token`;
    // Usamos btoa para Base64. Em Deno/Node, btoa é globalmente disponível.
    const basicAuth = btoa(`${this.credentials.clientId}:${this.credentials.clientSecret}`);

    const res = await this.http.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: "grant_type=client_credentials",
      timeoutMs: config.timeoutMs,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.error_description || `Failed to authenticate. Status: ${res.status}`);
    }

    const data = await res.json();
    const token = data.access_token;
    
    // Armazena no cache com 90% do tempo de expiração
    const expiresSeconds = Math.floor((data.expires_in || 3600) * 0.9);
    await this.cache.set(cacheKey, token, expiresSeconds);

    return token;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
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
      return new Response(JSON.stringify({ success: false, message: "Token is empty" }), { status: 400 });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, message: err.message }), { status: 401 });
    }
  }

  /**
   * Cria um pedido de checkout no PayPal
   */
  async createOrder(payload: any, orderId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/v2/checkout/orders`;
    const headers = await this.getAuthHeaders();
    return await this.http.request(url, {
      method: "POST",
      headers: {
        ...headers,
        "PayPal-Request-Id": orderId,
      },
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Captura o pagamento de um pedido aprovado
   */
  async captureOrder(paypalOrderId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`;
    const headers = await this.getAuthHeaders();
    return await this.http.request(url, {
      method: "POST",
      headers,
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Obtém detalhes de um pedido
   */
  async getOrder(paypalOrderId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/v2/checkout/orders/${paypalOrderId}`;
    const headers = await this.getAuthHeaders();
    return await this.http.request(url, {
      method: "GET",
      headers,
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa uma captura específica
   */
  async refundCapture(captureId: string, payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/v2/payments/captures/${captureId}/refund`;
    const headers = await this.getAuthHeaders();
    return await this.http.request(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }
}
