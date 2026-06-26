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
      "Content-Type": "application/json",
      "User-Agent": "SyncAds Integration Client v1.0",
    };
  }

  /**
   * Pings the API by calling /customer with empty body to verify authentication.
   * If token is invalid, it returns 401. If token is valid, it returns 400 (validation error).
   */
  async ping(): Promise<Response> {
    const url = `${this.getBaseUrl()}/customer`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        "access-token": this.credentials.apiKey,
      }),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Creates a customer in Appmax
   */
  async createCustomer(payload: {
    name: string;
    email: string;
    document_number: string;
    phone: string;
  }): Promise<Response> {
    const url = `${this.getBaseUrl()}/customer`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        "access-token": this.credentials.apiKey,
        customer: payload,
      }),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Creates an order in Appmax
   */
  async createOrder(payload: {
    customer_id: number;
    products: Array<{
      sku: string;
      name: string;
      qty: number;
      price: number;
      digital_product?: number;
    }>;
  }): Promise<Response> {
    const url = `${this.getBaseUrl()}/order`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        "access-token": this.credentials.apiKey,
        customer_id: payload.customer_id,
        products: payload.products,
      }),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Creates a payment in Appmax
   */
  async createPayment(
    method: "pix" | "ticket" | "credit-card",
    payload: {
      order_id: number;
      customer_id: number;
      payment: any;
    }
  ): Promise<Response> {
    const url = `${this.getBaseUrl()}/payment/${method}`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        "access-token": this.credentials.apiKey,
        cart: {
          order_id: payload.order_id,
        },
        customer: {
          customer_id: payload.customer_id,
        },
        payment: payload.payment,
      }),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Tokenizes a credit card
   */
  async tokenizeCard(payload: {
    name: string;
    number: string;
    cvv: string;
    month: number;
    year: number;
  }): Promise<Response> {
    const url = `${this.getBaseUrl()}/tokenize/card`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        "access-token": this.credentials.apiKey,
        card: payload,
      }),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Request refund for a transaction
   */
  async refundTransaction(orderId: string, amount?: number): Promise<Response> {
    const url = `${this.getBaseUrl()}/refund`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        "access-token": this.credentials.apiKey,
        order_id: Number(orderId),
        amount: amount, // Em centavos se aplicável
      }),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Retrieves order status from Appmax
   */
  async getOrder(orderId: string): Promise<Response> {
    const url = `${this.getBaseUrl()}/order`;
    // Na Appmax v3, alguns endpoints de GET aceitam access-token na query string
    return await this.http.request(`${url}?access-token=${this.credentials.apiKey}&id=${orderId}`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}


