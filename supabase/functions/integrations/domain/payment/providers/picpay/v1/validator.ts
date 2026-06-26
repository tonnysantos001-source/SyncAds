import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  /**
   * Valida o formato e integridade das credenciais informadas pelo usuário
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.picpayToken) {
      errors.push("PicPay Token (picpayToken) é obrigatório.");
    }
    if (!credentials.sellerToken) {
      errors.push("Seller Token (sellerToken) é obrigatório.");
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
    if (!request.customer?.name) {
      errors.push("Nome do cliente é obrigatório.");
    }
    if (!request.customer?.document) {
      errors.push("Documento do cliente é obrigatório.");
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
