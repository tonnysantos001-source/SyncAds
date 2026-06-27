// Tipos específicos para a API Axelpay
// Documentação: https://www.axelpay.com

export interface Credentials {
  clientId: string;     // Client ID / API ID fornecido no painel da Axelpay
  clientSecret: string; // Chave secreta de autenticação
}

export interface CreatePaymentPayload {
  amount: number;       // Valor em centavos (ex: 2990 = R$29,90)
  currency: "BRL";
  payment_method: "credit_card" | "pix" | "boleto";
  reference_id: string; // ID interno do pedido (orderId)
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

export interface PaymentResponse {
  id?: string;
  reference_id?: string;
  amount?: number;
  status?: string;          // "approved" | "pending" | "failed" | "cancelled"
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
