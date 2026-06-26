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
    return {
      "x-api-key": this.credentials.apiKey,
      "User-Agent": "AtivoB2B/1.0",
      "Content-Type": "application/json",
    };
  }

  /**
   * Pings Bynet using GET /api/user/transfers/summary to verify API key
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/api/user/transfers/summary`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Creates a transaction/charge
   */
  async createTransaction(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/api/user/transactions`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Retrieves transaction summary details
   */
  async getTransactionSummary(transactionId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/api/user/transactions/${transactionId}/summary`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}

