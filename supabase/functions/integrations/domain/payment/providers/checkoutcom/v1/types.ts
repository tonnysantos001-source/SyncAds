export interface Credentials { secretKey: string; publicKey: string; }
export interface CardSource { type: "card"; number: string; expiry_month: number; expiry_year: number; cvv: string; name?: string; }
export interface PixSource { type: "pix"; }
export interface CreatePaymentPayload {
  amount: number; currency: string; source: CardSource | PixSource | Record<string,any>;
  reference?: string; description?: string; customer?: { email?: string; name?: string };
  "3ds"?: { enabled: boolean }; capture?: boolean;
}
export interface PaymentResponse {
  id?: string; status?: string; reference?: string; amount?: number; currency?: string;
  _links?: { "self"?: { href: string }; redirect?: { href: string } };
  error_type?: string; error_codes?: string[]; message?: string;
  approved?: boolean; payment_type?: string;
}
