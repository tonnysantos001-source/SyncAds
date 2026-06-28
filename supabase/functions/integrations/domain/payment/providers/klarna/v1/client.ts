import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateSessionPayload } from "./types.ts";
export class Client {
  constructor(private http: HttpClientInterface, private creds: Credentials, private isTestMode: boolean) {}
  private getBaseUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getHeaders(): HeadersInit { return { "Content-Type": "application/json", "Authorization": `Basic ${btoa(`${this.creds.username}:${this.creds.password}`)}` }; }
  async createSession(payload: CreateSessionPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/v1/sessions`, { method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload), timeoutMs: config.timeoutMs });
  }
  async createOrder(authorizationToken: string, payload: any): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/v1/authorizations/${authorizationToken}/order`, { method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload), timeoutMs: config.timeoutMs });
  }
  async getOrder(orderId: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/ordermanagement/v1/orders/${orderId}`, { method: "GET", headers: this.getHeaders(), timeoutMs: config.timeoutMs });
  }
  async refundOrder(orderId: string, amount: number): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/ordermanagement/v1/orders/${orderId}/refunds`, { method: "POST", headers: this.getHeaders(), body: JSON.stringify({ refunded_amount: amount }), timeoutMs: config.timeoutMs });
  }
}
