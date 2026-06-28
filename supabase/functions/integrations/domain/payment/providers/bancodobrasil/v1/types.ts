export interface Credentials {
  developerKey: string;
  clientId: string;
  clientSecret: string;
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
