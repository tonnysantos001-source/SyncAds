// Tipos específicos para a API do HyperCash
export interface Credentials {
  secretKey: string;
}

export interface BuyerDocument {
  type: "CPF" | "CNPJ";
  number: string;
}

export interface Buyer {
  name: string;
  email: string;
  document: BuyerDocument;
  phone?: string;
}

export interface CardDetails {
  number: string;
  holder: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}

export interface PaymentRequestPayload {
  amount: number; // em centavos
  currency: string; // "BRL"
  paymentMethod: "PIX" | "BOLETO" | "CREDIT_CARD";
  customer: Buyer;
  installments?: number;
  card?: CardDetails;
  postbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PixResponse {
  qr_code: string; // QR code copia e cola
  qrcode_image?: string; // QR code image URL or base64
  expiration_date: string;
}

export interface BoletoResponse {
  barcode: string;
  digitable_line: string;
  url: string;
  due_date: string;
}

export interface CardResponse {
  brand?: string;
  last_four?: string;
}

export interface PaymentResponsePayload {
  success: boolean;
  data: {
    id: string;
    status: string; // "pending", "processing", "approved", "paid", "failed", "rejected", "refunded"
    amount: number;
    currency: string;
    paymentMethod: "PIX" | "BOLETO" | "CREDIT_CARD";
    pix?: PixResponse;
    boleto?: BoletoResponse;
    card?: CardResponse;
    created_at: string;
  };
  message?: string;
}

export interface BalanceResponsePayload {
  success: boolean;
  data: {
    available_balance: number;
    pending_balance: number;
    currency: string;
  };
}
