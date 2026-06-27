import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  /**
   * Valida as credenciais do PagHiper.
   * Necessário: apiKey (começa com "apk_") e token.
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!credentials.apiKey || credentials.apiKey.trim() === "") {
      errors.push("apiKey é obrigatória. Obtenha em Minha Conta > Credenciais no painel PagHiper.");
    }

    if (!credentials.token || credentials.token.trim() === "") {
      errors.push("token é obrigatório. Gere em Minha Conta > Credenciais no painel PagHiper.");
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Valida o payload de um pedido de pagamento.
   */
  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.orderId || request.orderId.trim() === "") {
      errors.push("ID do pedido (orderId) é obrigatório.");
    }

    if (!request.amount || request.amount <= 0) {
      errors.push("Valor do pagamento deve ser maior que zero.");
    }

    if (!request.customer?.name || request.customer.name.trim() === "") {
      errors.push("Nome do cliente (customer.name) é obrigatório.");
    }

    if (!request.customer?.email || !request.customer.email.includes("@")) {
      errors.push("E-mail do cliente inválido ou ausente.");
    }

    if (!request.customer?.document || request.customer.document.replace(/\D/g, "").length < 11) {
      errors.push("CPF ou CNPJ do cliente (customer.document) é obrigatório e deve ter 11 ou 14 dígitos.");
    }

    if (!request.items || request.items.length === 0) {
      errors.push("Ao menos um item é obrigatório para o PagHiper.");
    }

    return { isValid: errors.length === 0, errors };
  }
}
