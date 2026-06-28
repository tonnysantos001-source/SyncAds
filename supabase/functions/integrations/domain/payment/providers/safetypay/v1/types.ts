// Tipos específicos para a API SafetyPay
// Documentação: https://api.safetypay.com/v1

export interface Credentials {
  apiKey: string;
  signatureKey: string;
}

export interface CreatePaymentPayload {
  transaction_id: string;
  amount: number; // Decimal (ex: 150.00)
  currency: "BRL";
  payment_method: string;
  customer: {
    name: string;
    email: string;
    document: string;
    phone?: string;
  };
  metadata?: {
    order_id?: string;
    user_id?: string;
  };
  card?: {
    number: string;
    holder_name: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
  };
  installments?: number;
}

export interface PaymentResponse {
  id?: string;
  transaction_id?: string;
  status?: string;
  qr_code?: string;
  pix_qr_code?: string;
  qr_code_base64?: string;
  payment_url?: string;
  boleto_url?: string;
  barcode?: string;
  digitable_line?: string;
  expires_at?: string;
  message?: string;
  amount?: number;
  currency?: string;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
  paid_at?: string;
  error?: {
    message?: string;
  };
}
