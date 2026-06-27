import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.clientId?.trim()) errors.push("clientId é obrigatório. Obtido no Portal do Lojista SafraPay.");
    if (!credentials.clientSecret?.trim()) errors.push("clientSecret é obrigatório. Obtido no Portal do Lojista SafraPay.");
    return { isValid: errors.length === 0, errors };
  }

  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.orderId?.trim()) errors.push("orderId é obrigatório.");
    if (!request.amount || request.amount <= 0) errors.push("Valor do pagamento deve ser maior que zero.");
    if (!request.customer?.name?.trim()) errors.push("Nome do cliente é obrigatório.");
    if (!request.customer?.email?.includes("@")) errors.push("E-mail do cliente inválido ou ausente.");
    if (!request.customer?.document || request.customer.document.replace(/\D/g, "").length < 11) {
      errors.push("CPF/CNPJ do cliente é obrigatório (mínimo 11 dígitos).");
    }
    const method = request.paymentMethod;
    if ((method === "credit_card" || method === "debit_card") && !request.card?.number) {
      errors.push("Dados do cartão são obrigatórios para pagamento com cartão.");
    }
    return { isValid: errors.length === 0, errors };
  }
}
