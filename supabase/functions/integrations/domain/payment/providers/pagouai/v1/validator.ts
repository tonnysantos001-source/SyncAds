import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  /**
   * Valida as credenciais do usuário para o Pagou.ai
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials || !credentials.apiKey) {
      errors.push("A Chave Secreta de API (apiKey) é obrigatória.");
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida a requisição de pagamento
   */
  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.customer?.email) {
      errors.push("O e-mail do cliente é obrigatório.");
    }
    if (!request.customer?.name) {
      errors.push("O nome do cliente é obrigatório.");
    }
    if (!request.customer?.document) {
      errors.push("O documento (CPF/CNPJ) do cliente é obrigatório.");
    }
    if (!request.amount || request.amount <= 0) {
      errors.push("O valor do pagamento deve ser maior que zero.");
    }
    if (request.paymentMethod === "credit_card" && !request.metadata?.token) {
      errors.push("O token do cartão é obrigatório para pagamentos via cartão de crédito (metadata.token).");
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
