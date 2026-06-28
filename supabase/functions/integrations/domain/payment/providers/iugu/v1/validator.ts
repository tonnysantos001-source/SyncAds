import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.apiToken || credentials.apiToken.trim() === "") {
      errors.push("apiToken é obrigatório. Obtenha no painel da Iugu.");
    }
    if (!credentials.accountId || credentials.accountId.trim() === "") {
      errors.push("accountId é obrigatório. Obtenha no painel da Iugu.");
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

    const method = request.paymentMethod;
    if (method === "credit_card" || method === "debit_card") {
      if (!request.card?.number) errors.push("Número do cartão é obrigatório.");
      if (!request.card?.expMonth && !request.card?.expiryMonth) {
        errors.push("Mês de expiração do cartão é obrigatório.");
      }
      if (!request.card?.expYear && !request.card?.expiryYear) {
        errors.push("Ano de expiração do cartão é obrigatório.");
      }
      if (!request.card?.cvv) errors.push("CVV do cartão é obrigatório.");
      if (!request.card?.holderName) errors.push("Nome do titular do cartão é obrigatório.");
    }

    return { isValid: errors.length === 0, errors };
  }
}
