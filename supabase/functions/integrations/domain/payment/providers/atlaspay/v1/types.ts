// Tipos específicos para a API Atlas Pay
// Documentação: https://www.atlaspay.com.br

export interface Credentials {
  apiId: string;     // ID da API fornecido no painel da Atlas Pay
  apiSecret: string; // Chave secreta de autenticação
}

export interface CreatePaymentPayload {
  amount: number;       // Valor em centavos (ex: 5000 = R$50,00)
  currency: "BRL";
  payment_method: "credit_card" | "pix" | "boleto";
  reference_id: string; // ID interno do pedido (orderId)
  description?: string;
  customer: {
    name: string;
    email: string;
    document: string;   // CPF/CNPJ limpo (só números)
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
