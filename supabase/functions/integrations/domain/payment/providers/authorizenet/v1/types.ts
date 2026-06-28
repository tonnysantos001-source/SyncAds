export interface Credentials { loginId: string; transactionKey: string; }
export interface MerchantAuth { name: string; transactionKey: string; }
export interface CreditCardPayment { cardNumber: string; expirationDate: string; cardCode: string; }
export interface CreateTransactionRequest {
  createTransactionRequest: {
    merchantAuthentication: MerchantAuth;
    refId?: string;
    transactionRequest: {
      transactionType: string;
      amount: string;
      payment?: { creditCard?: CreditCardPayment };
      order?: { invoiceNumber: string; description?: string };
      customer?: { email?: string };
      billTo?: { firstName?: string; lastName?: string; email?: string };
      authCode?: string;
    };
  };
}
export interface TransactionResponse {
  transactionResponse?: {
    responseCode?: string; transId?: string; authCode?: string;
    messages?: Array<{ code: string; description: string }>;
    errors?: Array<{ errorCode: string; errorText: string }>;
    accountNumber?: string; accountType?: string;
  };
  messages?: { resultCode: string; message: Array<{ code: string; text: string }> };
}
