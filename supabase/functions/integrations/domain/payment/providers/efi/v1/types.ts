// Tipos específicos para a API da Efí
export interface Credentials {
  clientId: string;
  clientSecret: string;
}

export interface Buyer {
  name: string;
  email: string;
  document: string;
  phone?: string;
}

export interface CardDetails {
  number: string;
  holder_name: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
}

export interface PaymentRequestPayload {
  transaction_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  customer: Buyer;
  card?: CardDetails;
  installments?: number;
  metadata?: Record<string, any>;
}

export interface PaymentResponsePayload {
  id?: string;
  transaction_id?: string;
  status: string;
  amount: number;
  qr_code?: string;
  pix_qr_code?: string;
  qr_code_base64?: string;
  payment_url?: string;
  boleto_url?: string;
  barcode?: string;
  digitable_line?: string;
  expires_at?: string;
  message?: string;
}
