// Tipos específicos para a API Axion Pay (Axiopay)
// Documentação: https://axiopay.com.br

export interface Credentials {
  apiKey: string; // Chave secreta sk_live_... ou sk_test_...
}

export interface CreateChargePayload {
  amount: number;       // Valor em centavos
  method: "credit_card" | "pix" | "boleto";
  description?: string;
  reference_id: string; // ID do pedido
  customer: {
    name: string;
    cpf: string;        // CPF/CNPJ do cliente
    email: string;
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
  webhook_url?: string;
}

export interface ChargeResponse {
  id?: string;
  reference_id?: string;
  amount?: number;
  status?: string;          // "approved" | "pending" | "failed" | "cancelled" | "refunded"
  method?: string;
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
