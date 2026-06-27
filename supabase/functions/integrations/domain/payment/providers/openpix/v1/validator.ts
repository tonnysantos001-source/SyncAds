import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  /**
   * OpenPix requer apenas o AppID para autenticar.
   * Obtido em app.woovi.com > API/Plugins > Nova Aplicação.
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!credentials.appId || credentials.appId.trim() === "") {
      errors.push("appId é obrigatório. Crie uma aplicação em app.woovi.com > API/Plugins.");
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Valida o pedido de pagamento.
   * OpenPix só processa PIX — validar método de pagamento.
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

    return { isValid: errors.length === 0, errors };
  }
}
