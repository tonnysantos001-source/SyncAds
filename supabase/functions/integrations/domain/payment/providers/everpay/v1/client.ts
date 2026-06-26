import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.credentials.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds Integration Client v1.0",
    };
    if (this.credentials.accountId) {
      headers["X-Everpay-Api-Key"] = this.credentials.accountId;
    }
    return headers;
  }

  /**
   * Pings the API by retrieving the payments list with limit=1 to verify authentication.
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments?limit=1`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Creates a payment
   */
  async createPayment(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Tokenizes a card
   */
  async tokenizeCard(payload: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
    name: string;
  }): Promise<Response> {
    const url = `${this.getBaseUrl()}/tokens`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ card: payload }),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Retrieves a payment details
   */
  async getPayment(paymentId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments/${paymentId}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Refunds a payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments/${paymentId}/refund`;
    const body: Record<string, any> = {};
    if (amount !== undefined) {
      body.amount = amount;
    }
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      timeoutMs: config.timeoutMs,
    });
  }
}

