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
    const res = await this.http.request(`${this.getBaseUrl()}/v5/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `client_id=${this.creds.clientId}&client_secret=${this.creds.clientSecret}&grant_type=client_credentials`,
      timeoutMs: config.timeoutMs,
    });
    const body = await res.json();
    this.accessToken = body.access_token;
  }

  async createPixPayment(payload: any): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/v5/transactions/pix/payment`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  async getTransaction(transactionId: string): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/v5/transactions/${transactionId}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  async refundTransaction(transactionId: string, amount: number): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/v5/transactions/${transactionId}/refund`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ amount }),
      timeoutMs: config.timeoutMs,
    });
  }
}
