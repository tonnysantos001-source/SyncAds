import { PaymentRequest } from "../../../../../types.ts";
export class Validator {
  static validateCredentials(c: any): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!c.loginId?.trim()) e.push("loginId é obrigatório.");
    if (!c.transactionKey?.trim()) e.push("transactionKey é obrigatória.");
    return { isValid: e.length === 0, errors: e };
  }
  static validatePaymentRequest(r: PaymentRequest): { isValid: boolean; errors: string[] } {
    const e: string[] = [];
    if (!r.orderId?.trim()) e.push("orderId obrigatório.");
    if (!r.amount || r.amount <= 0) e.push("amount inválido.");
    if (!r.customer?.email?.includes("@")) e.push("E-mail inválido.");
    if ((r.paymentMethod === "credit_card" || r.paymentMethod === "debit_card") && !r.card?.number) e.push("Número do cartão obrigatório.");
    return { isValid: e.length === 0, errors: e };
  }
}
