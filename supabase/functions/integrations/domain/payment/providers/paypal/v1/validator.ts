import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  /**
   * Valida o formato e integridade das credenciais informadas pelo usuário
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.clientId) {
      errors.push("Client ID (clientId) é obrigatório.");
    }
    if (!credentials.clientSecret) {
      errors.push("Client Secret (clientSecret) é obrigatório.");
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida se os dados da transação contêm todos os campos requeridos
   */
  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.orderId) {
      errors.push("ID do pedido (orderId) é obrigatório.");
    }
    if (!request.customer?.email) {
      errors.push("Email do cliente é obrigatório.");
    }
    if (!request.amount || request.amount <= 0) {
      errors.push("Valor do pagamento inválido.");
    }
    
    // Se for cartão de crédito, precisa de dados do cartão
    if (request.paymentMethod === "credit_card") {
      if (!request.card) {
        errors.push("Dados do cartão são obrigatórios para pagamento via cartão de crédito.");
      } else {
        if (!request.card.number) errors.push("Número do cartão é obrigatório.");
        if (!request.card.holderName) errors.push("Nome do titular do cartão é obrigatório.");
        if (!request.card.expiryMonth) errors.push("Mês de expiração do cartão é obrigatório.");
        if (!request.card.expiryYear) errors.push("Ano de expiração do cartão é obrigatório.");
        if (!request.card.cvv) errors.push("CVV do cartão é obrigatório.");
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
