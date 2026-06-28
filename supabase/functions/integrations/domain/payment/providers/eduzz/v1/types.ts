export interface Credentials {
  producerKey: string;
  apiKey: string;
}

export interface TransactionPayload {
  orderId: string;
  amount: number;
  paymentMethod: string;
  customer: {
    name: string;
    email: string;
    document: string;
  };
}
