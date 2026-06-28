import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreatePaymentPayload } from "./types.ts";
export class Client {
  constructor(private http: HttpClientInterface, private creds: Credentials, private isTestMode: boolean) {}
  private getBaseUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getHeaders(): HeadersInit { return { "Content-Type": "application/json", "Authorization": `Bearer ${this.creds.accessToken}`, "Square-Version": "2024-01-18" }; }
  async createPayment(payload: CreatePaymentPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments`, { method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload), timeoutMs: config.timeoutMs });
  }
  async getPayment(id: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/${id}`, { method: "GET", headers: this.getHeaders(), timeoutMs: config.timeoutMs });
  }
  async refundPayment(paymentId: string, amountCents: number, idempotencyKey: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/refunds`, { method: "POST", headers: this.getHeaders(), body: JSON.stringify({ idempotency_key: idempotencyKey, payment_id: paymentId, amount_money: { amount: amountCents, currency: "BRL" } }), timeoutMs: config.timeoutMs });
  }
}
