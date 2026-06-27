// Tipos específicos para a API Bravos Pay
// Documentação: https://bravospay.com.br

export interface Credentials {
  apiKey: string; // Token de autenticação
}

export interface CreateChargePayload {
  amount: number;       // Valor em centavos
  payment_method: "credit_card" | "pix" | "boleto";
  reference_id: string; // Referência interna (orderId)
  description?: string;
  customer: {
    name: string;
    email: string;
    document: string;   // CPF/CNPJ limpo
    phone?: string;
  };
  card?: {
    number: string;
    holder_name: string;
    expiration_month: string;
    expiration_year: string;
    cvv: string;
  };
  installments?: number;
  notification_url?: string;
}

export interface ChargeResponse {
  id?: string;
  reference_id?: string;
  amount?: number;
  status?: string;          // "approved" | "pending" | "failed" | "cancelled" | "refunded"
  payment_method?: string;
  authorization_code?: string;
  pix?: {
    qr_code?: string;
    qr_code_url?: string;
    expires_at?: string;
  };
  boleto?: {
    digitable_line?: string;
    pdf_url?: string;
    expires_at?: string;
  };
  error?: {
    code: string;
    message: string;
  };
  created_at?: string;
}
