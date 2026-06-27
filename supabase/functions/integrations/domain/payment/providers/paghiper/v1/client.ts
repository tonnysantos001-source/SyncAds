import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateTransactionPayload } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private _isTestMode: boolean
  ) {}

  // PagHiper não separa autenticação em header —
  // apiKey e token são enviados no corpo JSON de cada request
  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }

  private buildBaseBody(): { apiKey: string; token: string } {
    return {
      apiKey: this.credentials.apiKey,
      token: this.credentials.token,
    };
  }

  /**
   * Verifica conectividade com a API. Usa consulta de status com ID fictício.
   * PagHiper retorna 200 com result="error" para IDs inválidos (credenciais OK).
   * Retorna 401 apenas se apiKey/token forem inválidos.
   */
  async ping(): Promise<Response> {
    const body = {
      ...this.buildBaseBody(),
      transaction_id: "PING_TEST_000",
    };
    return await this.http.request(config.endpoints.getStatus, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria um boleto bancário (com QR PIX opcional — "Boleto Híbrido").
   * POST https://api.paghiper.com/transaction/create/
   */
  async createBoleto(payload: CreateTransactionPayload): Promise<Response> {
    return await this.http.request(config.endpoints.createTransaction, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria um PIX via endpoint dedicado.
   * POST https://pix.paghiper.com/invoice/create/
   */
  async createPix(payload: CreateTransactionPayload): Promise<Response> {
    return await this.http.request(config.endpoints.createPix, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta o status de uma transação pelo transaction_id.
   * POST https://api.paghiper.com/transaction/status/
   */
  async getStatus(transactionId: string): Promise<Response> {
    const body = {
      ...this.buildBaseBody(),
      transaction_id: transactionId,
    };
    return await this.http.request(config.endpoints.getStatus, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cancela uma transação pelo transaction_id.
   * POST https://api.paghiper.com/transaction/cancel/
   */
  async cancelTransaction(transactionId: string): Promise<Response> {
    const body = {
      ...this.buildBaseBody(),
      transaction_id: transactionId,
      status: "canceled",
    };
    return await this.http.request(config.endpoints.cancelTransaction, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      timeoutMs: config.timeoutMs,
    });
  }
}
