import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, GalaxPayTransactionPayload } from "./types.ts";
export class Client {
  private accessToken: string | null = null;
  constructor(private http: HttpClientInterface, private creds: Credentials, private isTestMode: boolean) {}
  private getBaseUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getTokenUrl() { return this.isTestMode ? config.tokenEndpoint.sandbox : config.tokenEndpoint.production; }
  private getHeaders(): HeadersInit { return { "Content-Type": "application/json", "Authorization": `Bearer ${this.accessToken || ""}` }; }
  async authenticate(): Promise<void> {
    const res = await this.http.request(this.getTokenUrl(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ galaxId: this.creds.galaxId, galaxHash: this.creds.galaxHash, grant_type: "authorization_code" }), timeoutMs: config.timeoutMs });
    const body = await res.json();
    this.accessToken = body.access_token || body.token;
  }
  async createTransaction(payload: GalaxPayTransactionPayload): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/transactions`, { method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload), timeoutMs: config.timeoutMs });
  }
  async getTransaction(id: string): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/transactions?myId=${id}`, { method: "GET", headers: this.getHeaders(), timeoutMs: config.timeoutMs });
  }
  async cancelTransaction(id: string): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/transactions/${id}/cancel`, { method: "DELETE", headers: this.getHeaders(), timeoutMs: config.timeoutMs });
  }
}
