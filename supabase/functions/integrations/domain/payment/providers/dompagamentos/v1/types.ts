// Tipos específicos para a API do Dom Pagamentos
export interface Credentials {
  token: string;
}

export interface Buyer {
  name: string;
  email: string;
  document: string;
  phone?: string;
}

export interface CardDetails {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface PaymentRequestPayload {
  amount: number; // centavos
  payment_method: "credit_card" | "boleto" | "pix";
  customer: Buyer;
  card?: CardDetails;
  installments?: number;
  postback_url?: string;
  metadata?: string;
}

export interface PaymentResponsePayload {
  id: string;
  status: string; // paid, pending, failed, refunded, cancelled, etc.
  amount: number;
  qr_code?: string;
  barcode?: string;
  digitable_line?: string;
  payment_url?: string;
  created_at: string;
  updated_at?: string;
  paid_at?: string;
}
