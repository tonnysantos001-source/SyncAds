import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, PayUTransactionRequest } from "./types.ts";
export class Client {
  constructor(private http: HttpClientInterface, private creds: Credentials, private isTestMode: boolean) {}
  private getUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getHeaders(): HeadersInit { return { "Content-Type": "application/json", "Accept": "application/json" }; }
  async submitTransaction(payload: PayUTransactionRequest): Promise<Response> {
    return await this.http.request(this.getUrl(), { method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload), timeoutMs: config.timeoutMs });
  }
  async getOrderDetail(orderId: string): Promise<Response> {
    const body = { language: "pt", command: "ORDER_DETAIL", merchant: { apiKey: this.creds.apiKey, apiLogin: this.creds.apiLogin }, details: { orderId }, test: this.isTestMode };
    return await this.http.request(this.getUrl(), { method: "POST", headers: this.getHeaders(), body: JSON.stringify(body), timeoutMs: config.timeoutMs });
  }
  async refund(transactionId: string, orderId: string, amount: number): Promise<Response> {
    const body = { language: "pt", command: "SUBMIT_TRANSACTION", merchant: { apiKey: this.creds.apiKey, apiLogin: this.creds.apiLogin }, transaction: { order: { id: orderId }, type: "REFUND", parentTransactionId: transactionId, reason: "Reembolso SyncAds" }, test: this.isTestMode };
    return await this.http.request(this.getUrl(), { method: "POST", headers: this.getHeaders(), body: JSON.stringify(body), timeoutMs: config.timeoutMs });
  }
}
