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
    return config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    const auth = btoa(`${this.credentials.apiKey}:`);
    return {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds Integration Client v1.0",
    };
  }

  /**
   * Faz uma chamada real de ping/teste de conexão na API
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/customers?page=1&size=1`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria um pedido com pagamento
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
   * Obtém os detalhes de um pedido
   */
  async getOrder(orderId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/orders/${orderId}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
