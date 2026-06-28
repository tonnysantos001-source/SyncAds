import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(c: any): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!c.accessKey?.trim()) e.push("accessKey é obrigatório.");
    if (!c.secretKey?.trim()) e.push("secretKey é obrigatória.");
    if (!c.clientId?.trim()) e.push("clientId é obrigatório.");
    return { isValid: e.length === 0, errors: e };
  }

  static validatePaymentRequest(r: PaymentRequest): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!r.orderId?.trim()) e.push("orderId é obrigatório.");
    if (!r.amount || r.amount <= 0) e.push("amount inválido.");
    if (!r.customer?.email?.includes("@")) e.push("E-mail inválido.");
    return { isValid: e.length === 0, errors: e };
  }
}
