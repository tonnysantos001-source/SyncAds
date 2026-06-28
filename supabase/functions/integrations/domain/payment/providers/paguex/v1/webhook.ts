import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(
    _payload: any,
    _signature: string | undefined,
    _secret: string | undefined
  ): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  /**
   * Processa o webhook da Pague-X.
   */
  static handle(payload: any): WebhookResponse {
    try {
      const data = payload.data;
      const transactionId = data?.id?.toString() || payload.objectId;
      const status = data?.status || payload.status;

      if (!transactionId) {
        return {
          success: false,
          processed: false,
          message: "Webhook Pague-X inválido: transaction_id/id/objectId ausente.",
        };
      }

      if (!status) {
        return {
          success: false,
          processed: false,
          message: "Webhook Pague-X inválido: status ausente.",
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(status);

      return {
        success: true,
        processed: true,
        transactionId,
        status: normalizedStatus,
        message: `Webhook Pague-X: ${status} → ${normalizedStatus}`,
        raw: payload,
        metadata: {
          type: payload.type,
          paymentMethod: data?.paymentMethod,
          amount: data?.amount,
          paidAt: data?.paidAt,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro webhook Pague-X: ${err.message}`,
      };
    }
  }
}
