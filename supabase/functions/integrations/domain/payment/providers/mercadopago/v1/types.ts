// Tipos e interfaces de tipos para a API do Mercado Pago v1

export interface Credentials {
  accessToken: string;
  publicKey?: string;
}

export interface Identification {
  type: "CPF" | "CNPJ";
  number: string;
}

export interface Payer {
  email: string;
  first_name?: string;
  last_name?: string;
  identification?: Identification;
  address?: {
    zip_code: string;
    street_name: string;
    street_number: string;
    neighborhood: string;
    city: string;
    federal_unit: string;
  };
}

export interface PaymentRequestPayload {
  transaction_amount: number;
  payment_method_id: string;
  token?: string;
  installments?: number;
  description: string;
  payer: Payer;
  notification_url?: string;
  external_reference?: string;
}

export interface PaymentResponsePayload {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  date_created: string;
  date_approved?: string;
  date_of_expiration?: string;
  payment_method_id: string;
  point_of_interaction?: {
    type: string;
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  barcode?: {
    content?: string;
  };
  transaction_details?: {
    external_resource_url?: string;
    bar_code?: {
      type: string;
      content: string;
    };
  };
  card?: {
    last_four_digits: string;
    cardholder: {
      name: string;
    };
  };
}
