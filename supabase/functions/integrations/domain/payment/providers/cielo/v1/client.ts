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

  private getQueryUrl(): string {
    return this.isTestMode ? config.queryEndpoints.sandbox : config.queryEndpoints.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "MerchantId": this.credentials.merchantId,
      "MerchantKey": this.credentials.merchantKey,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds Integration Client v1.0",
    };
  }

  /**
   * Faz uma chamada real de ping/teste de conexão na API
   */
  async ping(): Promise<Response> {
    const url = `${this.getQueryUrl()}/1/sales/00000000-0000-0000-0000-000000000000`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma venda na Cielo
   */
  async createSale(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/1/sales`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta os detalhes de uma venda na Cielo
   */
  async getSale(paymentId: string): Promise<Response> {
    const url = `${this.getQueryUrl()}/1/sales/${paymentId}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
