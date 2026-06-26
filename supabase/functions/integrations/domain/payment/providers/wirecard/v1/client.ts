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
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    const basicAuth = btoa(`${this.credentials.token}:${this.credentials.key}`);
    return {
      "Content-Type": "application/json",
      "Authorization": `Basic ${basicAuth}`,
    };
  }

  /**
   * Testa a conexão fazendo uma chamada à API de ordens
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/orders`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma Ordem no Wirecard
   */
  async createOrder(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/orders`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria um Pagamento para uma Ordem existente
   */
  async createPayment(orderId: string, payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/orders/${orderId}/payments`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta os detalhes de um pagamento no Wirecard
   */
  async getPayment(paymentId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments/${paymentId}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa um pagamento
   */
  async refundPayment(paymentId: string, payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments/${paymentId}/refunds`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }
}
