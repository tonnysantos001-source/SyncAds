import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateTransactionPayload } from "./types.ts";

export class Client {
  constructor(private http: HttpClientInterface, private creds: Credentials, private isTestMode: boolean) {}

  private getBaseUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getAuth() { return `Basic ${btoa(`${this.creds.publicKey}:${this.creds.privateKey}`)}`; }
  private getHeaders(): HeadersInit {
    return { "Content-Type": "application/json", "Authorization": this.getAuth(), "Braintree-Version": "2019-01-01" };
  }

  async createTransaction(payload: CreateTransactionPayload): Promise<Response> {
    return await this.http.request(
      `${this.getBaseUrl()}/merchants/${this.creds.merchantId}/transactions`,
      { method: "POST", headers: this.getHeaders(), body: JSON.stringify({ transaction: payload }), timeoutMs: config.timeoutMs }
    );
  }

  async getTransaction(id: string): Promise<Response> {
    return await this.http.request(
      `${this.getBaseUrl()}/merchants/${this.creds.merchantId}/transactions/${id}`,
      { method: "GET", headers: this.getHeaders(), timeoutMs: config.timeoutMs }
    );
  }

  async refundTransaction(id: string, amount?: number): Promise<Response> {
    const body = amount ? JSON.stringify({ transaction: { amount: amount.toFixed(2) } }) : "{}";
    return await this.http.request(
      `${this.getBaseUrl()}/merchants/${this.creds.merchantId}/transactions/${id}/refunds`,
      { method: "POST", headers: this.getHeaders(), body, timeoutMs: config.timeoutMs }
    );
  }
}
