// Tipos específicos para a API do Getnet
export interface Credentials {
  clientId: string;
  clientSecret: string;
  sellerId: string;
}

export interface PaymentRequestPayload {
  seller_id: string;
  amount: number; // Em centavos
  currency?: string;
  order?: {
    order_id: string;
    sales_tax?: number;
  };
  customer?: {
    customer_id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    document_type: "CPF" | "CNPJ";
    document_number: string;
    phone_number?: string;
    billing_address?: {
      street: string;
      number: string;
      complement?: string;
      district: string;
      city: string;
      state: string;
      postal_code: string;
      country?: string;
    };
  };
  device?: {
    ip_address?: string;
    device_id?: string;
  };
  payment_method: string;
  pix?: {
    expiration_time: number; // Em segundos
  };
  credit?: {
    delayed?: boolean;
    pre_authorize?: boolean;
    save_card_data?: boolean;
    transaction_type: "FULL" | "INSTALLMENT_WITH_INTEREST" | "INSTALLMENT_WITHOUT_INTEREST";
    number_installments: number;
    soft_descriptor?: string;
    card: {
      number_token?: string;
      cardholder_name: string;
      expiration_month: string;
      expiration_year: string;
      security_code: string;
      brand?: string;
    };
  };
  debit?: {
    delayed?: boolean;
    pre_authorize?: boolean;
    save_card_data?: boolean;
    transaction_type: "FULL";
    number_installments: 1;
    soft_descriptor?: string;
    card: {
      number_token?: string;
      cardholder_name: string;
      expiration_month: string;
      expiration_year: string;
      security_code: string;
      brand?: string;
    };
  };
  boleto?: {
    our_number?: string;
    document_number?: string;
    expiration_date: string;
    instructions?: string;
    provider?: string;
  };
}

export interface PaymentResponsePayload {
  payment_id: string;
  status: string;
  amount: number;
  nsu?: string;
  authorization_code?: string;
  pix?: {
    qr_code: string;
    qr_code_base64?: string;
    additional_data?: string;
    expiration_date_qrcode?: string;
  };
  boleto?: {
    boleto_id?: string;
    bank?: string;
    status_boleto?: string;
    bar_code?: string;
    digitable_line?: string;
    our_number?: string;
    pdf?: string;
    expiration_date?: string;
  };
  credit?: {
    nsu?: string;
    authorization_code?: string;
    transaction_id?: string;
  };
  debit?: {
    nsu?: string;
    authorization_code?: string;
    transaction_id?: string;
  };
}
