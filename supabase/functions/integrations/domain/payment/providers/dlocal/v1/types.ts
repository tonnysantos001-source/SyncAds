export interface Credentials { xLogin: string; xTransKey: string; secretKey: string; }
export interface CreatePaymentPayload {
  amount: number; currency: string; country: string;
  payment_method_id: string; payment_method_flow: string;
  payer: { name: string; email: string; document?: string };
  card?: { holder_name: string; number: string; cvv: string; expiration_month: string; expiration_year: string };
  order_id: string; notification_url?: string; description?: string;
}
export interface DLocalPaymentResponse {
  id?: string; amount?: number; currency?: string; status?: string;
  payment_method_id?: string; payment_method_flow?: string; country?: string;
  payer?: { name: string; email: string; document?: string };
  order_id?: string; notification_url?: string;
  redirect_url?: string; ticket?: { number?: string; url?: string; img?: string };
  error_code?: string; message?: string;
}
