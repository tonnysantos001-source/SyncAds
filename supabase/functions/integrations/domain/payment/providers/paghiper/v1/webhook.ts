import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * PagHiper envia notificações via Retorno Automático (POST) com:
   * - transaction_id, order_id, status, value_cents, etc.
   * Não há assinatura HMAC — validar estrutura do payload.
   */
  static validateSignature(
    _payload: any,
    _signature: string | undefined,
    _secret: string | undefined
  ): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  /**
   * Processa o webhook de retorno automático da PagHiper.
   * PagHiper envia os dados como form-encoded ou JSON.
   */
  static handle(payload: any): WebhookResponse {
    try {
      // Suporte a resposta aninhada no campo "notification_request"
      const data = payload.notification_request || payload;

      const transactionId = data.transaction_id || data.id_notification;
      const orderId = data.order_id;
      const status = data.status;

      if (!transactionId) {
        return {
          success: false,
          processed: false,
          message: "Webhook PagHiper inválido: transaction_id ausente.",
        };
      }

      if (!status) {
        return {
          success: false,
          processed: false,
          message: "Webhook PagHiper inválido: status ausente.",
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(status);

      return {
        success: true,
        processed: true,
        transactionId,
        orderId,
        status: normalizedStatus,
        message: `Webhook PagHiper processado. Status: ${status} → ${normalizedStatus}`,
        raw: payload,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro ao processar webhook PagHiper: ${err.message}`,
      };
    }
  }
}
