import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateChargePayload } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.credentials.apiKey}`,
    };
  }

  /**
   * Valida credenciais.
   */
  async ping(): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/charges?limit=1`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma cobrança.
   * POST /charges
   */
  async createCharge(payload: CreateChargePayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/charges`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Obtém detalhes de uma cobrança.
   * GET /charges/{id}
   */
  async getCharge(chargeId: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/charges/${chargeId}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa/estorna uma cobrança.
   * POST /charges/{id}/refund
   */
  async refundCharge(chargeId: string, amount?: number): Promise<Response> {
    const body = amount ? JSON.stringify({ amount }) : "{}";
    return await this.http.request(`${this.getBaseUrl()}/charges/${chargeId}/refund`, {
      method: "POST",
      headers: this.getHeaders(),
      body,
      timeoutMs: config.timeoutMs,
    });
  }
}
