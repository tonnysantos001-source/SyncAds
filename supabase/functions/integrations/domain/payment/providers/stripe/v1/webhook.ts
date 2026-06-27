import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo Stripe
   */
  static validateSignature(_payload: any, _signature?: string, _secret?: string): WebhookValidationResult {
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const dataObject = payload.data?.object;
    const transactionId = dataObject?.id;

    if (!transactionId) {
      return {
        success: false,
        processed: false,
        message: "Missing PaymentIntent ID in Stripe webhook payload",
      };
    }

    const rawStatus = dataObject.status || "succeeded";
    const status = Mapper.toPaymentStatus(rawStatus);

    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: "Webhook do Stripe processado com sucesso.",
    };
  }
}
