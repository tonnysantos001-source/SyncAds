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
    return config.endpoints.production; // Iugu usa a mesma URL para sandbox/produção
  }

  private getHeaders(): HeadersInit {
    const apiToken = this.credentials.apiToken || "";

    return {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds AI Integration Client (Iugu v1)",
    };
  }

  /**
   * Faz teste de conexão (ping)
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/accounts`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria um cliente
   */
  async createCustomer(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/customers`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma fatura (Invoice) para Pix ou Boleto
   */
  async createInvoice(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/invoices`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta uma fatura
   */
  async getInvoice(invoiceId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/invoices/${invoiceId}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa uma fatura
   */
  async refundInvoice(invoiceId: string, amount?: number): Promise<Response> {
    const url = `${this.getBaseUrl()}/invoices/${invoiceId}/refund`;
    const payload = amount ? { amount_cents: Math.round(amount * 100) } : {};

    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria um token de cartão
   */
  async createPaymentToken(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/payment_token`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Processa cobrança direta (Cartão de Crédito)
   */
  async createCharge(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/charge`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }
}
