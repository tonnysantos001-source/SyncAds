import { PaymentRequest } from "../../../../../types.ts";
export class Validator {
  static validateCredentials(c: any): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!c.clientId?.trim()) e.push("clientId obrigatório.");
    if (!c.clientSecret?.trim()) e.push("clientSecret obrigatório.");
    if (!c.resourceToken?.trim()) e.push("resourceToken obrigatório.");
    return { isValid: e.length === 0, errors: e };
  }
  static validatePaymentRequest(r: PaymentRequest): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!r.orderId?.trim()) e.push("orderId obrigatório.");
    if (!r.amount || r.amount <= 0) e.push("amount inválido.");
    if (!r.customer?.email?.includes("@")) e.push("E-mail inválido.");
    if (!r.customer?.document?.trim()) e.push("Documento CPF/CNPJ obrigatório.");
    return { isValid: e.length === 0, errors: e };
  }
}
