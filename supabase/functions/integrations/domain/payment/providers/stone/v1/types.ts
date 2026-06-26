// Tipos específicos para a API do Stone
export interface Credentials {
  apiKey: string;
  merchantId: string;
}

export interface PaymentRequestPayload {
  amount: number;
  currency: string;
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
    expiration_seconds: number;
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
    order_id: string;
  };
}

export interface PaymentResponsePayload {
  id: string;
  status: string;
  amount: number;
  authorization_code?: string;
  nsu?: string;
  tid?: string;
  authentication_url?: string;
  pix?: {
    qr_code: string;
    qr_code_base64: string;
    expires_at: string;
  };
  boleto?: {
    url: string;
    barcode: string;
    line: string;
    due_date: string;
  };
}
