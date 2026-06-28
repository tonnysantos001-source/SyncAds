import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, CreateTransactionRequest } from "./types.ts";
export class Client {
  constructor(private http: HttpClientInterface, private creds: Credentials, private isTestMode: boolean) {}
  private getUrl() { return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production; }
  private getHeaders(): HeadersInit { return { "Content-Type": "application/json" }; }
  private getAuth() { return { name: this.creds.loginId, transactionKey: this.creds.transactionKey }; }

  async createTransaction(amount: string, orderId: string, card?: any, email?: string): Promise<Response> {
    const body: CreateTransactionRequest = {
      createTransactionRequest: {
        merchantAuthentication: this.getAuth(),
        refId: orderId,
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount,
          order: { invoiceNumber: orderId.substring(0, 20), description: "Pagamento SyncAds" },
          customer: { email },
          billTo: email ? { email } : undefined,
        },
      },
    };
    if (card) {
      body.createTransactionRequest.transactionRequest.payment = {
        creditCard: { cardNumber: card.number.replace(/\D/g, ""), expirationDate: card.expDate, cardCode: card.cvv },
      };
    }
    return await this.http.request(this.getUrl(), { method: "POST", headers: this.getHeaders(), body: JSON.stringify(body), timeoutMs: config.timeoutMs });
  }

  async getTransaction(transId: string): Promise<Response> {
    const body = { getTransactionDetailsRequest: { merchantAuthentication: this.getAuth(), transId } };
    return await this.http.request(this.getUrl(), { method: "POST", headers: this.getHeaders(), body: JSON.stringify(body), timeoutMs: config.timeoutMs });
  }

  async refundTransaction(transId: string, amount: string, last4: string, expDate: string): Promise<Response> {
    const body = {
      createTransactionRequest: {
        merchantAuthentication: this.getAuth(),
        transactionRequest: {
          transactionType: "refundTransaction",
          amount,
          payment: { creditCard: { cardNumber: last4, expirationDate: expDate } },
          refTransId: transId,
        },
      },
    };
    return await this.http.request(this.getUrl(), { method: "POST", headers: this.getHeaders(), body: JSON.stringify(body), timeoutMs: config.timeoutMs });
  }
}
