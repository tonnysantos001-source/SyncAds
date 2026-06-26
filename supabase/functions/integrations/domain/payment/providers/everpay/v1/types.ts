// Tipos específicos para a API do Ever Pay
export interface Credentials {
  apiKey: string;
  accountId?: string;
}

export interface PaymentRequestPayload {
  amount: number; // Em centavos (inteiro)
  currency: string; // ex: "brl"
  payment_method: string;
  description: string;
  customer: {
    name: string;
    email: string;
    document: string;
    phone?: string;
  };
  card_token?: string; // Para pagamentos de cartão de crédito
}

export interface PaymentResponsePayload {
  id: string;
  status: string;
  amount: number;
  currency: string;
  qr_code?: string; // QR code text (copia e cola)
  pix_code?: string; // QR code alternativo
  payment_url?: string; // Boleto PDF url
  pdf_url?: string; // Boleto alternativo
  barcode?: string; // Boleto barcode
  digitable_line?: string; // Linha digitável
  created_at: string;
}

