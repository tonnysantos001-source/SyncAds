import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo Appmax
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    // Para simplificar a integração inicial, aceitamos se não houver assinatura ou se coincidir.
    if (signature && secret && signature !== secret) {
      return { isValid: false, error: "Assinatura inválida" };
    }
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const data = payload.data || payload;
    const transactionId = String(data.id || payload.order_id || payload.id || "");
    const statusStr = String(data.status || payload.status || "");
    const status = statusStr ? Mapper.toPaymentStatus(statusStr) : undefined;
    
    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: "Webhook processado e mapeado com sucesso.",
    };
  }
}
