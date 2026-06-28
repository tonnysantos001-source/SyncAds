export interface Credentials { username: string; password: string; }
export interface OrderLine { type: string; name: string; quantity: number; unit_price: number; total_amount: number; }
export interface CreateSessionPayload {
  purchase_country: string; purchase_currency: string; locale: string;
  order_amount: number; order_tax_amount: number;
  order_lines: OrderLine[];
  merchant_reference1?: string;
  billing_address?: { given_name: string; family_name: string; email: string };
}
export interface SessionResponse { session_id?: string; client_token?: string; status?: string; payment_method_categories?: any[]; }
export interface OrderResponse { order_id?: string; status?: string; purchase_amount?: number; fraud_status?: string; error_code?: string; error_messages?: string[]; }
