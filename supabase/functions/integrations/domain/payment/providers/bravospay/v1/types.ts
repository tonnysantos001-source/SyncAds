// Tipos específicos para a API do Bravos Pay
export interface Credentials {
  merchantId: string;
  apiToken: string;
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
    phone?: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentResponsePayload {
  transaction_id: string;
  status: string;
  id?: string;
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
