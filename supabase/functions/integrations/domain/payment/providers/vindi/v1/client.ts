import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, VindiCustomer, PaymentProfilePayload, CreateBillPayload } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  /**
   * Vindi usa Basic Auth: Base64(API_KEY:) — a senha é vazia
   */
  private getHeaders(): HeadersInit {
    const encoded = btoa(`${this.credentials.apiKey}:`);
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Basic ${encoded}`,
    };
  }

  /** Verifica conectividade com GET /payment_methods */
  async ping(): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payment_methods`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /** Cria um cliente na Vindi — necessário antes de criar cobrança */
  async createCustomer(customer: VindiCustomer): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/customers`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ customer }),
      timeoutMs: config.timeoutMs,
    });
  }

  /** Cria um perfil de pagamento (tokeniza cartão) */
  async createPaymentProfile(profile: PaymentProfilePayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payment_profiles`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ payment_profile: profile }),
      timeoutMs: config.timeoutMs,
    });
  }

  /** Cria uma fatura/cobrança */
  async createBill(bill: CreateBillPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/bills`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ bill }),
      timeoutMs: config.timeoutMs,
    });
  }

  /** Consulta uma fatura pelo ID */
  async getBill(billId: number): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/bills/${billId}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /** Cancela uma fatura */
  async cancelBill(billId: number): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/bills/${billId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
