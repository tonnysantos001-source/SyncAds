// Tipos específicos para a API do PagSeguro
export interface Credentials {
  email: string;
  token: string;
}

export interface PaymentRequestPayload {
  reference_id: string;
  customer: {
    name: string;
    email: string;
    tax_id: string;
    phones?: any;
  };
  items: Array<{
    reference_id: string;
    name: string;
    quantity: number;
    unit_amount: number;
  }>;
  qr_codes?: Array<{
    amount: {
      value: number;
    };
    expiration_date?: string;
  }>;
  charges?: Array<{
    reference_id: string;
    description?: string;
    amount: {
      value: number;
      currency: string;
    };
    payment_method: {
      type: "CREDIT_CARD" | "DEBIT_CARD" | "BOLETO";
      installments?: number;
      capture?: boolean;
      card?: any;
      boleto?: any;
    };
  }>;
  notification_urls?: string[];
}

export interface PaymentResponsePayload {
  id: string;
  reference_id: string;
  status?: string;
  created_at?: string;
  qr_codes?: Array<{
    text: string;
    links: Array<{
      rel: string;
      href: string;
      media?: string;
      type?: string;
    }>;
    expiration_date?: string;
  }>;
  charges?: Array<{
    id: string;
    status: string;
    payment_method?: {
      type: string;
      installments?: number;
      capture?: boolean;
      authorization_code?: string;
      nsu?: string;
      tid?: string;
      card?: any;
      boleto?: {
        due_date: string;
        instruction_lines?: any;
        holder?: any;
        barcode?: string;
        formatted_barcode?: string;
        links: Array<{
          rel: string;
          href: string;
          media?: string;
          type?: string;
        }>;
      };
    };
    links?: Array<{
      rel: string;
      href: string;
    }>;
  }>;
  links?: Array<{
    rel: string;
    href: string;
  }>;
}
