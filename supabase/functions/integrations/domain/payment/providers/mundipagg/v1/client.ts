import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, TransactionPayload } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private creds: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl() {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  async createTransaction(payload: TransactionPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.creds.secretKey || ""}`
      },
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs
    });
  }

  async getTransaction(id: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.creds.secretKey || ""}`
      },
      timeoutMs: config.timeoutMs
    });
  }

  async cancelTransaction(id: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/${id}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.creds.secretKey || ""}`
      },
      timeoutMs: config.timeoutMs
    });
  }
}
