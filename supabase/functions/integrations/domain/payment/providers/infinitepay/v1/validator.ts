import { PaymentRequest } from "../../../../../types.ts";
import { Credentials } from "./types.ts";

export class Validator {
  /**
   * Valida as credenciais do InfinitePay:
   * - handle: InfiniteTag da conta (sem o "$")
   * - clientId: obtido em Configurações > Credenciais
   * - clientSecret: obtido em Configurações > Credenciais
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!credentials.handle || typeof credentials.handle !== "string" || credentials.handle.trim() === "") {
      errors.push("handle (InfiniteTag) é obrigatório. Encontre no seu app InfinitePay (sem o '$').");
    }

    if (!credentials.clientId || typeof credentials.clientId !== "string" || credentials.clientId.trim() === "") {
      errors.push("clientId é obrigatório. Obtenha em Configurações > Credenciais no painel InfinitePay.");
    }

    if (!credentials.clientSecret || typeof credentials.clientSecret !== "string" || credentials.clientSecret.trim() === "") {
      errors.push("clientSecret é obrigatório. Obtenha em Configurações > Credenciais no painel InfinitePay.");
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Valida o payload de uma requisição de pagamento.
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
      errors.push("Nome do cliente é obrigatório.");
    }

    if (!request.customer?.email || !request.customer.email.includes("@")) {
      errors.push("E-mail do cliente inválido ou ausente.");
    }

    if (!request.items || request.items.length === 0) {
      errors.push("Ao menos um item é obrigatório para a InfinitePay.");
    }

    return { isValid: errors.length === 0, errors };
  }
}
