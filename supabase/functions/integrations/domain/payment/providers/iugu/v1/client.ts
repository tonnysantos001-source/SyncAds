import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, PaymentTokenPayload, InvoicePayload, ChargePayload } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    return config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.credentials.apiToken}`,
      "Accept": "application/json",
    };
  }

  /**
   * Verifica credenciais.
   */
  async ping(): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/accounts`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria cliente na Iugu.
   */
  async createCustomer(payload: any): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/customers`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria token temporário de cartão de crédito.
   */
  async createPaymentToken(payload: PaymentTokenPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payment_token`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Realiza uma cobrança (charge).
   */
  async charge(payload: ChargePayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/charge`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma fatura (invoice).
   */
  async createInvoice(payload: InvoicePayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/invoices`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Obtém detalhes de um pagamento (fatura).
   */
  async getPayment(paymentId: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/invoices/${paymentId}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa/estorna um pagamento.
   */
  async refundPayment(paymentId: string, amount?: number): Promise<Response> {
    const body = amount ? JSON.stringify({ amount_cents: Math.round(amount * 100) }) : "{}";
    return await this.http.request(`${this.getBaseUrl()}/invoices/${paymentId}/refund`, {
      method: "POST",
      headers: this.getHeaders(),
      body,
      timeoutMs: config.timeoutMs,
    });
  }
}
