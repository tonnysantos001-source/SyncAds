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
    const auth = btoa(`${this.credentials.publicKey}:${this.credentials.secretKey}`);
    return {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
    };
  }

  /**
   * Valida a conexão com a API do Pague-X
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/transactions?limit=1`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma transação/pagamento no Pague-X
   */
  async createTransaction(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/transactions`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta os detalhes de uma transação no Pague-X
   */
  async getTransaction(transactionId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/transactions/${transactionId}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
