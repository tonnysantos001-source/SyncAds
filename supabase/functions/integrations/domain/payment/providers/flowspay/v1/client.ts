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
    const token = btoa(`${this.credentials.clientId}:${this.credentials.clientSecret}`);
    return {
      "Content-Type": "application/json",
      "Authorization": `Basic ${token}`,
    };
  }

  /**
   * Valida a conexão com a API do Flowspay
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
   * Cria uma cobrança no Flowspay
   */
  async createPayment(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta os detalhes de um pagamento no Flowspay
   */
  async getPayment(transactionId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments/${transactionId}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
