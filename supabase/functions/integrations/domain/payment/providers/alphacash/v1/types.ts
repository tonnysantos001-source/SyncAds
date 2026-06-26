// Tipos específicos para a API do Alphacash
export interface Credentials {
  apiKey: string;
  secretKey: string;
}

export interface PaymentRequestPayload {
  transaction_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  customer: {
    name: string;
    email: string;
    document: string;
  };
}

export interface PaymentResponsePayload {
  transaction_id: string;
  status: string;
  payment_url?: string;
  qr_code?: string;
  expires_at?: string;
}
