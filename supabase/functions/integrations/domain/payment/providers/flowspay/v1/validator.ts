import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  /**
   * Valida o formato e integridade das credenciais informadas pelo usuário
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.clientId) {
      errors.push("Client ID (clientId) é obrigatório para o Flowspay.");
    }
    if (!credentials.clientSecret) {
      errors.push("Client Secret (clientSecret) é obrigatório para o Flowspay.");
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

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
