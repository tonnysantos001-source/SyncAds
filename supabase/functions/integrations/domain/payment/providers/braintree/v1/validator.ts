import { PaymentRequest } from "../../../../../types.ts";
export class Validator {
  static validateCredentials(c: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!c.merchantId?.trim()) errors.push("merchantId é obrigatório.");
    if (!c.publicKey?.trim()) errors.push("publicKey é obrigatória.");
    if (!c.privateKey?.trim()) errors.push("privateKey é obrigatória.");
    return { isValid: errors.length === 0, errors };
  }
  static validatePaymentRequest(r: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!r.orderId?.trim()) errors.push("orderId é obrigatório.");
    if (!r.amount || r.amount <= 0) errors.push("amount inválido.");
    if (!r.customer?.email?.includes("@")) errors.push("E-mail inválido.");
    const m = r.paymentMethod;
    if (m === "credit_card" || m === "debit_card") {
      if (!r.card?.number) errors.push("Número do cartão é obrigatório.");
      if (!r.card?.cvv) errors.push("CVV é obrigatório.");
      if (!r.card?.holderName) errors.push("Nome do titular é obrigatório.");
    }
    return { isValid: errors.length === 0, errors };
  }
}
