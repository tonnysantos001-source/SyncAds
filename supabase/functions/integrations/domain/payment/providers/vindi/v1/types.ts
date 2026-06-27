// Tipos específicos para a API Vindi
// Documentação: https://app.vindi.com.br/api/v1/docs

export interface Credentials {
  apiKey: string; // API Key — obtida em Configurações > API no painel Vindi
}

export interface VindiCustomer {
  name: string;
  email: string;
  registry_code?: string; // CPF ou CNPJ
  phone?: string;
  code?: string;          // Código interno do cliente (referência)
}

export interface CreateCustomerResponse {
  customer?: {
    id: number;
    name: string;
    email: string;
    code: string;
    registry_code?: string;
    status: string;
  };
  errors?: Array<{ id: string; message: string }>;
}

export interface PaymentProfilePayload {
  customer_id: number;
  holder_name: string;
  card_number: string;
  card_expiration: string;  // "MM/YYYY"
  card_cvv: string;
  payment_method_code: "credit_card" | "debit_card" | "bank_slip";
}

export interface PaymentProfileResponse {
  payment_profile?: {
    id: number;
    gateway_token: string;
    holder_name: string;
    payment_method_code: string;
    status: string;
  };
  errors?: Array<{ id: string; message: string }>;
}

export interface CreateBillPayload {
  customer_id: number;
  payment_method_code: "credit_card" | "bank_slip" | "pix";
  bill_items: Array<{ product_id?: number; amount: number; description: string; quantity: number }>;
  payment_profile?: { id: number; installments?: number };
  due_at?: string;         // Data de vencimento ISO8601
  code?: string;           // Referência interna
}

export interface BillResponse {
  bill?: {
    id: number;
    code: string;
    status: string;           // "pending" | "paid" | "canceled" | "reviewing"
    amount: number;
    due_at: string;
    charges?: Array<{
      id: number;
      status: string;
      amount: number;
      payment_method_code: string;
      last_transaction?: {
        id: number;
        status: string;
        gateway_response_message?: string;
        gateway_authorization?: string;
      };
    }>;
    period?: { bank_slip_url?: string };
  };
  errors?: Array<{ id: string; message: string }>;
}
