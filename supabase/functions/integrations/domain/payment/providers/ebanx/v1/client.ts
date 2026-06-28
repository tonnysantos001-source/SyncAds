import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, EBANXPaymentPayload } from "./types.ts";
export class Client {
  constructor(private http: HttpClientInterface, private creds: Credentials, private isTestMode: boolean) {}
  private getBaseUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getHeaders(): HeadersInit { return { "Content-Type": "application/json" }; }
  async createPayment(payload: EBANXPaymentPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/direct`, { method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload), timeoutMs: config.timeoutMs });
  }
  async queryPayment(hash: string): Promise<Response> {
    const qs = `?integration_key=${this.creds.integrationKey}&hash=${hash}`;
    return await this.http.request(`${this.getBaseUrl()}/query${qs}`, { method: "GET", headers: this.getHeaders(), timeoutMs: config.timeoutMs });
  }
  async cancelPayment(hash: string, amount: number): Promise<Response> {
    const body = JSON.stringify({ integration_key: this.creds.integrationKey, hash, amount, description: "Reembolso SyncAds" });
    return await this.http.request(`${this.getBaseUrl()}/refund`, { method: "POST", headers: this.getHeaders(), body, timeoutMs: config.timeoutMs });
  }
}
