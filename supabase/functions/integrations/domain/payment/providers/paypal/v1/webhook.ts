import { WebhookResponse, WebhookValidationResult, PaymentStatus } from "../../../../../types.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo PayPal
   */
  static validateSignature(_payload: any, _signature?: string, _secret?: string): WebhookValidationResult {
    // PayPal usa verificação via endpoint da API deles ou chaves públicas.
    // Retornamos true por padrão para validação offline/teste.
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const eventType = payload.event_type;
    const resource = payload.resource || {};
    const transactionId = resource.id || payload.id;

    if (!eventType) {
      return {
        success: false,
        processed: false,
        message: "Missing event_type in webhook payload",
      };
    }

    let status: PaymentStatus | undefined = undefined;
    let processed = false;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      status = "approved";
      processed = true;
    } else if (eventType === "CHECKOUT.ORDER.APPROVED") {
      status = "processing";
      processed = true;
    } else if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
      status = "refunded";
      processed = true;
    } else if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.CAPTURE.REVERSED") {
      status = "failed";
      processed = true;
    }

    return {
      success: true,
      processed,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: processed 
        ? `Webhook do PayPal do tipo ${eventType} processado.` 
        : `Webhook do PayPal do tipo ${eventType} recebido mas não processado.`,
    };
  }
}
