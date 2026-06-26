import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    // Mercado Pago usa a mesma URL de produção para testes
    return config.endpoints.production;
  }

  private getHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
    return {
      "Authorization": `Bearer ${this.credentials.accessToken}`,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds Payment Client v1.0",
      ...additionalHeaders,
    };
  }

  /**
   * Valida credenciais (AccessToken) consultando o endpoint /users/me
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/users/me`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria pagamento no Mercado Pago
   */
  async createPayment(payload: any, idempotencyKey?: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/v1/payments`;
    const headers = this.getHeaders(
      idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : undefined
    );

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
  async getPayment(id: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/v1/payments/${id}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cancela um pagamento pendente
   */
  async cancelPayment(id: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/v1/payments/${id}`;
    return await this.http.request(url, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ status: "cancelled" }),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Estorna/reembolsa um pagamento aprovado
   */
  async refundPayment(id: string, amount?: number): Promise<Response> {
    const url = `${this.getBaseUrl()}/v1/payments/${id}/refunds`;
    const body = amount ? JSON.stringify({ amount }) : undefined;

    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body,
      timeoutMs: config.timeoutMs,
    });
  }
}
