import { PaymentRequest } from "../../../../../types.ts";
export class Validator {
  static validateCredentials(c: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!c.secretKey?.trim()) errors.push("secretKey é obrigatória.");
    if (!c.publicKey?.trim()) errors.push("publicKey é obrigatória.");
    return { isValid: errors.length === 0, errors };
  }
  static validatePaymentRequest(r: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!r.orderId?.trim()) errors.push("orderId obrigatório.");
    if (!r.amount || r.amount <= 0) errors.push("amount inválido.");
    if (!r.customer?.email?.includes("@")) errors.push("E-mail inválido.");
    if ((r.paymentMethod === "credit_card" || r.paymentMethod === "debit_card") && !r.card?.number) errors.push("Dados do cartão obrigatórios.");
    return { isValid: errors.length === 0, errors };
  }
}
