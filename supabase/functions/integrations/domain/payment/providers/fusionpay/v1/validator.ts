import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.apiKey) errors.push("API Key (apiKey) é obrigatório para o FusionPay.");
    if (!credentials.secretKey) errors.push("Secret Key (secretKey) é obrigatório para o FusionPay.");
    return { isValid: errors.length === 0, errors };
  }

  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.orderId) errors.push("ID do pedido (orderId) é obrigatório.");
    if (!request.customer?.email) errors.push("Email do cliente é obrigatório.");
    if (!request.amount || request.amount <= 0) errors.push("Valor do pagamento inválido.");
    return { isValid: errors.length === 0, errors };
  }
}
