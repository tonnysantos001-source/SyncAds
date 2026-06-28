import { PaymentRequest } from "../../../../../types.ts";
export class Validator {
  static validateCredentials(c: any): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!c.publishableKey?.trim()) e.push("publishableKey obrigatória.");
    if (!c.marketplaceId?.trim()) e.push("marketplaceId obrigatório.");
    return { isValid: e.length === 0, errors: e };
  }
  static validatePaymentRequest(r: PaymentRequest): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!r.orderId?.trim()) e.push("orderId obrigatório.");
    if (!r.amount || r.amount <= 0) e.push("amount inválido.");
    if (!r.customer?.email?.includes("@")) e.push("E-mail inválido.");
    return { isValid: e.length === 0, errors: e };
  }
}
