export interface Credentials { apiKey: string; apiLogin: string; merchantId: string; }
export interface PayUTransactionRequest {
  language: string; command: string;
  merchant: { apiKey: string; apiLogin: string };
  transaction: {
    order: {
      accountId: string; referenceCode: string; description: string;
      additionalValues: { TX_VALUE: { value: number; currency: string } };
      buyer: { fullName: string; emailAddress: string; contactPhone?: string };
    };
    type: string; paymentMethod?: string; paymentCountry: string; deviceSessionId?: string;
    ipAddress?: string; userAgent?: string;
    creditCard?: { number: string; securityCode: string; expirationDate: string; name: string };
    payer?: { fullName: string; emailAddress: string };
  };
  test: boolean;
}
export interface PayUResponse { code?: string; error?: string; transactionResponse?: { orderId?: number; transactionId?: string; state?: string; paymentNetworkResponseCode?: string; paymentNetworkResponseErrorMessage?: string; trazabilityCode?: string; responseCode?: string; responseMessage?: string; operationDate?: number; extraParameters?: Record<string, any> } }
