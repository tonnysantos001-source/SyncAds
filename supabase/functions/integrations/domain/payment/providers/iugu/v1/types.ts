// Tipos específicos para a API do Iugu
export interface Credentials {
  apiToken: string;
  accountId: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price_cents: number; // valor em centavos
}

export interface PayerAddress {
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface Payer {
  cpf_cnpj: string;
  name: string;
  phone_prefix?: string;
  phone?: string;
  email: string;
  address?: PayerAddress;
}

export interface InvoiceRequestPayload {
  email: string;
  customer_id?: string;
  due_date: string;
  items: InvoiceItem[];
  payer: Payer;
  ensure_workday_due_date: boolean;
  payable_with: "pix" | "bank_slip" | "all" | "credit_card";
}

export interface InvoiceResponsePayload {
  id: string;
  status: string; // pending, paid, canceled, expired
  due_date: string;
  secure_url?: string;
  pix?: {
    qrcode: string;
    qrcode_image_url: string;
  };
  bank_slip?: {
    barcode: string;
    digitable_line: string;
  };
  total_cents?: number;
  created_at: string;
  updated_at?: string;
  paid_at?: string;
}
