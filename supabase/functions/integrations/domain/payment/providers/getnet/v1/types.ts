// Tipos específicos para a API GetNet
// Documentação: https://api.getnet.com.br

export interface Credentials {
  clientId: string;
  clientSecret: string;
  sellerId: string;
}

export interface CreatePaymentPayload {
  seller_id: string;
  amount: number; // Centavos
  currency: "BRL";
  order: {
    order_id: string;
    sales_tax?: number;
    product_type?: string;
  };
  customer: {
    customer_id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    document_type: "CPF" | "CNPJ";
    document_number: string;
    phone_number?: string;
  };
  device?: {
    ip_address?: string;
  };
  pix?: {
    additional_data?: string;
  };
  credit?: {
    delayed?: boolean;
    save_card_data?: boolean;
    transaction_type?: "FULL" | "INSTALLMENT";
    number_installments?: number;
    card: {
      number_token: string;
      cardholder_name: string;
      security_code: string;
      expiration_month: string;
      expiration_year: string;
    };
  };
  debit?: {
    card: {
      number_token: string;
      cardholder_name: string;
      security_code: string;
      expiration_month: string;
      expiration_year: string;
    };
  };
  boleto?: {
    our_number: string;
    document_number: string;
    expiration_date: string;
    instructions: string;
    provider: string;
  };
}

export interface PaymentResponse {
  payment_id?: string;
  status?: string; // "PENDING" | "APPROVED" | "DENIED" | "ERROR" | "CANCELED"
  qrcode_text?: string;
  qrcode_image?: string;
  expiration_date?: string;
  authorization_code?: string;
  terminal_nsu?: string;
  redirect_url?: string;
  boleto_url?: string;
  barcode?: string;
  typeful_line?: string;
  error?: {
    message?: string;
    description?: string;
  };
  message?: string;
  amount?: number;
  payment_type?: string;
  create_date?: string;
  update_date?: string;
}
