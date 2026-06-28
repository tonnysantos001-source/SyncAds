import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateTransactionPayload } from "./types.ts";

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
      "Authorization": `Bearer ${this.credentials.token}`,
    };
  }

  /**
   * Verifica credenciais.
   */
  async ping(): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/v1/transactions`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria transação na Rede.
   * POST /v1/transactions
   */
  async createTransaction(payload: CreateTransactionPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/v1/transactions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta transação.
   * GET /v1/transactions/{tid}
   */
  async getTransaction(tid: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/v1/transactions/${tid}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa/cancela transação.
   * POST /v1/transactions/{tid}/refunds
   */
  async refundTransaction(tid: string, amount?: number): Promise<Response> {
    const body = amount ? JSON.stringify({ amount }) : "{}";
    return await this.http.request(`${this.getBaseUrl()}/v1/transactions/${tid}/refunds`, {
      method: "POST",
      headers: this.getHeaders(),
      body,
      timeoutMs: config.timeoutMs,
    });
  }
}
