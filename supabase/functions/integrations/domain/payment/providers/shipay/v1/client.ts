import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials } from "./types.ts";

export class Client {
  private accessToken: string | null = null;
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
      "Authorization": `Bearer ${this.accessToken || ""}`,
    };
  }

  async authenticate(): Promise<void> {
    const res = await this.http.request(`${this.getBaseUrl()}/pdv/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: this.creds.accessKey,
        secret_key: this.creds.secretKey,
        client_id: this.creds.clientId,
      }),
      timeoutMs: config.timeoutMs,
    });
    const body = await res.json();
    this.accessToken = body.access_token;
  }

  async createPixOrder(payload: any): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/pdv/order`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  async getOrder(orderId: string): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/pdv/order/${orderId}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  async refundOrder(orderId: string, amount: number): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/pdv/order/${orderId}/refund`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ amount }),
      timeoutMs: config.timeoutMs,
    });
  }
}
