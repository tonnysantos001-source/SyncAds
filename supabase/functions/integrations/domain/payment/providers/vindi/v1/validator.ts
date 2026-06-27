import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.apiKey?.trim()) errors.push("apiKey é obrigatória. Obtida em Configurações > API no painel Vindi.");
    return { isValid: errors.length === 0, errors };
  }

  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.orderId?.trim()) errors.push("orderId é obrigatório.");
    if (!request.amount || request.amount <= 0) errors.push("Valor deve ser maior que zero.");
    if (!request.customer?.name?.trim()) errors.push("Nome do cliente é obrigatório.");
    if (!request.customer?.email?.includes("@")) errors.push("E-mail do cliente inválido.");
    return { isValid: errors.length === 0, errors };
  }
}
