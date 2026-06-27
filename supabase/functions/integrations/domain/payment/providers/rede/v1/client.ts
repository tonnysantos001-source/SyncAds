import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateTransactionPayload, OAuthTokenResponse } from "./types.ts";

export class Client {
  private accessToken: string | null = null;

  constructor(private http: HttpClientInterface, private credentials: Credentials, private isTestMode: boolean) {}

  private getBaseUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getOAuthUrl() { return this.isTestMode ? config.endpoints.oauthSandbox : config.endpoints.oauthProduction; }

  async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    const encoded = btoa(`${this.credentials.clientId}:${this.credentials.clientSecret}`);
    const res = await this.http.request(this.getOAuthUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": `Basic ${encoded}` },
      body: "grant_type=client_credentials",
      timeoutMs: config.timeoutMs,
    });
    if (!res.ok) throw new Error(`Rede OAuth falhou (${res.status})`);
    const data: OAuthTokenResponse = await res.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  private async authHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();
    return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
  }

  async ping(): Promise<Response> {
    const encoded = btoa(`${this.credentials.clientId}:${this.credentials.clientSecret}`);
    return this.http.request(this.getOAuthUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": `Basic ${encoded}` },
      body: "grant_type=client_credentials",
      timeoutMs: config.timeoutMs,
    });
  }

  async createTransaction(payload: CreateTransactionPayload): Promise<Response> {
    const headers = await this.authHeaders();
    return this.http.request(`${this.getBaseUrl()}/transactions`, {
      method: "POST", headers, body: JSON.stringify(payload), timeoutMs: config.timeoutMs,
    });
  }

  async getTransaction(tid: string): Promise<Response> {
    const headers = await this.authHeaders();
    return this.http.request(`${this.getBaseUrl()}/transactions/${tid}`, {
      method: "GET", headers, timeoutMs: config.timeoutMs,
    });
  }

  async cancelTransaction(tid: string, amount: number): Promise<Response> {
    const headers = await this.authHeaders();
    return this.http.request(`${this.getBaseUrl()}/transactions/${tid}/cancels`, {
      method: "POST", headers, body: JSON.stringify({ amount }), timeoutMs: config.timeoutMs,
    });
  }
}
