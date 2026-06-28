import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, JunoChargePayload } from "./types.ts";
export class Client {
  private accessToken: string | null = null;
  constructor(private http: HttpClientInterface, private creds: Credentials, private isTestMode: boolean) {}
  private getBaseUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getAuthUrl() { return this.isTestMode ? "https://sandbox.boletobancario.com/authorization-server/oauth/token" : "https://api.juno.com.br/authorization-server/oauth/token"; }
  private getHeaders(): HeadersInit {
    return { "Content-Type": "application/json", "Authorization": `Bearer ${this.accessToken || ""}`, "X-Api-Version": "2", "X-Resource-Token": this.creds.resourceToken };
  }
  async authenticate(): Promise<void> {
    const res = await this.http.request(this.getAuthUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": `Basic ${btoa(`${this.creds.clientId}:${this.creds.clientSecret}`)}` },
      body: "grant_type=client_credentials", timeoutMs: config.timeoutMs,
    });
    const body = await res.json();
    this.accessToken = body.access_token;
  }
  async createCharge(payload: JunoChargePayload): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/charges`, { method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload), timeoutMs: config.timeoutMs });
  }
  async getCharge(id: string): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/charges/${id}`, { method: "GET", headers: this.getHeaders(), timeoutMs: config.timeoutMs });
  }
  async cancelCharge(id: string): Promise<Response> {
    if (!this.accessToken) await this.authenticate();
    return await this.http.request(`${this.getBaseUrl()}/charges/${id}/cancelCharges`, { method: "PUT", headers: this.getHeaders(), body: "{}", timeoutMs: config.timeoutMs });
  }
}
