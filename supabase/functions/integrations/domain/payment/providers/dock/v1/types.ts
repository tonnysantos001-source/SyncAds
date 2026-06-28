export interface Credentials {
  clientId: string;
  clientSecret: string;
}

export interface DockPaymentPayload {
  amount: number;
  description?: string;
  external_id: string;
  payment_method: string; // "PIX", "BOLETO", "CARD"
  customer: {
    name: string;
    document: string;
    email: string;
  };
}

export interface DockResponse {
  id?: string;
  status?: string; // "APPROVED", "PENDING", "FAILED", "CANCELLED"
  amount?: number;
  payment_url?: string;
  qr_code?: string;
  error?: string;
  message?: string;
}
