export interface Credentials { clientId: string; clientSecret: string; resourceToken: string; }
export interface JunoChargePayload {
  charge: { description: string; amount: number; references?: string[]; dueDate?: string; paymentTypes?: string[]; maxOverdueDays?: number };
  billing: { name: string; document: string; email: string; phone?: string };
}
export interface JunoChargeResponse { id?: string; code?: string; status?: string; amount?: number; link?: string; checkoutUrl?: string; payments?: any[]; embedLink?: string; error?: string; details?: Array<{ field: string; message: string }> }
