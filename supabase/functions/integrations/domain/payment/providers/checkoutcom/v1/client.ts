import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreatePaymentPayload } from "./types.ts";

export class Client {
  constructor(private http: HttpClientInterface, private creds: Credentials, private isTestMode: boolean) {}
  private getBaseUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getHeaders(): HeadersInit { return { "Content-Type": "application/json", "Authorization": `Bearer ${this.creds.secretKey}` }; }

  async createPayment(payload: CreatePaymentPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments`, { method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload), timeoutMs: config.timeoutMs });
  }
  async getPayment(id: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/${id}`, { method: "GET", headers: this.getHeaders(), timeoutMs: config.timeoutMs });
  }
  async refundPayment(id: string, amount: number): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/${id}/refunds`, { method: "POST", headers: this.getHeaders(), body: JSON.stringify({ amount }), timeoutMs: config.timeoutMs });
  }
}
