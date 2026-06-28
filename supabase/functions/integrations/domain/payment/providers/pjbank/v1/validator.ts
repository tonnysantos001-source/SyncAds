import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(c: any): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!c.credencial?.trim()) e.push("credencial é obrigatória.");
    if (!c.chave?.trim()) e.push("chave (X-CHAVE) é obrigatória.");
    return { isValid: e.length === 0, errors: e };
  }

  static validatePaymentRequest(r: PaymentRequest): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!r.orderId?.trim()) e.push("orderId é obrigatório.");
    if (!r.amount || r.amount <= 0) e.push("amount inválido.");
    if (!r.customer?.email?.includes("@")) e.push("E-mail inválido.");
    if (!r.customer?.document?.trim()) e.push("CPF/CNPJ do cliente é obrigatório.");
    return { isValid: e.length === 0, errors: e };
  }
}
