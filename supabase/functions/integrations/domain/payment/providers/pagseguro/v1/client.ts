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
    return {
      "Authorization": `Bearer ${this.credentials.token}`,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds Integration Client v1.0",
    };
  }

  /**
   * Faz uma chamada real de ping/teste de conexão na API
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/v2/sessions`;
    return await this.http.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        email: this.credentials.email,
        token: this.credentials.token,
      }).toString(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria um pedido de pagamento no PagSeguro
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
   * Obtém detalhes de um pedido no PagSeguro
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
