import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private _isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    return config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Bearer ${this.credentials.secretKey}`,
    };
  }

  /**
   * Valida a conexão com a API do Stripe
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/customers?limit=1`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria uma cobrança no Stripe
   */
  async createPaymentIntent(payload: Record<string, any>): Promise<Response> {
    const url = `${this.getBaseUrl()}/payment_intents`;
    
    // Converte o payload para url-encoded (Stripe API padrão)
    const bodyParams = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === "object") {
        for (const [subKey, subValue] of Object.entries(value)) {
          bodyParams.append(`${key}[${subKey}]`, String(subValue));
        }
      } else {
        bodyParams.append(key, String(value));
      }
    }

    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: bodyParams.toString(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Consulta os detalhes de um PaymentIntent no Stripe
   */
  async getPaymentIntent(id: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/payment_intents/${id}`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}
