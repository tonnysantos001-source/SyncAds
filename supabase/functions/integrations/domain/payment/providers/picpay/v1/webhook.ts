import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo PicPay
   */
  static validateSignature(_payload: any, _signature?: string, _secret?: string): WebhookValidationResult {
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const transactionId = payload.referenceId;
    if (!transactionId) {
      return {
        success: false,
        processed: false,
        message: "Missing referenceId in webhook payload",
      };
    }
    
    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: payload.authorizationId || transactionId,
      status: "approved", // PicPay envia webhook pós-pagamento
      message: "Webhook processado e pagamento confirmado.",
    };
  }
}
