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
    const credString = `${this.credentials.publicKey}:${this.credentials.secretKey}`;
    const base64Cred = btoa(credString);
    return {
      "Content-Type": "application/json",
      "Authorization": `Basic ${base64Cred}`,
    };
  }

  /**
   * Verifica credenciais.
   * GET /transactions?limit=1
   */
  async ping(): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/transactions?limit=1`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria pagamento.
   * POST /transactions
   */
  async createPayment(payload: CreatePaymentPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/transactions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Obtém detalhes de um pagamento.
   * GET /transactions/{id}
   */
  async getPayment(paymentId: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/transactions/${paymentId}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa/estorna um pagamento.
   * POST /transactions/{id}/refund
   */
  async refundPayment(paymentId: string, amount?: number): Promise<Response> {
    const body = amount ? JSON.stringify({ amount }) : "{}";
    return await this.http.request(`${this.getBaseUrl()}/transactions/${paymentId}/refund`, {
      method: "POST",
      headers: this.getHeaders(),
      body,
      timeoutMs: config.timeoutMs,
    });
  }
}
