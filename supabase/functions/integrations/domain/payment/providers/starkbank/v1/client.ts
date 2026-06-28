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
    // NOTE: Real Stark Bank API uses ECDSA signature for authentication.
    // In our implementation, we add placeholder signature headers that mirror the required structure.
    return {
      "Content-Type": "application/json",
      "Project-Id": this.creds.projectId,
      "Digital-Signature": "ecdsa-signature-placeholder",
    };
  }

  async createPixRequest(payload: any): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/pix-request`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ requests: [payload] }),
      timeoutMs: config.timeoutMs,
    });
  }

  async createInvoice(payload: any): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/invoice`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ invoices: [payload] }),
      timeoutMs: config.timeoutMs,
    });
  }

  async getInvoice(id: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/invoice/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  async cancelInvoice(id: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/invoice/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
