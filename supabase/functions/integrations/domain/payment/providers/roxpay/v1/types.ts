// Tipos específicos para a API RoxPay
// Documentação: https://app.roxpay.eu/apidocs/

export interface Credentials {
  clientId: string;     // Client ID fornecido pela RoxPay
  clientSecret: string; // Client Secret fornecido pela RoxPay
  companyId?: string;   // ID opcional do estabelecimento (para SaaS/sub-lojas)
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface CreateChargePayload {
  amount: number;       // Valor em centavos (ex: 1000 = R$10,00)
  currency: string;     // "BRL", "EUR", "USD" etc.
  payment_method: "credit_card" | "pix" | "boleto";
  description?: string;
  reference_id: string; // Referência interna do pedido (orderId)
  customer: {
    name: string;
    email: string;
    document: string;   // CPF/CNPJ sem formatação
    phone?: string;
  };
  card?: {
    number: string;
    holder_name: string;
    expiration_month: string; // "MM"
    expiration_year: string;  // "YYYY"
    cvv: string;
  };
  installments?: number;
  notification_url?: string;
}

export interface ChargeResponse {
  id?: string;
  reference_id?: string;
  amount?: number;
  currency?: string;
  status?: string;          // "approved" | "pending" | "failed" | "cancelled" | "refunded"
  payment_method?: string;
  authorization_code?: string;
  pix?: {
    qr_code?: string;       // Código PIX copia-e-cola (EMV)
    qr_code_url?: string;   // URL da imagem do QR Code
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
