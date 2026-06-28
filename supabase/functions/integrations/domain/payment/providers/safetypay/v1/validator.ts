import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.apiKey || credentials.apiKey.trim() === "") {
      errors.push("apiKey é obrigatório. Obtenha no painel do SafetyPay.");
    }
    if (!credentials.signatureKey || credentials.signatureKey.trim() === "") {
      errors.push("signatureKey é obrigatório. Obtenha no painel do SafetyPay.");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.orderId || request.orderId.trim() === "") {
      errors.push("ID do pedido (orderId) é obrigatório.");
    }
    if (!request.amount || request.amount <= 0) {
      errors.push("Valor do pagamento deve ser maior que zero.");
    }
    if (!request.customer?.name || request.customer.name.trim() === "") {
      errors.push("Nome do cliente é obrigatório.");
    }
    if (!request.customer?.email || !request.customer.email.includes("@")) {
      errors.push("E-mail do cliente inválido ou ausente.");
    }
    if (!request.customer?.document || request.customer.document.replace(/\D/g, "").length < 11) {
      errors.push("CPF/CNPJ do cliente é obrigatório.");
    }
    return { isValid: errors.length === 0, errors };
  }
}
