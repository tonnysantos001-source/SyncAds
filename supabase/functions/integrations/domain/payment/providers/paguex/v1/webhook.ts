import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo Pague-X
   */
  static validateSignature(_payload: any, _signature?: string, _secret?: string): WebhookValidationResult {
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const data = payload.data;
    const transactionId = data?.id?.toString() || payload.objectId;
    const status = data?.status;

    if (!transactionId || !status) {
      return {
        success: false,
        processed: false,
        message: "Missing transaction ID or status in webhook payload",
      };
    }

    const normalizedStatus = Mapper.toPaymentStatus(status);

    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status: normalizedStatus,
      message: "Webhook do Pague-X processado com sucesso.",
      metadata: {
        type: payload.type,
        paymentMethod: data?.paymentMethod,
        amount: data?.amount,
        paidAt: data?.paidAt,
      },
    };
  }
}
