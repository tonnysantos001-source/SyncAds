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
    const apiKey = this.credentials.apiKey || "";
    const base64Auth = btoa(`${apiKey}:`);

    return {
      "Authorization": `Basic ${base64Auth}`,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds AI Integration Client (Vindi v1)",
    };
  }

  /**
   * Faz teste de conexão (ping)
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/merchant`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria ou busca cliente
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
   * Consulta cliente por query (documento)
   */
  async getCustomerByQuery(query: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/customers?query=${encodeURIComponent(query)}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria um perfil de pagamento (Payment Profile)
   */
  async createPaymentProfile(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/payment_profiles`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma fatura (Bill)
   */
  async createBill(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/bills`;
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
  async getBill(billId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/bills/${billId}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
