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
      "Content-Type": "application/json",
      "X-API-Key": this.credentials.apiKey,
    };
  }

  async ping(): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/health`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  async createPayment(payload: any): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  async getPayment(transactionId: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/${transactionId}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
