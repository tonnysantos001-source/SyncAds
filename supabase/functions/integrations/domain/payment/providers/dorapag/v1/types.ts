// Tipos específicos para a API Dorapag
// Documentação: https://api.dorapag.com/docs

export interface Credentials {
  apiKey: string;     // Chave de API secreta (X-API-Key)
  secretKey: string;  // Chave secreta complementar
}

export interface CreatePaymentPayload {
  transaction_id: string; // Referência interna
  amount: number;         // Valor em centavos
  currency: "BRL";
  payment_method: "credit_card" | "pix" | "boleto";
  customer: {
    name: string;
    email: string;
    document: string;     // CPF/CNPJ limpo
    phone?: string;
  };
  card?: {
    number: string;
    holder_name: string;
    expiration_month?: string; // MM
    expiration_year?: string;  // YYYY
    expiry_month?: string;     // Compatibilidade
    expiry_year?: string;
    cvv: string;
  };
  installments?: number;
  metadata?: {
    order_id: string;
    user_id?: string;
  };
  notification_url?: string;
}

export interface PaymentResponse {
  id?: string;
  transaction_id?: string;
  status?: string;          // "approved" | "pending" | "failed" | "cancelled" | "refunded"
  qr_code?: string;
  qr_code_base64?: string;
  payment_url?: string;     // Boleto ou checkout
  boleto_url?: string;
  barcode?: string;
  digitable_line?: string;
  expires_at?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  amount?: number;
  currency?: string;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
  paid_at?: string;
}
