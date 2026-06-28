// Tipos específicos para a API Iugu
// Documentação: https://dev.iugu.com

export interface Credentials {
  apiToken: string;    // Token de API Bearer
  accountId: string;   // ID da conta do comerciante Iugu
}

export interface PaymentTokenPayload {
  account_id: string;
  method: "credit_card";
  test?: boolean;
  data: {
    number: string;
    verification_value: string;
    first_name: string;
    last_name: string;
    month: string;
    year: string;
  };
}

export interface InvoicePayload {
  email: string;
  customer_id?: string;
  due_date: string;
  items: Array<{
    description: string;
    quantity: number;
    price_cents: number;
  }>;
  payer?: {
    cpf_cnpj: string;
    name: string;
    phone_prefix?: string;
    phone?: string;
    email: string;
    address?: {
      street: string;
      number: string;
      district: string;
      city: string;
      state: string;
      zip_code: string;
    };
  };
  ensure_workday_due_date?: boolean;
  payable_with: "pix" | "bank_slip";
}

export interface ChargePayload {
  token: string;
  email: string;
  months?: number;
  items: Array<{
    description: string;
    quantity: number;
    price_cents: number;
  }>;
  payer?: {
    cpf_cnpj: string;
    name: string;
    phone_prefix?: string;
    phone?: string;
    email: string;
    address?: {
      street: string;
      number: string;
      district: string;
      city: string;
      state: string;
      zip_code: string;
      country?: string;
    };
  };
}

export interface PaymentResponse {
  id?: string;
  invoice_id?: string;
  status?: string;          // "pending" | "paid" | "canceled" | "refunded"
  success?: boolean;
  message?: string;
  secure_url?: string;
  pix?: {
    qrcode?: string;
    qrcode_image_url?: string;
  };
  bank_slip?: {
    barcode?: string;
    digitable_line?: string;
  };
  due_date?: string;
  total_cents?: number;
  payable_with?: string;
  created_at?: string;
  updated_at?: string;
  paid_at?: string;
  error?: {
    code?: string;
    message?: string;
  };
}
