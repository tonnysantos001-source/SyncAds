// Tipos específicos para a API do Dias Marketplace
export interface Credentials {
  apiKey: string;
  storeId: string;
}

export interface BuyerDocument {
  type: "cpf" | "cnpj";
  id: string; // Apenas números
}

export interface Buyer {
  name: string;
  email: string;
  phone: string;
  document: BuyerDocument;
}

export interface CardDetails {
  type: "credit_card";
  number: string;
  holderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  installments: number;
}

export interface PixDetails {
  type: "pix";
}

export interface BoletoDetails {
  type: "boleto";
}

export interface PaymentRequestPayload {
  amount: number; // valor em centavos
  currency: "BRL";
  customer: Buyer;
  paymentMethod: CardDetails | PixDetails | BoletoDetails;
  postbackUrl?: string;
  metadata?: string;
}

export interface PaymentResponsePayload {
  id: string;
  status: string; // paid, pending, failed, refunded, cancelled, etc.
  amount: number;
  qrCode?: string;
  barcode?: string;
  digitableLine?: string;
  paymentUrl?: string;
  createdAt: string;
  paidAt?: string;
  updatedAt?: string;
}
