import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreatePaymentPayload } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl() {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "X-API-Key": this.credentials.apiKey,
    };
  }

  async createPayment(payload: CreatePaymentPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  async getPayment(pspReference: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/${pspReference}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  async refundPayment(pspReference: string, amount: number, currency: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/${pspReference}/refunds`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ amount: { value: amount, currency }, merchantAccount: this.credentials.merchantAccount }),
      timeoutMs: config.timeoutMs,
    });
  }
}
