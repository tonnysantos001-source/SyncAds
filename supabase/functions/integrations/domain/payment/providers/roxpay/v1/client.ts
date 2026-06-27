import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateChargePayload, TokenResponse } from "./types.ts";

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
   * Obtém access_token OAuth 2.0 Client Credentials Grant
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    const payload = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.credentials.clientId,
      client_secret: this.credentials.clientSecret,
    });

    const res = await this.http.request(this.getOAuthUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
      timeoutMs: config.timeoutMs,
    });

    if (!res.ok) {
      throw new Error(`RoxPay OAuth falhou (${res.status}): Credenciais inválidas.`);
    }

    const data: TokenResponse = await res.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    if (this.credentials.companyId) {
      headers["X-Company-ID"] = this.credentials.companyId;
    }

    return headers;
  }

  /**
   * Health check - tenta obter token OAuth. Erro = credenciais inválidas.
   */
  async ping(): Promise<Response> {
    const payload = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.credentials.clientId,
      client_secret: this.credentials.clientSecret,
    });
    return await this.http.request(this.getOAuthUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma transação/cobrança (Pix, Cartão de Crédito ou Boleto)
   * POST /charges
   */
  async createCharge(payload: CreateChargePayload): Promise<Response> {
    const headers = await this.getAuthHeaders();
    return await this.http.request(`${this.getBaseUrl()}/charges`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta uma cobrança pelo ID
   * GET /charges/{id}
   */
  async getCharge(chargeId: string): Promise<Response> {
    const headers = await this.getAuthHeaders();
    return await this.http.request(`${this.getBaseUrl()}/charges/${chargeId}`, {
      method: "GET",
      headers,
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa/estorna uma cobrança pelo ID
   * POST /charges/{id}/refund
   */
  async refundCharge(chargeId: string, amount?: number): Promise<Response> {
    const headers = await this.getAuthHeaders();
    const body = amount ? JSON.stringify({ amount }) : "{}";
    return await this.http.request(`${this.getBaseUrl()}/charges/${chargeId}/refund`, {
      method: "POST",
      headers,
      body,
      timeoutMs: config.timeoutMs,
    });
  }
}
