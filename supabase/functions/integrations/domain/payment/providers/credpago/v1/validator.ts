import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  /**
   * Valida o formato e integridade das credenciais informadas pelo usuário
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.partnerId) {
      errors.push("Partner ID (partnerId) é obrigatório para o CredPago.");
    }
    if (!credentials.apiKey) {
      errors.push("Chave de API (apiKey) é obrigatória para o CredPago.");
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
