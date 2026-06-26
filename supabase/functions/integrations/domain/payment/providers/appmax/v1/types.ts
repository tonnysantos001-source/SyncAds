// Tipos específicos para a API do Appmax v3
export interface Credentials {
  apiKey: string; // Representa o access-token da Appmax
  accountId?: string;
}

// 1. Customer Creation Types
export interface CustomerRequestPayload {
  "access-token": string;
  customer: {
    name: string;
    email: string;
    document_number: string;
    phone: string;
  };
}

export interface CustomerResponsePayload {
  status: number;
  success: boolean;
  data: {
    id: number;
    name: string;
    email: string;
    document_number: string;
  };
}

// 2. Order Creation Types
export interface OrderRequestPayload {
  "access-token": string;
  customer_id: number;
  products: Array<{
    sku: string;
    name: string;
    qty: number;
    price: number;
    digital_product?: number; // 0 ou 1
  }>;
}

export interface OrderResponsePayload {
  status: number;
  success: boolean;
  data: {
    id: number;
    customer_id: number;
    total: number;
  };
}

// 3. Payment Creation Types
export interface PaymentRequestPayload {
  "access-token": string;
  cart: {
    order_id: number;
  };
  customer: {
    customer_id: number;
  };
  payment: {
    Pix?: {
      document_number: string;
    };
    Boleto?: {
      document_number: string;
    };
    CreditCard?: {
      token: string;
      document_number: string;
      installments: number;
      soft_descriptor?: string;
    };
  };
}

export interface PaymentResponsePayload {
  status: number;
  success: boolean;
  data: {
    id: number;
    status: string;
    pix_code?: string; // QR code text (copia e cola)
    pdf_url?: string; // Boleto PDF url
    digitable_line?: string; // Boleto barcode
    payment_method?: string;
    amount?: number;
  };
}

