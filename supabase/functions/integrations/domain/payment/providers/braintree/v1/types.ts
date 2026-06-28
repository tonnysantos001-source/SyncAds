export interface Credentials { merchantId: string; publicKey: string; privateKey: string; }
export interface CreditCard { number: string; expirationDate: string; cvv: string; cardholderName: string; }
export interface CreateTransactionPayload {
  amount: string;
  orderId?: string;
  creditCard?: CreditCard;
  paymentMethodNonce?: string;
  options?: { submitForSettlement: boolean };
}
export interface TransactionResponse {
  transaction?: {
    id?: string;
    status?: string;
    amount?: string;
    createdAt?: string;
    processorResponseCode?: string;
    processorResponseText?: string;
  };
  errors?: { deepErrors?: Array<{ message: string }> };
  success?: boolean;
  message?: string;
}
