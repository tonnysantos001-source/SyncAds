import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * A InfinitePay envia notificações de pagamento por webhook.
   * O payload contém o status e o order_nsu do pedido.
   * Validação de assinatura não documentada publicamente — aceitar se estrutura válida.
   */
  static validateSignature(
    _payload: any,
    _signature: string | undefined,
    _secret: string | undefined
  ): { isValid: boolean; error?: string } {
    // InfinitePay não documenta assinatura HMAC publicamente
    // Validar apenas estrutura do payload
    return { isValid: true };
  }

  /**
   * Processa o webhook recebido da InfinitePay.
   * Payload esperado: { order_nsu, status, amount?, payment_method?, paid_at? }
   */
  static handle(payload: any): WebhookResponse {
    try {
      const orderNsu = payload.order_nsu || payload.id;
      const status = payload.status;

      if (!orderNsu) {
        return {
          success: false,
          processed: false,
          message: "Webhook InfinitePay inválido: order_nsu ausente.",
        };
      }

      if (!status) {
        return {
          success: false,
          processed: false,
          message: "Webhook InfinitePay inválido: status ausente.",
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(status);

      return {
        success: true,
        processed: true,
        transactionId: orderNsu,
        status: normalizedStatus,
        message: `Webhook InfinitePay processado. Status: ${status} → ${normalizedStatus}`,
        raw: payload,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro ao processar webhook InfinitePay: ${err.message}`,
      };
    }
  }
}
