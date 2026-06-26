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
    const credString = `${this.credentials.clientId}:${this.credentials.clientSecret}`;
    const base64Auth = btoa(credString);

    return {
      "Authorization": `Basic ${base64Auth}`,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds AI Integration Client (Efí v1)",
    };
  }

  /**
   * Faz teste de conexão (ping) consultando o status da API
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/health`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma transação
   */
  async createTransaction(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta o status de uma transação
   */
  async getTransaction(transactionId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments/${transactionId}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Estorna uma transação
   */
  async refundTransaction(transactionId: string, amount?: number): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments/${transactionId}/refund`;
    const payload = amount ? { amount } : {};

    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }
}
