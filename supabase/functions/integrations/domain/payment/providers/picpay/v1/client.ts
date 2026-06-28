import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreatePaymentPayload } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "x-picpay-token": this.credentials.picpayToken,
      "x-seller-token": this.credentials.sellerToken,
    };
  }

  /**
   * Verifica credenciais enviando um pagamento de teste ou validando a API.
   */
  async ping(): Promise<Response> {
    const testPayload: CreatePaymentPayload = {
      referenceId: `ping_${Date.now()}`,
      callbackUrl: "https://syncads.com.br/webhook/picpay",
      value: 1.00,
      buyer: {
        firstName: "Sync",
        lastName: "Ads",
        document: "11122233344",
        email: "ping@syncads.com.br",
      },
    };

    return await this.http.request(`${this.getBaseUrl()}/payments`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(testPayload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria pagamento no PicPay.
   * POST /payments
   */
  async createPayment(payload: CreatePaymentPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta status de pagamento.
   * GET /payments/{id}/status
   */
  async getPayment(referenceId: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/payments/${referenceId}/status`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cancela/estorna pagamento.
   * POST /payments/{id}/cancellations
   */
  async refundPayment(referenceId: string, authorizationId?: string): Promise<Response> {
    const body = authorizationId ? JSON.stringify({ authorizationId }) : "{}";
    return await this.http.request(`${this.getBaseUrl()}/payments/${referenceId}/cancellations`, {
      method: "POST",
      headers: this.getHeaders(),
      body,
      timeoutMs: config.timeoutMs,
    });
  }
}
