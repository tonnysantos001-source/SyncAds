import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.clientId?.trim()) errors.push("clientId é obrigatório. Solicite em produtosapi@userede.com.br.");
    if (!credentials.clientSecret?.trim()) errors.push("clientSecret é obrigatório. Solicite em produtosapi@userede.com.br.");
    return { isValid: errors.length === 0, errors };
  }

  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.orderId?.trim()) errors.push("orderId é obrigatório.");
    if (!request.amount || request.amount <= 0) errors.push("Valor deve ser maior que zero.");
    if (!request.customer?.name?.trim()) errors.push("Nome do cliente é obrigatório.");
    if (!request.customer?.email?.includes("@")) errors.push("E-mail inválido.");
    if ((request.paymentMethod === "credit_card" || request.paymentMethod === "debit_card") && !request.card?.number) {
      errors.push("Dados do cartão são obrigatórios para pagamento com cartão.");
    }
    return { isValid: errors.length === 0, errors };
  }
}
