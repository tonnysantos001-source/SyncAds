import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.apiKey?.trim()) errors.push("apiKey é obrigatória.");
    if (!credentials.merchantAccount?.trim()) errors.push("merchantAccount é obrigatório.");
    return { isValid: errors.length === 0, errors };
  }

  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.orderId?.trim()) errors.push("orderId é obrigatório.");
    if (!request.amount || request.amount <= 0) errors.push("amount deve ser maior que zero.");
    if (!request.customer?.email?.includes("@")) errors.push("E-mail do cliente inválido.");
    const method = request.paymentMethod;
    if (method === "credit_card" || method === "debit_card") {
      if (!request.card?.number) errors.push("Número do cartão é obrigatório.");
      if (!request.card?.cvv) errors.push("CVV é obrigatório.");
      if (!request.card?.holderName) errors.push("Nome do titular é obrigatório.");
    }
    return { isValid: errors.length === 0, errors };
  }
}
