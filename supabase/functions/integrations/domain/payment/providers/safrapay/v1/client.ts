import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreatePaymentPayload, OAuthTokenResponse } from "./types.ts";

export class Client {
  private accessToken: string | null = null;

  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  private getOAuthUrl(): string {
    return this.isTestMode ? config.endpoints.oauthSandbox : config.endpoints.oauthProduction;
  }

  /**
   * Obtém access_token via OAuth 2.0 Client Credentials Grant
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    const encoded = btoa(`${this.credentials.clientId}:${this.credentials.clientSecret}`);
    const res = await this.http.request(this.getOAuthUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${encoded}`,
      },
      body: "grant_type=client_credentials",
      timeoutMs: config.timeoutMs,
    });

    if (!res.ok) {
      throw new Error(`SafraPay OAuth falhou (${res.status}): Credenciais inválidas.`);
    }

    const data: OAuthTokenResponse = await res.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  }

  /**
   * Health check — tenta obter token OAuth. Erro = credenciais inválidas.
   */
  async ping(): Promise<Response> {
    const encoded = btoa(`${this.credentials.clientId}:${this.credentials.clientSecret}`);
    return await this.http.request(this.getOAuthUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${encoded}`,
      },
      body: "grant_type=client_credentials",
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria um pagamento (cartão de crédito, débito ou PIX)
   */
  async createPayment(payload: CreatePaymentPayload): Promise<Response> {
    const headers = await this.getAuthHeaders();
    return await this.http.request(`${this.getBaseUrl()}/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta um pagamento pelo ID
   */
  async getPayment(paymentId: string): Promise<Response> {
    const headers = await this.getAuthHeaders();
    return await this.http.request(`${this.getBaseUrl()}/payments/${paymentId}`, {
      method: "GET",
      headers,
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cancela/estorna um pagamento
   */
  async cancelPayment(paymentId: string, amount?: number): Promise<Response> {
    const headers = await this.getAuthHeaders();
    return await this.http.request(`${this.getBaseUrl()}/payments/${paymentId}/cancel`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount }),
      timeoutMs: config.timeoutMs,
    });
  }
}
