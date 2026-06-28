import { PaymentRequest } from "../../../../../types.ts";
export class Validator {
  static validateCredentials(c: any): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!c.apiKey?.trim()) e.push("apiKey obrigatória.");
    if (!c.apiLogin?.trim()) e.push("apiLogin obrigatório.");
    if (!c.merchantId?.trim()) e.push("merchantId obrigatório.");
    return { isValid: e.length === 0, errors: e };
  }
  static validatePaymentRequest(r: PaymentRequest): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!r.orderId?.trim()) e.push("orderId obrigatório.");
    if (!r.amount || r.amount <= 0) e.push("amount inválido.");
    if (!r.customer?.email?.includes("@")) e.push("E-mail inválido.");
    if (!r.customer?.name?.trim()) e.push("Nome do cliente obrigatório.");
    return { isValid: e.length === 0, errors: e };
  }
}
