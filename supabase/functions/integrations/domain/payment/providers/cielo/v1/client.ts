import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateSalePayload } from "./types.ts";

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
    return this.isTestMode ? config.endpoints.sandboxQuery : config.endpoints.productionQuery;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "MerchantId": this.credentials.merchantId,
      "MerchantKey": this.credentials.merchantKey,
      "RequestId": crypto.randomUUID(),
    };
  }

  /**
   * Verifica credenciais realizando uma busca de transação inexistente.
   * Retorna 404 para credenciais válidas mas ID inexistente.
   * Retorna 401 para credenciais inválidas.
   */
  async ping(): Promise<Response> {
    return await this.http.request(`${this.getQueryUrl()}/1/sales/PING_TEST_ID_000`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma transação de venda (cartão de crédito, débito, boleto ou Pix)
   * POST /1/sales
   */
  async createSale(payload: CreateSalePayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/1/sales`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta uma transação pelo paymentId
   * GET /1/sales/{paymentId}
   */
  async querySale(paymentId: string): Promise<Response> {
    return await this.http.request(`${this.getQueryUrl()}/1/sales/${paymentId}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cancela/estorna uma transação pelo paymentId
   * PUT /1/sales/{paymentId}/void
   */
  async voidSale(paymentId: string, amount?: number): Promise<Response> {
    const queryParam = amount ? `?amount=${Math.round(amount * 100)}` : "";
    return await this.http.request(`${this.getBaseUrl()}/1/sales/${paymentId}/void${queryParam}`, {
      method: "PUT",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
