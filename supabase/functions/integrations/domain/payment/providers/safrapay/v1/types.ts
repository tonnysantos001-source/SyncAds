// Tipos específicos para a API SafraPay
export interface Credentials {
  clientId: string;     // Client ID OAuth — obtido no Portal do Lojista SafraPay
  clientSecret: string; // Client Secret OAuth — obtido no Portal do Lojista SafraPay
  merchantId?: string;  // Merchant ID (opcional, algumas operações exigem)
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface CreatePaymentPayload {
  merchant_id?: string;
  reference_id: string;
  amount: number;           // Valor em centavos
  currency: "BRL";
  payment_method: "credit_card" | "debit_card" | "pix";
  capture: boolean;
  customer: {
    name: string;
    email: string;
    document: string;     // CPF/CNPJ sem formatação
    phone?: string;
  };
  card?: {
    number: string;
    holder_name: string;
    exp_month: string;
    exp_year: string;
    cvv: string;
  };
  installments?: number;
  notification_url?: string;
}

export interface CreatePaymentResponse {
  id?: string;
  reference_id?: string;
  status?: string;          // "authorized" | "paid" | "pending" | "failed" | "cancelled"
  amount?: number;
  payment_method?: string;
  authorization_code?: string;
  pix?: {
    qr_code?: string;       // Código PIX copia-e-cola
    qr_code_url?: string;   // URL da imagem do QR Code
    expires_at?: string;
  };
  error?: { code: string; message: string };
  created_at?: string;
}
