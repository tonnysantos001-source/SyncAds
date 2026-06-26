import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  /**
   * Valida o formato e integridade das credenciais informadas pelo usuário
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.apiKey) {
      errors.push("Chave de API (apiKey) é obrigatória.");
    }
    if (!credentials.encryptionKey) {
      errors.push("Chave de Criptografia (encryptionKey) é obrigatória.");
    }
    if (credentials.apiKey && !credentials.apiKey.startsWith("sk_")) {
      errors.push("Chave de API inválida (deve começar com sk_).");
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
    if (!request.customer?.email) {
      errors.push("Email do cliente é obrigatório.");
    }
    if (!request.customer?.document) {
      errors.push("Documento do cliente é obrigatório.");
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
