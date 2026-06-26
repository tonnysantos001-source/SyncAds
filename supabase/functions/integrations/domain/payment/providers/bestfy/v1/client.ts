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
    // Basic Auth: btoa("token:x")
    const token = this.credentials.token || "";
    const authString = `${token}:x`;
    const base64Auth = btoa(authString);

    return {
      "Authorization": `Basic ${base64Auth}`,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds AI Integration Client (Bestfy v1)",
    };
  }

  /**
   * Faz teste de conexão (ping) consultando o saldo disponível
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/balance/available`;
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
    const url = `${this.getBaseUrl()}/transactions`;
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
    const url = `${this.getBaseUrl()}/transactions/${transactionId}`;
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
    const url = `${this.getBaseUrl()}/transactions/${transactionId}/refund`;
    const payload = amount ? { amount: Math.round(amount * 100) } : {};

    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }
}
