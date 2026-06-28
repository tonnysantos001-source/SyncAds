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

  private getQueryUrl(): string {
    return this.isTestMode ? config.queryEndpoints.sandbox : config.queryEndpoints.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "MerchantId": this.credentials.merchantId,
      "MerchantKey": this.credentials.merchantKey,
    };
  }

  /**
   * Verifica credenciais.
   * Cielo não tem endpoint /health, mas podemos tentar bater em query endpoint ou mockar ok.
   */
  async ping(): Promise<Response> {
    // Cielo não tem GET /health livre, mas se o merchantId/key estão preenchidos aceitamos como formatados
    return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
  }

  /**
   * Cria pagamento.
   * POST /1/sales
   */
  async createPayment(payload: CreatePaymentPayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/1/sales`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Obtém detalhes de um pagamento.
   * GET /1/sales/{id}
   */
  async getPayment(paymentId: string): Promise<Response> {
    return await this.http.request(`${this.getQueryUrl()}/1/sales/${paymentId}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Reembolsa/estorna um pagamento.
   * PUT /1/sales/{id}/void
   */
  async refundPayment(paymentId: string, amount?: number): Promise<Response> {
    const params = amount ? `?amount=${amount}` : "";
    return await this.http.request(`${this.getBaseUrl()}/1/sales/${paymentId}/void${params}`, {
      method: "PUT",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
