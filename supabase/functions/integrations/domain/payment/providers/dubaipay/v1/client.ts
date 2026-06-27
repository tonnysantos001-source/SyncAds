import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreatePaymentPayload } from "./types.ts";

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
      "Authorization": `Bearer ${this.credentials.merchantId}`,
    };
  }

  /**
   * Verifica credenciais.
   */
  async ping(): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/health`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria pagamento.
   * POST /payments
   */
  async createPayment(payload: CreatePaymentPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Obtém detalhes de um pagamento.
   * GET /payments/{id}
   */
  async getPayment(paymentId: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/${paymentId}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa/estorna um pagamento.
   * POST /payments/{id}/refund
   */
  async refundPayment(paymentId: string, amount?: number): Promise<Response> {
    const body = amount ? JSON.stringify({ amount }) : "{}";
    return await this.http.request(`${this.getBaseUrl()}/payments/${paymentId}/refund`, {
      method: "POST",
      headers: this.getHeaders(),
      body,
      timeoutMs: config.timeoutMs,
    });
  }
}
