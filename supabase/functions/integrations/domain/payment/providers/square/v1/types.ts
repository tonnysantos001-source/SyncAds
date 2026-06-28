export interface Credentials { accessToken: string; locationId: string; }
export interface CreatePaymentPayload {
  source_id: string; idempotency_key: string; amount_money: { amount: number; currency: string };
  location_id: string; reference_id?: string; note?: string; buyer_email_address?: string;
}
export interface PaymentResponse {
  payment?: { id?: string; status?: string; amount_money?: { amount: number; currency: string }; order_id?: string; created_at?: string };
  errors?: Array<{ code: string; detail: string; category: string }>;
}
