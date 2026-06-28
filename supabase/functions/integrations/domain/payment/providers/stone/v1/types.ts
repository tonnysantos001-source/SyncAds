// Tipos específicos para a API Stone
// Documentação: https://docs.stone.com.br

export interface Credentials {
  merchantId: string;
  apiKey: string;
}

export interface CreatePaymentPayload {
  amount: number; // Centavos
  currency: "BRL";
  payment_method: "pix" | "credit_card" | "debit_card" | "boleto";
  merchant_id: string;
  customer: {
    name: string;
    email: string;
    document: {
      type: "CPF" | "CNPJ";
      number: string;
    };
    phone?: {
      country_code: string;
      area_code: string;
      number: string;
    };
    address?: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zip_code: string;
    };
  };
  pix?: {
    expiration_seconds?: number;
  };
  card?: {
    number: string;
    holder_name: string;
    expiration_month: string;
    expiration_year: string;
    cvv: string;
  };
  installments?: number;
  capture?: boolean;
  boleto?: {
    due_date: string;
    instructions?: string;
  };
  metadata?: {
    order_id?: string;
  };
}

export interface PaymentResponse {
  id?: string;
  status?: string; // "pending" | "processing" | "authorized" | "paid" | "approved" | "failed" | "declined" | "cancelled" | "refunded"
  authorization_code?: string;
  nsu?: string;
  tid?: string;
  amount?: number;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
  paid_at?: string;
  pix?: {
    qr_code?: string;
    qr_code_base64?: string;
    expires_at?: string;
  };
  boleto?: {
    url?: string;
    barcode?: string;
    digitable_line?: string;
    due_date?: string;
  };
  authentication_url?: string; // Debit card authentication
  error?: {
    message?: string;
  };
  message?: string;
}
