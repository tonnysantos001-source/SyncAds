import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, ZoopTransactionPayload } from "./types.ts";
export class Client {
  constructor(private http: HttpClientInterface, private creds: Credentials, private isTestMode: boolean) {}
  private getBaseUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getHeaders(): HeadersInit { return { "Content-Type": "application/json", "Authorization": `Basic ${btoa(this.creds.publishableKey + ":")}` }; }
  async createTransaction(payload: ZoopTransactionPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/marketplaces/${this.creds.marketplaceId}/transactions`, { method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload), timeoutMs: config.timeoutMs });
  }
  async getTransaction(id: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/marketplaces/${this.creds.marketplaceId}/transactions/${id}`, { method: "GET", headers: this.getHeaders(), timeoutMs: config.timeoutMs });
  }
  async voidTransaction(id: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/marketplaces/${this.creds.marketplaceId}/transactions/${id}/void`, { method: "POST", headers: this.getHeaders(), body: "{}", timeoutMs: config.timeoutMs });
  }
}
