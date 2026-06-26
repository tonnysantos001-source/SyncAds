import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  /**
   * Valida o formato das credenciais do Mercado Pago
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.accessToken) {
      errors.push("Access Token (accessToken) do Mercado Pago é obrigatório.");
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida o payload de transação
   */
  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!request.customer?.email) {
      errors.push("Email do cliente é obrigatório.");
    }

    if (!request.amount || request.amount <= 0) {
      errors.push("Valor do pagamento inválido.");
    }

    // Mercado Pago exige identificação (CPF/CNPJ) para a maioria dos pagamentos (Pix/Boleto/Cartão)
    if (!request.customer?.document) {
      errors.push("Documento do portador (CPF/CNPJ) é obrigatório para processamento no Mercado Pago.");
    }

    if (request.paymentMethod === "credit_card" && !request.card) {
      errors.push("Dados do cartão de crédito são obrigatórios para este método.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
