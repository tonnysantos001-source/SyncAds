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
   * Faz uma chamada real de ping/teste de conexão na API enviando uma cobrança de teste
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments`;
    const testPayment = {
      referenceId: `test_${Date.now()}`,
      callbackUrl: "https://example.com/callback",
      value: 1.00,
      buyer: {
        firstName: "Test",
        lastName: "User",
        document: "12345678901",
        email: "test@example.com",
        phone: "+5511999999999",
      },
    };
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(testPayment),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria cobrança no PicPay
   */
  async createPayment(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta o status de um pagamento no PicPay
   */
  async getPaymentStatus(referenceId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments/${referenceId}/status`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cancela/estorna um pagamento no PicPay
   */
  async cancelPayment(referenceId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments/${referenceId}/cancellations`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        authorizationId: referenceId,
      }),
      timeoutMs: config.timeoutMs,
    });
  }
}
