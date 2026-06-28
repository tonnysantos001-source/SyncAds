import { PaymentRequest } from "../../../../../types.ts";
export class Validator {
  static validateCredentials(c: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!c.accessToken?.trim()) errors.push("accessToken é obrigatório.");
    if (!c.locationId?.trim()) errors.push("locationId é obrigatório.");
    return { isValid: errors.length === 0, errors };
  }
  static validatePaymentRequest(r: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!r.orderId?.trim()) errors.push("orderId obrigatório.");
    if (!r.amount || r.amount <= 0) errors.push("amount inválido.");
    if (!r.customer?.email?.includes("@")) errors.push("E-mail inválido.");
    return { isValid: errors.length === 0, errors };
  }
}
