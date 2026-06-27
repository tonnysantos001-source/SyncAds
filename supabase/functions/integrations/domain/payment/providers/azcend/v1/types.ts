// Tipos específicos para a API Azcend
// Documentação: https://api.azcend.com/docs

export interface Credentials {
  apiKey: string;       // Chave de API secreta (X-API-Key)
  merchantId?: string;  // ID opcional do estabelecimento
}

export interface CreatePaymentPayload {
  transaction_id: string; // Referência interna ou gerada
  amount: number;         // Valor decimal ou centavos (no legado foi mantido request.amount, mas para conformidade mandamos centavos ou decimal. Vamos manter compatibilidade ou ajustar se for centavos. Na Azcend é em centavos ou decimal? Geralmente decimal no Brasil, mas para garantir fazemos como float/number).
  currency: "BRL";
  payment_method: "credit_card" | "pix" | "boleto" | "wallet";
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
    expiry_month?: string;     // Legado suporta ambos
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
  qr_code?: string;         // EMV Pix
  qr_code_base64?: string;  // Imagem base64
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
