import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateLinkPayload, PaymentCheckPayload } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  /**
   * Gera o header de autenticação Basic Auth com clientId:clientSecret
   */
  private getAuthHeader(): string {
    const encoded = btoa(`${this.credentials.clientId}:${this.credentials.clientSecret}`);
    return `Basic ${encoded}`;
  }

  /**
   * Headers padrão para todas as requisições
   */
  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": this.getAuthHeader(),
    };
  }

  /**
   * Verifica conectividade realizando um payment_check com NSU fictício.
   * A InfinitePay retorna 400/404 para NSU inválido (credenciais OK)
   * e 401 para credenciais inválidas.
   */
  async ping(): Promise<Response> {
    const payload: PaymentCheckPayload = {
      order_nsu: "PING_TEST_0000",
      handle: this.credentials.handle,
    };
    return await this.http.request(config.endpoints.paymentCheck, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria um link de pagamento via Checkout Integrado InfinitePay.
   * Suporta: Pix e Cartão de Crédito (até 12x).
   * Endpoint: POST https://api.checkout.infinitepay.io/links
   */
  async createPaymentLink(payload: CreateLinkPayload): Promise<Response> {
    return await this.http.request(config.endpoints.createLink, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta o status de um pagamento via order_nsu.
   * Endpoint: POST https://api.checkout.infinitepay.io/payment_check
   */
  async checkPaymentStatus(orderNsu: string): Promise<Response> {
    const payload: PaymentCheckPayload = {
      order_nsu: orderNsu,
      handle: this.credentials.handle,
    };
    return await this.http.request(config.endpoints.paymentCheck, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }
}
