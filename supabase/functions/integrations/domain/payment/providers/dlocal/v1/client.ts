import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreatePaymentPayload } from "./types.ts";
export class Client {
  constructor(private http: HttpClientInterface, private creds: Credentials, private isTestMode: boolean) {}
  private getBaseUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getHeaders(body: string): HeadersInit {
    const date = new Date().toISOString();
    const toSign = this.creds.xLogin + this.creds.xTransKey + date + body;
    // NOTE: real HMAC-SHA256 would be computed here. Using placeholder for structure.
    return { "Content-Type": "application/json", "X-Date": date, "X-Login": this.creds.xLogin, "X-Trans-Key": this.creds.xTransKey, "Authorization": `V2-HMAC-SHA256, Signature=placeholder` };
  }
  async createPayment(payload: CreatePaymentPayload): Promise<Response> {
    const body = JSON.stringify(payload);
    return await this.http.request(`${this.getBaseUrl()}/payments`, { method: "POST", headers: this.getHeaders(body), body, timeoutMs: config.timeoutMs });
  }
  async getPayment(id: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/${id}`, { method: "GET", headers: this.getHeaders(""), timeoutMs: config.timeoutMs });
  }
  async refundPayment(id: string, amount: number): Promise<Response> {
    const body = JSON.stringify({ amount, currency: "BRL" });
    return await this.http.request(`${this.getBaseUrl()}/payments/${id}/cancel`, { method: "POST", headers: this.getHeaders(body), body, timeoutMs: config.timeoutMs });
  }
}
