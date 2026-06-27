import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.merchantId || credentials.merchantId.trim() === "") {
      errors.push("merchantId é obrigatório. Obtido no portal MaxiPago! ao configurar sua conta.");
    }
    if (!credentials.merchantKey || credentials.merchantKey.trim() === "") {
      errors.push("merchantKey é obrigatório. Obtido no portal MaxiPago! ao configurar sua conta.");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.orderId || request.orderId.trim() === "") errors.push("ID do pedido (orderId) é obrigatório.");
    if (!request.amount || request.amount <= 0) errors.push("Valor do pagamento deve ser maior que zero.");
    if (!request.customer?.name || request.customer.name.trim() === "") errors.push("Nome do cliente é obrigatório.");
    if (!request.customer?.email || !request.customer.email.includes("@")) errors.push("E-mail do cliente inválido ou ausente.");
    if (request.paymentMethod === "credit_card" || request.paymentMethod === "debit_card") {
      if (!request.card?.number) errors.push("Número do cartão é obrigatório para pagamento com cartão.");
      if (!request.card?.expMonth) errors.push("Mês de expiração do cartão é obrigatório.");
      if (!request.card?.expYear) errors.push("Ano de expiração do cartão é obrigatório.");
      if (!request.card?.cvv) errors.push("CVV do cartão é obrigatório.");
      if (!request.card?.holderName) errors.push("Nome do titular do cartão é obrigatório.");
    }
    return { isValid: errors.length === 0, errors };
  }
}
