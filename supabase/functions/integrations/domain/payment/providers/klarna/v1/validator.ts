import { PaymentRequest } from "../../../../../types.ts";
export class Validator {
  static validateCredentials(c: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!c.username?.trim()) errors.push("username (UID) é obrigatório.");
    if (!c.password?.trim()) errors.push("password é obrigatório.");
    return { isValid: errors.length === 0, errors };
  }
  static validatePaymentRequest(r: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!r.orderId?.trim()) errors.push("orderId obrigatório.");
    if (!r.amount || r.amount <= 0) errors.push("amount inválido.");
    if (!r.customer?.email?.includes("@")) errors.push("E-mail inválido.");
    if (!r.customer?.name?.trim()) errors.push("Nome do cliente obrigatório.");
    return { isValid: errors.length === 0, errors };
  }
}
