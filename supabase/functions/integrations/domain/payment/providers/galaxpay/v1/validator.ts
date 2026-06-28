import { PaymentRequest } from "../../../../../types.ts";
export class Validator {
  static validateCredentials(c: any): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!c.galaxId?.trim()) e.push("galaxId obrigatório.");
    if (!c.galaxHash?.trim()) e.push("galaxHash obrigatório.");
    return { isValid: e.length === 0, errors: e };
  }
  static validatePaymentRequest(r: PaymentRequest): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!r.orderId?.trim()) e.push("orderId obrigatório.");
    if (!r.amount || r.amount <= 0) e.push("amount inválido.");
    if (!r.customer?.email?.includes("@")) e.push("E-mail inválido.");
    if (!r.customer?.document?.trim()) e.push("CPF/CNPJ obrigatório para GalaxPay.");
    return { isValid: e.length === 0, errors: e };
  }
}
