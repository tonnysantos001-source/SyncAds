import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateChargePayload } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  /**
   * OpenPix autentica via AppID direto no header Authorization (sem "Bearer")
   */
  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": this.credentials.appId,
    };
  }

  /**
   * Testa conectividade consultando a conta da aplicação.
   * GET /application → 200 = OK | 401 = appId inválido
   */
  async ping(): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/application`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma cobrança PIX.
   * POST /charge
   */
  async createCharge(payload: CreateChargePayload): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/charge`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta uma cobrança pelo correlationID ou identifier.
   * GET /charge/{id}
   */
  async getCharge(correlationID: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/charge/${correlationID}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cancela/expira uma cobrança pelo correlationID.
   * DELETE /charge/{id}
   */
  async deleteCharge(correlationID: string): Promise<Response> {
    return await this.http.request(`${this.getBaseUrl()}/charge/${correlationID}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
