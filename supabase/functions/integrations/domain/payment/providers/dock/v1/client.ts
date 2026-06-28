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
    const res = await this.http.request(`${this.getBaseUrl()}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.creds.clientId,
        client_secret: this.creds.clientSecret,
      }),
      timeoutMs: config.timeoutMs,
    });
    const body = await res.json();
    this.accessToken = body.access_token || body.token;
  }

  async createPayment(payload: any): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/payments`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  async getPayment(id: string): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/payments/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  async refundPayment(id: string, amount: number): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/payments/${id}/refund`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ amount }),
      timeoutMs: config.timeoutMs,
    });
  }
}
