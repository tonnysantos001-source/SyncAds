import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, TransactionParams } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  private getProcessorID(): string {
    return this.isTestMode ? config.processorID.sandbox : config.processorID.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "text/xml; charset=UTF-8",
    };
  }

  /**
   * Constrói o bloco XML de verificação de credenciais (usado em todas as requests)
   */
  private buildVerification(): string {
    return `<verification>
    <merchantId>${this.credentials.merchantId}</merchantId>
    <merchantKey>${this.credentials.merchantKey}</merchantKey>
  </verification>`;
  }

  /**
   * Testa conectividade via uma transação de consulta com referência fictícia.
   * MaxiPago retorna XML com errorMessage para credenciais inválidas.
   */
  async ping(): Promise<Response> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<transaction-request>
  ${this.buildVerification()}
  <order>
    <getOrderStatus>
      <orderID>PING_TEST</orderID>
    </getOrderStatus>
  </order>
</transaction-request>`;

    return await this.http.request(this.getBaseUrl(), {
      method: "POST",
      headers: this.getHeaders(),
      body: xml,
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Processa venda com cartão de crédito (auth + capture em um passo).
   * POST /UniversalAPI/postXML com comando <sale>
   */
  async createSale(params: TransactionParams): Promise<Response> {
    const cardXml = params.card
      ? `<creditCard>
      <number>${params.card.number}</number>
      <expMonth>${params.card.expMonth}</expMonth>
      <expYear>${params.card.expYear}</expYear>
      <cvvNumber>${params.card.cvvNumber}</cvvNumber>
    </creditCard>`
      : "";

    const billingXml = params.billing
      ? `<billing>
      <name>${params.billing.name}</name>
      <email>${params.billing.email}</email>
      <phone>${params.billing.phone || ""}</phone>
      <address>${params.billing.address || ""}</address>
      <city>${params.billing.city || ""}</city>
      <state>${params.billing.state || ""}</state>
      <postalcode>${params.billing.postalcode || ""}</postalcode>
      <country>BR</country>
    </billing>`
      : "";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<transaction-request>
  ${this.buildVerification()}
  <order>
    <sale>
      <processorID>${this.getProcessorID()}</processorID>
      <referenceNum>${params.referenceNum}</referenceNum>
      <payment>
        <chargeTotal>${params.chargeTotal}</chargeTotal>
        <currencyCode>BRL</currencyCode>
      </payment>
      ${billingXml}
      ${cardXml}
      ${params.numberOfInstallments && parseInt(params.numberOfInstallments) > 1
        ? `<installment>
        <numberOfInstallments>${params.numberOfInstallments}</numberOfInstallments>
        <chargeInterest>N</chargeInterest>
      </installment>`
        : ""}
    </sale>
  </order>
</transaction-request>`;

    return await this.http.request(this.getBaseUrl(), {
      method: "POST",
      headers: this.getHeaders(),
      body: xml,
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cancela/estorna uma transação pelo orderID.
   */
  async voidTransaction(orderID: string): Promise<Response> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<transaction-request>
  ${this.buildVerification()}
  <order>
    <void>
      <orderID>${orderID}</orderID>
    </void>
  </order>
</transaction-request>`;

    return await this.http.request(this.getBaseUrl(), {
      method: "POST",
      headers: this.getHeaders(),
      body: xml,
      timeoutMs: config.timeoutMs,
    });
  }
}
