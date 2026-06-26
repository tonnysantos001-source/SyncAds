// Tipos específicos para a API do Pagar.me
export interface Credentials {
  apiKey: string;
  encryptionKey?: string;
}

export interface PaymentRequestPayload {
  code: string;
  customer: {
    name: string;
    email: string;
    document: string;
    type: "individual" | "company";
    phones?: {
      mobile_phone: {
        country_code: string;
        area_code: string;
        number: string;
      };
    };
    address?: any;
  };
  items: Array<{
    code: string;
    description: string;
    amount: number;
    quantity: number;
  }>;
  payments: Array<{
    payment_method: "pix" | "credit_card" | "debit_card" | "boleto";
    pix?: {
      expires_in: number;
    };
    credit_card?: {
      installments: number;
      statement_descriptor: string;
      card: any;
    };
    debit_card?: {
      card: any;
    };
    boleto?: {
      instructions?: string;
      due_at?: string;
      document_number?: string;
    };
  }>;
}

export interface PaymentResponsePayload {
  id: string;
  code: string;
  status: string;
  amount: number;
  charges: Array<{
    id: string;
    status: string;
    last_transaction?: {
      id: string;
      transaction_type: string;
      status: string;
      amount: number;
      qr_code?: string;
      qr_code_url?: string;
      expires_at?: string;
      url?: string;
      barcode?: string;
      line?: string;
      due_at?: string;
      acquirer_auth_code?: string;
      acquirer_nsu?: string;
      acquirer_tid?: string;
    };
  }>;
}
