// Tipos específicos para a API da Bestfy
export interface Credentials {
  token: string;
}

export interface BuyerDocument {
  type: "cpf" | "cnpj";
  number: string;
}

export interface Buyer {
  name: string;
  email: string;
  document?: BuyerDocument;
  phone?: string;
  externalRef?: string;
}

export interface CardDetails {
  id?: number;
  hash?: string;
  number?: string;
  holderName?: string;
  expirationMonth?: number;
  expirationYear?: number;
  cvv?: string;
}

export interface ItemPayload {
  title: string;
  unitPrice: number; // centavos
  quantity: number;
  tangible: boolean;
  externalRef?: string;
}

export interface PaymentRequestPayload {
  amount: number; // centavos
  paymentMethod: "credit_card" | "boleto" | "pix";
  customer: Buyer;
  items: ItemPayload[];
  card?: CardDetails;
  installments?: number;
  postbackUrl?: string;
  metadata?: string;
  ip?: string;
}

export interface PixResponse {
  qrcode: string;
  url: string;
  expirationDate: string;
  createdAt: string;
}

export interface BoletoResponse {
  url: string;
  barcode: string;
  digitableLine: string;
  expirationDate: string;
  instructions?: string;
  createdAt: string;
}

export interface CardResponse {
  id: number;
  brand: string;
  holderName: string;
  lastDigits: string;
  expirationMonth: number;
  expirationYear: number;
}

export interface PaymentResponsePayload {
  id: number;
  amount: number;
  refundedAmount?: number;
  installments?: number;
  paymentMethod: "credit_card" | "boleto" | "pix";
  status: string; // "paid", "pending", "failed", "refused", "refunded"
  postbackUrl?: string;
  metadata?: string;
  secureId?: string;
  secureUrl?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  customer?: Buyer & { id: number };
  card?: CardResponse;
  pix?: PixResponse;
  boleto?: BoletoResponse;
}

export interface BalanceResponsePayload {
  amount: number;
  recipientId: number;
}
