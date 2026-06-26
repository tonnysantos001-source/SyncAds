// Tipos específicos para a API da Vindi
export interface Credentials {
  apiKey: string;
}

export interface CustomerRequestPayload {
  name: string;
  email: string;
  registry_code: string; // CPF/CNPJ
  code?: string;
  phones?: Array<{
    phone_type: string;
    number: string;
  }>;
}

export interface PaymentProfileRequestPayload {
  holder_name: string;
  card_expiration: string; // "MM/YY"
  card_number: string;
  card_cvv: string;
  customer_id: number;
  payment_method_code: "credit_card";
  payment_company_code?: string; // "visa", "mastercard" etc
}

export interface BillItem {
  product_id?: null | number;
  amount: number;
  description: string;
}

export interface BillRequestPayload {
  customer_id: number;
  payment_method_code: "credit_card" | "bank_slip";
  bill_items: BillItem[];
  payment_profile?: {
    id: number;
  };
}

export interface BillResponsePayload {
  id: number;
  status: string; // paid, pending, billing, canceled
  amount: number;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  charges?: Array<{
    id: number;
    status: string;
    last_transaction?: {
      id: number;
      status: string;
      gateway_message?: string;
      gateway_response?: any;
    };
  }>;
  created_at: string;
  updated_at?: string;
}
