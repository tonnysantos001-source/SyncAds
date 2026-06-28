import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private creds: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl() {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "X-CHAVE": this.creds.chave,
    };
  }

  async createBoleto(payload: any): Promise<Response> {
    return await this.http.request(
      `${this.getBaseUrl()}/recebimentos/${this.creds.credencial}/transacoes`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        timeoutMs: config.timeoutMs,
      }
    );
  }

  async createCardCharge(payload: any): Promise<Response> {
    return await this.http.request(
      `${this.getBaseUrl()}/recebimentos/${this.creds.credencial}/transacoes`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        timeoutMs: config.timeoutMs,
      }
    );
  }

  async getTransaction(nossoNumero: string): Promise<Response> {
    // PJBank query via query string or path
    return await this.http.request(
      `${this.getBaseUrl()}/recebimentos/${this.creds.credencial}/transacoes/${nossoNumero}`,
      {
        method: "GET",
        headers: this.getHeaders(),
        timeoutMs: config.timeoutMs,
      }
    );
  }

  async refundTransaction(idUnico: string, amount: number): Promise<Response> {
    return await this.http.request(
      `${this.getBaseUrl()}/recebimentos/${this.creds.credencial}/transacoes/${idUnico}/cancelar`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ valor: amount }),
        timeoutMs: config.timeoutMs,
      }
    );
  }
}
