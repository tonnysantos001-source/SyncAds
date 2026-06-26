// Tipos específicos para a API do Pagou.ai
export interface Credentials {
  apiKey: string;
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

export interface ProductItem {
  name: string;
  price: number; // centavos
  quantity: number;
}

export interface PaymentRequestPayload {
  external_ref: string;
  amount: number; // centavos
  currency: string;
  method: "pix" | "credit_card" | "voucher";
  notify_url?: string;
  buyer: Buyer;
  products?: ProductItem[];
  token?: string; // para credit_card
  installments?: number; // para credit_card
}

export interface PaymentResponsePayload {
  success: boolean;
  requestId: string;
  data: {
    id: string;
    status: string;
    method: "pix" | "credit_card" | "voucher";
    amount: number;
    currency: string;
    pix?: {
      qr_code: string;
      expiration_date: string;
    };
    voucher?: {
      barcode: string;
      url: string;
      digitable_line?: string;
      due_date?: string;
    };
    card?: {
      brand: string;
      last_four: string;
    };
  };
}
