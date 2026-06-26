import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  /**
   * Valida as credenciais da HyperCash
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials || !credentials.secretKey) {
      errors.push("A Chave Secreta (secretKey) é obrigatória.");
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida os campos obrigatórios da cobrança
   */
  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.customer) {
      errors.push("Dados do cliente são obrigatórios.");
      return { isValid: false, errors };
    }

    if (!request.customer.name || request.customer.name.trim() === "") {
      errors.push("Nome do cliente é obrigatório.");
    }

    if (!request.customer.email || !request.customer.email.includes("@")) {
      errors.push("Email do cliente inválido ou ausente.");
    }

    const cleanDoc = (request.customer.document || "").replace(/\D/g, "");
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      errors.push("CPF ou CNPJ do cliente inválido. Deve conter 11 ou 14 dígitos numéricos.");
    }

    if (!request.amount || request.amount <= 0) {
      errors.push("O valor (amount) deve ser maior que zero.");
    }

    const allowedMethods = ["pix", "boleto", "credit_card"];
    if (!request.paymentMethod || !allowedMethods.includes(request.paymentMethod.toLowerCase())) {
      errors.push(`Método de pagamento inválido: ${request.paymentMethod}. Permitidos: ${allowedMethods.join(", ")}`);
    }

    // Se for cartão de crédito, validar campos do cartão ou token
    if (request.paymentMethod === "credit_card") {
      const hasToken = !!request.metadata?.token;
      const hasCardDetails = !!request.card || (
        request.metadata?.cardNumber &&
        request.metadata?.cardHolder &&
        request.metadata?.cardExpirationMonth &&
        request.metadata?.cardExpirationYear &&
        request.metadata?.cardCvv
      );

      if (!hasToken && !hasCardDetails) {
        errors.push("Para pagamento com Cartão de Crédito, envie os detalhes do cartão ou um token pré-gerado.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
