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
    const isSandboxKey = typeof this.credentials.apiKey === "string" && this.credentials.apiKey.startsWith("$aact_hmlg_");
    return (this.isTestMode || isSandboxKey) ? config.endpoints.sandbox : config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "access_token": this.credentials.apiKey,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds Integration Client v1.0",
    };
  }

  /**
   * Faz uma chamada real de ping/teste de conexão na API
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments?limit=1`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Busca um cliente pelo documento cpf/cnpj
   */
  async getCustomerByCpfCnpj(cpfCnpj: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/customers?cpfCnpj=${cpfCnpj}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria um cliente na base do Asaas
   */
  async createCustomer(payload: { name: string; cpfCnpj: string; email: string; phone?: string }): Promise<Response> {
    const url = `${this.getBaseUrl()}/customers`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...payload,
        notificationDisabled: false,
      }),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma cobrança no Asaas
   */
  async createCharge(payload: any): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Obtém os dados de PIX (QR Code) de uma cobrança existente
   */
  async getPixQrCode(paymentId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments/${paymentId}/pixQrCode`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta os detalhes de um pagamento existente
   */
  async getPayment(paymentId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/payments/${paymentId}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
