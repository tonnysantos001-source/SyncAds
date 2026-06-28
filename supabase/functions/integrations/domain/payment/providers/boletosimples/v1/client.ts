import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private creds: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl() {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.creds.accessToken}`,
      "User-Agent": this.creds.userAgent || "SyncAds Integration (suporte@syncads.com.br)",
    };
  }

  async createBoleto(payload: any): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/bank_billets`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ bank_billet: payload }),
      timeoutMs: config.timeoutMs,
    });
  }

  async getBoleto(id: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/bank_billets/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  async cancelBoleto(id: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/bank_billets/${id}/cancel`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: "{}",
      timeoutMs: config.timeoutMs,
    });
  }
}
