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
      "Authorization": `Bearer ${this.credentials.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds Integration Client v1.0",
    };
  }

  /**
   * Teste de conexão (Ping)
   */
  async ping(): Promise<Response> {
    // A documentação oficial aponta que buscar o status das chaves ou uma rota básica serve como ping.
    // Vamos fazer um GET para /v2/transactions com limite de 1 para validar as credenciais.
    const url = `${this.getBaseUrl()}/v2/transactions?limit=1`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria transação de pagamento
   */
  async createTransaction(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/v2/transactions`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta transação pelo ID
   */
  async getTransaction(transactionId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/v2/transactions/${transactionId}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Solicita estorno/reembolso
   */
  async refundTransaction(transactionId: string, amountCents?: number): Promise<Response> {
    const url = `${this.getBaseUrl()}/v2/transactions/${transactionId}/refund`;
    const payload = amountCents ? { amount: amountCents } : {};
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }
}
