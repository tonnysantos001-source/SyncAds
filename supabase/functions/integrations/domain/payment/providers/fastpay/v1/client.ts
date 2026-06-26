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
    // Basic Auth: btoa("API_KEY:")
    const apiKey = this.credentials.apiKey || "";
    const authString = `${apiKey}:`;
    const base64Auth = btoa(authString);

    return {
      "Authorization": `Basic ${base64Auth}`,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds AI Integration Client (Fast Pay v1)",
    };
  }

  /**
   * Faz teste de conexão (ping) consultando a lista de cobranças
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/charges?limit=1`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma transação (Pix, Boleto ou Cartão)
   */
  async createTransaction(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/charges`;
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
    const url = `${this.getBaseUrl()}/charges/${transactionId}`;
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
    const url = `${this.getBaseUrl()}/charges/${transactionId}/refund`;
    const payload = amount ? { amount } : {};

    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }
}
